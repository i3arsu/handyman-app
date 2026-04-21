import { useEffect, useRef } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSearchRadius } from '@/hooks/useSearchRadius';
import { getDistanceKm } from '@/utils/geo';
import { Job } from '@/types/database';

// Mount-and-forget component that subscribes to `jobs` INSERTs while the
// handyman is logged in, and inserts a `new_nearby_job` notification for
// the current user when a new job lands within their search radius.
//
// Lives in the client because the search radius is stored in AsyncStorage —
// the backend has no access to it, so Postgres triggers can't fan out
// by proximity. If we later persist radius server-side, this can move to
// a trigger and we'd delete this component.
//
// Renders nothing.
export const NearbyJobAlerts = () => {
  const { user } = useAuth();
  const { location } = useUserLocation();
  const { radiusKm } = useSearchRadius();

  // Keep the latest filter values in refs so the subscription effect only
  // depends on `user` — re-subscribing on every location/radius change would
  // churn realtime channels.
  const locationRef = useRef(location);
  const radiusRef = useRef(radiusKm);

  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { radiusRef.current = radiusKm; }, [radiusKm]);

  useEffect(() => {
    if (!user) return;

    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`nearby-alerts:${user.id}:${suffix}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        async (payload) => {
          const job = payload.new as Job;
          if (job.status !== 'open') return;

          const loc = locationRef.current;
          if (!loc || job.location_lat == null || job.location_lng == null) {
            return;
          }

          const distance = getDistanceKm(
            loc.latitude,
            loc.longitude,
            job.location_lat,
            job.location_lng,
          );
          if (distance > radiusRef.current) return;

          const distanceLabel =
            distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance.toFixed(1)} km`;

          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'new_nearby_job',
            title: 'New job nearby',
            body: `"${job.title}" was just posted ${distanceLabel} away.`,
            job_id: job.id,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};

import { useCallback, useState, useEffect, useRef } from 'react';

import { supabase } from '@/services/supabase';
import { Job, Profile } from '@/types/database';

interface UseJobResult {
  job: Job | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface JobApplicationRow {
  status: string;
  handyman_id: string;
}

// Fetch a single job by ID and subscribe to real-time status changes.
export const useJob = (jobId: string): UseJobResult => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unique channel suffix per hook instance so multiple components (e.g.
  // JobProgressScreen + ChatScreen) subscribing to the same job don't collide
  // on a shared channel name — which triggers "cannot add postgres_changes
  // callbacks after subscribe()".
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));

  // Stable fetcher ref so realtime callbacks and the imperative refetch()
  // don't need to be in the effect deps — which would re-subscribe channels
  // and throw "cannot add postgres_changes callbacks after subscribe()".
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;

    const fetchJob = async () => {
      try {
        const { data: jobRow, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (cancelled) return;
        if (jobError) {
          setError(jobError.message);
          return;
        }
        if (!jobRow) {
          setError('Job not found.');
          return;
        }

        const baseJob = jobRow as Job;

        const { data: clientRow, error: clientError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, role, created_at')
          .eq('id', baseJob.client_id)
          .maybeSingle();

        if (cancelled) return;
        if (clientError) {
          setError(clientError.message);
          return;
        }

        const { data: appsRows, error: appsError } = await supabase
          .from('job_applications')
          .select('status, handyman_id')
          .eq('job_id', jobId);

        if (cancelled) return;
        if (appsError) {
          setError(appsError.message);
          return;
        }

        const apps = (appsRows ?? []) as JobApplicationRow[];

        // Fallback: if no accepted application row exists but the job has a
        // handyman_id assigned, synthesize one so downstream UI (Your Pro card,
        // chat entry) can resolve the assigned pro.
        const hasAccepted = apps.some(a => a.status === 'accepted');
        if (!hasAccepted && baseJob.handyman_id) {
          apps.push({ status: 'accepted', handyman_id: baseJob.handyman_id });
        }

        const handymanIds = Array.from(new Set(apps.map(a => a.handyman_id)));

        type HandymanLite = Pick<Profile, 'id' | 'full_name' | 'email'>;
        let handymenById: Record<string, HandymanLite> = {};
        if (handymanIds.length > 0) {
          const { data: handymenRows, error: handymenError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', handymanIds);

          if (cancelled) return;
          if (handymenError) {
            setError(handymenError.message);
            return;
          }

          handymenById = (handymenRows ?? []).reduce<Record<string, HandymanLite>>(
            (acc, p) => { acc[p.id] = p as HandymanLite; return acc; },
            {},
          );
        }

        setJob({
          ...baseJob,
          client: (clientRow ?? undefined) as Profile | undefined,
          job_applications: apps.map(a => {
            const h = handymenById[a.handyman_id];
            return {
              status: a.status,
              handyman: h
                ? { id: h.id, full_name: h.full_name ?? h.email.split('@')[0] ?? 'Pro' }
                : null,
            };
          }),
        });
        setError(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRef.current = fetchJob;
    fetchJob();

    const suffix = channelIdRef.current;

    const jobChannel = supabase
      .channel(`job-detail:${jobId}:${suffix}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
        () => { fetchRef.current(); },
      )
      .subscribe();

    const appsChannel = supabase
      .channel(`job-apps:${jobId}:${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications', filter: `job_id=eq.${jobId}` },
        () => { fetchRef.current(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(jobChannel);
      supabase.removeChannel(appsChannel);
    };
  }, [jobId]);

  const refetch = useCallback(() => { fetchRef.current(); }, []);

  return { job, isLoading, error, refetch };
};

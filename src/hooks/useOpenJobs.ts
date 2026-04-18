import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Job } from '@/types/database';

interface UseOpenJobsResult {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface ApplicationRow { job_id: string; }

// Fetches all open jobs the current handyman hasn't already applied to,
// ordered by creation date descending (newest first). Already-applied jobs
// live under the handyman's "Applied" tab and are hidden from the browse list.
//
// Realtime: subscribes to `jobs` (any event) and to the handyman's own
// `job_applications` so the browse feed updates live when a client posts a
// new job, a job leaves `open`, or this handyman applies/unapplies.
export const useOpenJobs = (): UseOpenJobsResult => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable fetcher so realtime callbacks don't re-run the effect (which would
  // re-subscribe channels and throw the "cannot add postgres_changes callbacks
  // after subscribe()" error).
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  // Unique channel suffix per hook instance to avoid shared-channel collisions
  // across StrictMode / focus remounts.
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (jobsError) {
          setError(jobsError.message);
          return;
        }

        const allOpen = (jobsData ?? []) as Job[];

        if (!user || allOpen.length === 0) {
          setJobs(allOpen);
          return;
        }

        const { data: appRows, error: appError } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('handyman_id', user.id);

        if (cancelled) return;
        if (appError) {
          setError(appError.message);
          return;
        }

        const appliedIds = new Set(((appRows ?? []) as ApplicationRow[]).map(a => a.job_id));
        setJobs(allOpen.filter(j => !appliedIds.has(j.id)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRef.current = fetchAll;
    fetchAll();

    const suffix = channelIdRef.current;

    const jobsChannel = supabase
      .channel(`open-jobs:${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => { fetchRef.current(); },
      )
      .subscribe();

    const appsChannel = user
      ? supabase
          .channel(`open-jobs-apps:${user.id}:${suffix}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'job_applications',
              filter: `handyman_id=eq.${user.id}`,
            },
            () => { fetchRef.current(); },
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      supabase.removeChannel(jobsChannel);
      if (appsChannel) supabase.removeChannel(appsChannel);
    };
  }, [user]);

  const refetch = useCallback(() => { fetchRef.current(); }, []);

  return { jobs, isLoading, error, refetch };
};

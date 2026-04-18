import { useEffect, useState } from 'react';
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
export const useOpenJobs = (): UseOpenJobsResult => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
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

    fetch();
    return () => { cancelled = true; };
  }, [tick, user]);

  return { jobs, isLoading, error, refetch: () => setTick(t => t + 1) };
};

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Job } from '@/types/database';

interface UseOpenJobsResult {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Fetches all open jobs for the handyman map/list dashboard,
// ordered by creation date descending (newest first).
export const useOpenJobs = (): UseOpenJobsResult => {
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
        const { data, error: dbError } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (dbError) {
          setError(dbError.message);
        } else {
          setJobs((data ?? []) as Job[]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [tick]);

  return { jobs, isLoading, error, refetch: () => setTick(t => t + 1) };
};

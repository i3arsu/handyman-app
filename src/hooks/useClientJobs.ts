import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Job, JobStatus } from '@/types/database';

interface UseClientJobsResult {
  activeJobs: Job[];
  pastJobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ACTIVE_STATUSES: JobStatus[] = ['open', 'accepted', 'in_progress'];
const PAST_STATUSES: JobStatus[]   = ['completed', 'cancelled'];

export const useClientJobs = (): UseClientJobsResult => {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setActiveJobs([]);
      setPastJobs([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from('jobs')
          .select(`
            *,
            job_applications (
              id, status,
              handyman:profiles!handyman_id (id, full_name, avatar_url)
            )
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (dbError) {
          setError(dbError.message);
        } else {
          const all = (data ?? []) as Job[];
          setActiveJobs(all.filter(j => ACTIVE_STATUSES.includes(j.status)));
          setPastJobs(all.filter(j => PAST_STATUSES.includes(j.status)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [user, tick]);

  return { activeJobs, pastJobs, isLoading, error, refetch: () => setTick(t => t + 1) };
};

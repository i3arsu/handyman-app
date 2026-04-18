import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Job, JobStatus, Profile } from '@/types/database';

interface UseHandymanJobsResult {
  activeJobs: Job[];
  pastJobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ACTIVE_STATUSES: JobStatus[] = ['accepted', 'in_progress'];
const PAST_STATUSES: JobStatus[]   = ['completed', 'cancelled'];

export const useHandymanJobs = (): UseHandymanJobsResult => {
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

    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: jobsData, error: dbError } = await supabase
          .from('jobs')
          .select('*')
          .eq('handyman_id', user.id)
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (dbError) {
          setError(dbError.message);
          return;
        }

        const jobsRows = (jobsData ?? []) as Job[];
        const clientIds = Array.from(new Set(jobsRows.map(j => j.client_id)));

        let clientsById: Record<string, Profile> = {};
        if (clientIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, role, created_at')
            .in('id', clientIds);

          if (cancelled) return;

          if (profilesError) {
            setError(profilesError.message);
            return;
          }

          clientsById = ((profilesData ?? []) as Profile[]).reduce<Record<string, Profile>>(
            (acc, p) => { acc[p.id] = p; return acc; },
            {},
          );
        }

        const enriched = jobsRows.map<Job>(j => ({ ...j, client: clientsById[j.client_id] }));
        setActiveJobs(enriched.filter(j => ACTIVE_STATUSES.includes(j.status)));
        setPastJobs(enriched.filter(j => PAST_STATUSES.includes(j.status)));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchJobs();

    const channel = supabase
      .channel(`handyman-jobs:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `handyman_id=eq.${user.id}` },
        () => { fetchJobs(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { activeJobs, pastJobs, isLoading, error, refetch };
};

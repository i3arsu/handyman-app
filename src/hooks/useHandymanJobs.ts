import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Job, JobStatus, Profile } from '@/types/database';

interface UseHandymanJobsResult {
  appliedJobs: Job[];
  activeJobs: Job[];
  pastJobs: Job[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ACTIVE_STATUSES: JobStatus[] = ['accepted', 'in_progress'];
const PAST_STATUSES: JobStatus[]   = ['completed', 'cancelled'];

interface PendingApplicationRow {
  job_id: string;
}

export const useHandymanJobs = (): UseHandymanJobsResult => {
  const { user } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable fetcher ref so refetch / realtime callbacks don't re-create the
  // effect (which was re-subscribing channels and throwing the
  // "cannot add postgres_changes callbacks after subscribe" error).
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  // Unique channel suffix per hook instance to avoid shared-channel collisions
  // when multiple mounts (StrictMode, focus remounts) race on the same name.
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!user) {
      setAppliedJobs([]);
      setActiveJobs([]);
      setPastJobs([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: assignedRows, error: assignedError } = await supabase
          .from('jobs')
          .select('*')
          .eq('handyman_id', user.id)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (assignedError) {
          setError(assignedError.message);
          return;
        }

        const { data: appRows, error: appError } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('handyman_id', user.id)
          .eq('status', 'pending');

        if (cancelled) return;
        if (appError) {
          setError(appError.message);
          return;
        }

        const pendingJobIds = ((appRows ?? []) as PendingApplicationRow[]).map(a => a.job_id);

        let pendingJobs: Job[] = [];
        if (pendingJobIds.length > 0) {
          const { data: pendingRows, error: pendingError } = await supabase
            .from('jobs')
            .select('*')
            .in('id', pendingJobIds)
            .order('created_at', { ascending: false });

          if (cancelled) return;
          if (pendingError) {
            setError(pendingError.message);
            return;
          }
          pendingJobs = (pendingRows ?? []) as Job[];
        }

        const assignedJobs = (assignedRows ?? []) as Job[];
        const allJobs = [...assignedJobs, ...pendingJobs];
        const clientIds = Array.from(new Set(allJobs.map(j => j.client_id)));

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

        const enrich = (j: Job): Job => ({ ...j, client: clientsById[j.client_id] });

        setAppliedJobs(pendingJobs.map(enrich));
        setActiveJobs(assignedJobs.filter(j => ACTIVE_STATUSES.includes(j.status)).map(enrich));
        setPastJobs(assignedJobs.filter(j => PAST_STATUSES.includes(j.status)).map(enrich));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRef.current = fetchAll;
    fetchAll();

    const suffix = channelIdRef.current;

    const jobsChannel = supabase
      .channel(`handyman-jobs:${user.id}:${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `handyman_id=eq.${user.id}` },
        () => { fetchRef.current(); },
      )
      .subscribe();

    const appsChannel = supabase
      .channel(`handyman-apps:${user.id}:${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications', filter: `handyman_id=eq.${user.id}` },
        () => { fetchRef.current(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(appsChannel);
    };
  }, [user]);

  const refetch = useCallback(() => { fetchRef.current(); }, []);

  return { appliedJobs, activeJobs, pastJobs, isLoading, error, refetch };
};

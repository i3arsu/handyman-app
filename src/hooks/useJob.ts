import { useState, useEffect } from 'react';

import { supabase } from '@/services/supabase';
import { Job, Profile } from '@/types/database';

interface UseJobResult {
  job: Job | null;
  isLoading: boolean;
  error: string | null;
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

        let handymenById: Record<string, Pick<Profile, 'id' | 'full_name'>> = {};
        if (handymanIds.length > 0) {
          const { data: handymenRows, error: handymenError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', handymanIds);

          if (cancelled) return;
          if (handymenError) {
            setError(handymenError.message);
            return;
          }

          handymenById = (handymenRows ?? []).reduce<Record<string, Pick<Profile, 'id' | 'full_name'>>>(
            (acc, p) => { acc[p.id] = p; return acc; },
            {},
          );
        }

        setJob({
          ...baseJob,
          client: (clientRow ?? undefined) as Profile | undefined,
          job_applications: apps.map(a => ({
            status: a.status,
            handyman: handymenById[a.handyman_id] ?? null,
          })),
        });
        setError(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchJob();

    const channel = supabase
      .channel(`job-detail:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
        () => { fetchJob(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, isLoading, error };
};

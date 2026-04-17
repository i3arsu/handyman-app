import { useState, useEffect } from 'react';

import { supabase } from '@/services/supabase';
import { Job } from '@/types/database';

interface UseJobResult {
  job: Job | null;
  isLoading: boolean;
  error: string | null;
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
        const { data, error: fetchError } = await supabase
          .from('jobs')
          .select(`
            *,
            client:profiles!jobs_client_id_fkey(id, full_name, email),
            job_applications(
              status,
              handyman:profiles!job_applications_handyman_id_fkey(id, full_name)
            )
          `)
          .eq('id', jobId)
          .single();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setJob(data as Job);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load job.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchJob();

    // Real-time: re-fetch when job row is updated
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

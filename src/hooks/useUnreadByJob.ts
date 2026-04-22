import { useEffect, useRef, useState } from 'react';

import { supabase } from '@/services/supabase';
import { getChatReadAt, subscribeChatReads } from '@/services/chatReads';
import { useAuth } from '@/store/AuthContext';

export const useUnreadByJob = (jobIds: string[]): Record<string, number> => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Stable key so an identical id set doesn't refetch on every parent render.
  const idsKey = jobIds.slice().sort().join(',');
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!user || jobIds.length === 0) {
      setCounts({});
      return;
    }

    let cancelled = false;

    const recalcAll = async () => {
      const result: Record<string, number> = {};
      await Promise.all(
        jobIds.map(async (jobId) => {
          const lastRead = await getChatReadAt(jobId);
          let query = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('job_id', jobId)
            .neq('sender_id', user.id);
          if (lastRead) query = query.gt('created_at', lastRead);
          const { count } = await query;
          result[jobId] = count ?? 0;
        }),
      );
      if (!cancelled) setCounts(result);
    };

    recalcAll();

    const unsubReads = subscribeChatReads((jobId) => {
      if (!jobIds.includes(jobId)) return;
      setCounts((prev) => ({ ...prev, [jobId]: 0 }));
    });

    const channel = supabase
      .channel(`unread-messages:${user.id}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as { job_id: string; sender_id: string };
          if (m.sender_id === user.id) return;
          if (!jobIds.includes(m.job_id)) return;
          setCounts((prev) => ({ ...prev, [m.job_id]: (prev[m.job_id] ?? 0) + 1 }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      unsubReads();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, user?.id]);

  return counts;
};

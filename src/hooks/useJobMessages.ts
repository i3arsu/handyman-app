import { useState, useEffect, useCallback, useRef } from 'react';

import { supabase } from '@/services/supabase';
import { fetchProfilesByIds } from '@/services/profiles';
import { Message, Profile } from '@/types/database';

interface UseJobMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, senderId: string) => Promise<void>;
}

type SenderLite = Pick<Profile, 'id' | 'full_name' | 'role'>;

const enrich = (rows: Message[], sendersById: Record<string, SenderLite>): Message[] =>
  rows.map(r => ({ ...r, sender: sendersById[r.sender_id] as Profile | undefined }));

export const useJobMessages = (jobId: string): UseJobMessagesResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unique channel suffix per hook instance to avoid shared-channel collisions.
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));

  const resolveSenders = useCallback(
    (senderIds: string[]): Promise<Record<string, SenderLite>> =>
      fetchProfilesByIds<SenderLite>(senderIds, 'id, full_name, role'),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('messages')
          .select('*')
          .eq('job_id', jobId)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (dbError) {
          setError(dbError.message);
          return;
        }

        const rows = (data ?? []) as Message[];
        const senderIds = Array.from(new Set(rows.map(r => r.sender_id)));
        const senders = await resolveSenders(senderIds);
        if (cancelled) return;

        setMessages(enrich(rows, senders));
        setError(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${jobId}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          const incoming = payload.new as Message;
          const senders = await resolveSenders([incoming.sender_id]);
          if (cancelled) return;

          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            // Replace any optimistic row from this sender with matching content,
            // preserving order.
            const withoutOptimistic = prev.filter(
              m => !(m.id.startsWith('opt-') && m.sender_id === incoming.sender_id && m.content === incoming.content),
            );
            return [...withoutOptimistic, { ...incoming, sender: senders[incoming.sender_id] as Profile | undefined }];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId, resolveSenders]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      job_id: jobId,
      sender_id: senderId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    const { error: insertError } = await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: senderId,
      content: trimmed,
    });

    if (insertError) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setError(insertError.message);
    }
  }, [jobId]);

  return { messages, isLoading, error, sendMessage };
};

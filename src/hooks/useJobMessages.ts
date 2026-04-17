import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/services/supabase';
import { Message } from '@/types/database';

interface UseJobMessagesResult {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, senderId: string) => Promise<void>;
}

export const useJobMessages = (jobId: string): UseJobMessagesResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, role)')
          .eq('job_id', jobId)
          .order('created_at', { ascending: true });

        if (!cancelled && data) setMessages(data as Message[]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchMessages();

    // Real-time: append new messages as they arrive
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          // Fetch the full row with sender join so we have the sender profile
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, role)')
            .eq('id', (payload.new as Message).id)
            .single();

          if (!cancelled && data) {
            setMessages(prev => {
              // Avoid duplicates (local optimistic insert may already exist)
              if (prev.some(m => m.id === (data as Message).id)) return prev;
              return [...prev, data as Message];
            });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Optimistic insert (temporary ID, no sender join)
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      job_id: jobId,
      sender_id: senderId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { error } = await supabase.from('messages').insert({
        job_id: jobId,
        sender_id: senderId,
        content: trimmed,
      });
      if (error) throw error;
      // The real-time subscription will replace the optimistic entry
    } catch {
      // Roll back optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  }, [jobId]);

  return { messages, isLoading, sendMessage };
};

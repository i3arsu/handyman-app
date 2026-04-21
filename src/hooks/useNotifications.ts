import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Notification } from '@/types/database';

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => void;
}

// Fetches the current user's in-app notifications and subscribes to INSERTs
// via Supabase Realtime. `notifications` is ordered newest-first.
//
// Reads are authoritative against RLS (user_id = auth.uid()), so no extra
// filtering is needed on the client.
export const useNotifications = (): UseNotificationsResult => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef<() => Promise<void>>(async () => {});
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
          return;
        }
        setNotifications((data ?? []) as Notification[]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRef.current = fetchAll;
    fetchAll();

    const suffix = channelIdRef.current;
    const channel = supabase
      .channel(`notifications:${user.id}:${suffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as Notification;
          setNotifications((prev) =>
            prev.some((n) => n.id === row.id) ? prev : [row, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refetch = useCallback(() => {
    fetchRef.current();
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (updateError) {
      setError(updateError.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (updateError) {
      setError(updateError.message);
    }
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => (n.read ? acc : acc + 1), 0),
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  };
};

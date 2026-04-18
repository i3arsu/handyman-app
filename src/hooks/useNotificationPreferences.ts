import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export interface NotificationPreferences {
  notif_push: boolean;
  notif_email_marketing: boolean;
  notif_sms: boolean;
}

interface UseNotificationPreferencesResult {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  setPreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
}

const DEFAULTS: NotificationPreferences = {
  notif_push: true,
  notif_email_marketing: false,
  notif_sms: true,
};

// Reads the three notification toggle columns off the current user's
// profile row and persists updates optimistically. Rolls back on failure.
export const useNotificationPreferences = (): UseNotificationPreferencesResult => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPrefs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('notif_push, notif_email_marketing, notif_sms')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (dbError) {
          setError(dbError.message);
          setPreferences(DEFAULTS);
          return;
        }

        setPreferences((data ?? DEFAULTS) as NotificationPreferences);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPrefs();
    return () => { cancelled = true; };
  }, [user]);

  const setPreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!user || !preferences) return;

      const previous = preferences[key];
      setPreferences({ ...preferences, [key]: value });

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', user.id);

      if (updateError) {
        setPreferences((prev) => (prev ? { ...prev, [key]: previous } : prev));
        setError(updateError.message);
      }
    },
    [user, preferences],
  );

  return { preferences, isLoading, error, setPreference };
};

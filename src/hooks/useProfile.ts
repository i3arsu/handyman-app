import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { Profile } from '@/types/database';

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useProfile = (): UseProfileResult => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (dbError) {
          setError(dbError.message);
        } else {
          setProfile(data as Profile);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [user, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { profile, isLoading, error, refetch };
};

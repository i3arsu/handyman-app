import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { clearProfilesCache } from '@/services/profiles';
import { UserRole } from '@/types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate session from AsyncStorage on first mount
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial);
      setIsLoading(false);
    });

    // Keep session in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, updatedSession) => {
        if (event === 'SIGNED_OUT') clearProfilesCache();
        setSession(updatedSession);
        setIsLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  // Role is written into user_metadata at sign-up:
  //   supabase.auth.signUp({ email, password, options: { data: { role: 'client' } } })
  const role = (user?.user_metadata?.role as UserRole) ?? null;

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

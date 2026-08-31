import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import type { User } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const loadProfile = async (userId: string): Promise<User> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, name, role, avatar_url')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Profil konnte nicht geladen werden: ${error.message}`);

  return {
    username: data.username || data.id,
    name: data.name || data.username || 'Benutzer',
    role: data.role,
    avatarUrl: data.avatar_url || undefined,
  };
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase ist nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY setzen.');
      setLoading(false);
      return;
    }

    let mounted = true;
    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setProfile(await loadProfile(nextSession.user.id));
        setError(null);
      } catch (profileError) {
        setProfile(null);
        setError(profileError instanceof Error ? profileError.message : 'Profil konnte nicht geladen werden.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      void applySession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    error,
    signIn: async (email, password) => {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
    },
    signOut: async () => {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw new Error(signOutError.message);
    },
    resetPassword: async (email) => {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw new Error(resetError.message);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.');
  return context;
};

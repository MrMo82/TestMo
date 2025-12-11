import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment-Variablen mit Fallback für Entwicklung
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Erstelle Supabase-Client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Hilfsfunktionen für häufige Operationen

/**
 * Überprüft, ob ein Benutzer eingeloggt ist
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Gibt den aktuellen Benutzer zurück
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Login mit E-Mail und Passwort
 */
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

/**
 * Registrierung mit E-Mail und Passwort
 */
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

/**
 * Logout
 */
export const signOut = async () => {
  return await supabase.auth.signOut();
};

/**
 * Passwort zurücksetzen
 */
export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email);
};

export default supabase;

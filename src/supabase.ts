import { createClient } from '@supabase/supabase-js';

const getInitialUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('school_custom_supabase_url');
    if (saved && saved.startsWith('http')) return saved.trim();
  }
  return (import.meta as any).env?.VITE_SUPABASE_URL || 'https://imibgagqoavofdnfzgrg.supabase.co';
};

const getInitialKey = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('school_custom_supabase_anon_key');
    if (saved) return saved.trim();
  }
  return (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pNkEdO7QJLJMNykimVNGmw_UjB7YVPW';
};

export const SUPABASE_URL = getInitialUrl();
export const SUPABASE_ANON_KEY = getInitialKey();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function updateSupabaseConfig(newUrl: string, newAnonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('school_custom_supabase_url', newUrl.trim());
    localStorage.setItem('school_custom_supabase_anon_key', newAnonKey.trim());
    window.location.reload();
  }
}

export function resetSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('school_custom_supabase_url');
    localStorage.removeItem('school_custom_supabase_anon_key');
    window.location.reload();
  }
}

// Helper function to test connection
export async function testSupabaseConnection(): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase.from('_test_connection').select('*').limit(1);
    // If the table doesn't exist (PGRST204 or 404 or 42P01), that's fine - connection itself succeeded
    if (
      error &&
      error.code !== 'PGRST204' &&
      error.code !== '42P01' &&
      !error.message.includes('relation') &&
      !error.message.includes('schema cache')
    ) {
      console.warn('Supabase test ping notice:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase connection error:', err);
    return { success: false, message: err?.message };
  }
}

// Sign in with Google via Supabase OAuth
export async function signInWithSupabaseGoogle(redirectTo?: string) {
  const targetRedirect = redirectTo || (typeof window !== 'undefined' ? window.location.origin : '');
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: targetRedirect,
    },
  });
}

// Sign in with email & password via Supabase
export async function signInWithSupabaseEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

// Sign up with email & password via Supabase
export async function signUpWithSupabaseEmail(email: string, password: string, displayName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  });
}

// Sign out from Supabase
export async function signOutSupabase() {
  return supabase.auth.signOut();
}

import { createClient } from '@supabase/supabase-js';

// Supabase credentials configured for project
const env = (import.meta as { env?: Record<string, string> }).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://jezvcjvrzhynilsxlqhb.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GsIAbtpQm_eyECOoKuCGqw_DZF0cigF';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'estoque_app_supabase_auth_token'
  }
});

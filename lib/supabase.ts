import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    // Prefer service role key for server-side operations (bypasses RLS)
    const key = serviceRoleKey || anonKey;
    if (!key) {
      throw new Error(
        'Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

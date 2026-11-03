import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    // RLS blocks the anon key on every PinUp table, so the server must use this key.
    if (!serviceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    supabase = createClient(url, serviceRoleKey);
  }
  return supabase;
}

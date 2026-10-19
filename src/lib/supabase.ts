// ============================================================================
// inner-kt v2.0 — Pure Supabase Client SDK (Tanpa Prisma)
// Standard Supabase JS Client with Automatic Fallback & Connection Check
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    'ℹ️ [inner-kt] Supabase credentials belum diatur di .env.local. Sistem berjalan dalam mode Local-First Persistence.'
  );
}

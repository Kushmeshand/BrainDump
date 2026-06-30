import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_STORAGE_BUCKET = 'pdfs';

// Create a single shared Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // We are currently using Firebase for Auth, so we don't need Supabase to persist sessions locally
    persistSession: false,
  },
});

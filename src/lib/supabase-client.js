import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const createSupabaseBrowserClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Vite Supabase environment variables.');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};

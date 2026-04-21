export const supabaseEnv = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
};

export const hasSupabaseEnv = Boolean(
  supabaseEnv.url && supabaseEnv.publishableKey,
);

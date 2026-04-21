import { createSupabaseBrowserClient } from './supabase-client';

export const fetchTodos = async () => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from('todos').select();

  if (error) {
    throw error;
  }

  return data ?? [];
};

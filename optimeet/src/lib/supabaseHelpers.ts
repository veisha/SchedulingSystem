import { supabase } from '@/lib/supabase';

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('User')
    .select('email')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }

  return data?.email || null;
}

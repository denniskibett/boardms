// lib/user-profile.ts
import { supabase } from '@/lib/supabase/client';

export async function getUserProfile(userId: string) {
  // This gets data from YOUR custom users table
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', userId) // Link via auth_id
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// Or if you want to keep using email as the link:
export async function getUserProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}
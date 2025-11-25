import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Get current user with profile data
export const getCurrentUser = cache(async () => {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user profile from your users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single();

  return {
    ...user,
    profile: profile || null
  };
});

// Get session with user data
export const getSession = cache(async () => {
  const supabase = createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
});

// Require authentication - redirect if not logged in
export const requireAuth = cache(async () => {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  return user;
});

// Require specific role
export const requireRole = cache(async (allowedRoles: string[]) => {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.profile?.role || '')) {
    redirect('/unauthorized');
  }

  return user;
});

// Check if user has role
export const hasRole = async (allowedRoles: string[]) => {
  const user = await getCurrentUser();
  return user ? allowedRoles.includes(user.profile?.role || '') : false;
};

// Sign out
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
  }
  
  redirect('/auth/signin');
}
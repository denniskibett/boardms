// src/lib/auth-supabase.ts - UPDATED
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/headers';
import { cache } from 'react';

// Get current user with profile data
export const getCurrentUser = cache(async () => {
  const supabase = await createServerClient(); // AWAIT the client
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.log('❌ No user found or error:', error);
    return null;
  }

  console.log('✅ Auth user found:', user.email);

  // Get user profile from your users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Error fetching user profile:', profileError);
  }

  return {
    ...user,
    profile: profile || null
  };
});

// Get session with user data
export const getSession = cache(async () => {
  const supabase = await createServerClient(); // AWAIT the client
  
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

// Check if user has role
export const hasRole = async (allowedRoles: string[]) => {
  const user = await getCurrentUser();
  return user ? allowedRoles.includes(user.profile?.role || '') : false;
};

// Sign out
export async function signOut() {
  const supabase = await createServerClient(); // AWAIT the client
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
  }
  
  redirect('/auth/signin');
}
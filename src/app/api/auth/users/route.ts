// src/app/api/auth/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching user via API:', userId);
    const supabase = supabaseServer();

    // Method 1: Try to get user from our users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (dbUser && !dbError) {
      console.log('✅ User found in database table');
      return NextResponse.json(dbUser);
    }

    console.log('🔍 User not in database, checking auth...');

    // Method 2: Get user from Supabase Auth (admin API)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      console.error('❌ Auth user not found:', authError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found in auth:', authUser.user.email);

    // Transform to match our User interface
    const userData = {
      id: authUser.user.id,
      auth_id: authUser.user.id,
      email: authUser.user.email,
      name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
      role: authUser.user.user_metadata?.role || 'user',
      status: authUser.user.user_metadata?.status || 'active',
      image: authUser.user.user_metadata?.avatar_url || authUser.user.user_metadata?.picture,
      phone: authUser.user.user_metadata?.phone,
      last_login: authUser.user.last_sign_in_at,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at,
    };

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('🚨 Error in auth user API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user: ' + error.message },
      { status: 500 }
    );
  }
}
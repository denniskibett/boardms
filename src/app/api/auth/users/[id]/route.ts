// app/api/auth/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseServer();

    console.log('🔍 Fetching auth user:', id);

    // Get user from Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);

    if (authError || !authUser) {
      console.error('❌ Auth user not found:', authError);
      return NextResponse.json(
        { error: 'Auth user not found' },
        { status: 404 }
      );
    }

    console.log('✅ Auth user found:', authUser.user.email);

    // Transform auth user to match our User interface
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
  } catch (error) {
    console.error('Error fetching auth user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth user' },
      { status: 500 }
    );
  }
}
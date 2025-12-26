// app/api/auth/users/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching ALL auth users...');
    const supabase = supabaseServer();

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch users: ' + authError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${authUsers.users.length} auth users`);

    // Transform users to match your AuthUser interface
    const users = authUsers.users.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at !== null,
      last_sign_in: user.last_sign_in_at,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
      custom_user_linked: false, // You'll need to check your custom table
      status: user.user_metadata?.status || 'active',
      role: user.user_metadata?.role || 'user',
      name: user.user_metadata?.name,
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      phone: user.user_metadata?.phone
    }));

    return NextResponse.json({
      users,
      total: users.length
    });
  } catch (error: any) {
    console.error('🚨 Error in auth users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + error.message },
      { status: 500 }
    );
  }
}
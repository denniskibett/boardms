import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    console.log('🔄 Fetching ALL auth users...');
    const supabase = supabaseServer();

    // Get all users from Supabase Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch users: ' + authError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${users.length} auth users`);

    // Get custom users from database
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*');

    if (customError) {
      console.warn('⚠️ Could not fetch custom users:', customError.message);
    }

    // Combine auth users with custom data
    const combinedUsers = users.map(authUser => {
      const customUser = customUsers?.find(u => 
        u.email === authUser.email || u.auth_user_id === authUser.id
      );
      
      return {
        id: authUser.id,
        email: authUser.email,
        email_confirmed: !!authUser.email_confirmed_at,
        last_sign_in: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        user_metadata: authUser.user_metadata,
        // Custom user data
        custom_user_linked: !!customUser,
        custom_user_id: customUser?.id,
        auth_id_in_custom: customUser?.auth_user_id,
        status: customUser?.status || authUser.user_metadata?.status || 'active',
        role: customUser?.role || authUser.user_metadata?.role || 'user',
        name: customUser?.name || authUser.user_metadata?.name,
        image: customUser?.image || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        phone: customUser?.phone || authUser.user_metadata?.phone,
        ministry_name: customUser?.ministry_name,
      };
    });

    return NextResponse.json({
      users: combinedUsers,
      total: combinedUsers.length
    });
  } catch (error: any) {
    console.error('🚨 Error in auth users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + error.message },
      { status: 500 }
    );
  }
}
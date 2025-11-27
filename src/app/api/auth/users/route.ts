// src/app/api/auth/users/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Starting to fetch auth users...');
    
    const supabase = supabaseServer();
    
    // Get all auth users with pagination
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (error) {
      console.error('❌ Error fetching auth users:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`✅ Found ${users?.length || 0} auth users`);

    // Get custom users for comparison
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*');

    if (customError) {
      console.error('❌ Error fetching custom users:', customError);
      // Continue with auth users only
    }

    console.log(`✅ Found ${customUsers?.length || 0} custom users`);

    // Format the response safely
    const formattedUsers = (users || []).map(user => {
      const customUser = customUsers?.find(cu => cu.auth_id === user.id);
      
      return {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
        last_sign_in: user.last_sign_in_at,
        created_at: user.created_at,
        user_metadata: user.user_metadata || {},
        custom_user_linked: !!customUser,
        custom_user_id: customUser?.id,
        auth_id_in_custom: customUser?.auth_id,
        status: customUser?.status || 'unknown',
        role: customUser?.role || 'unknown',
        image: customUser?.image, 
        name: customUser?.name,   
        phone: customUser?.phone || null
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      confirmed: formattedUsers.filter(u => u.email_confirmed).length,
      unconfirmed: formattedUsers.filter(u => !u.email_confirmed).length
    });

  } catch (error) {
    console.error('💥 Error in auth users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth users' },
      { status: 500 }
    );
  }
}
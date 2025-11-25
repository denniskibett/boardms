// src/app/api/auth/users/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = supabaseServer();
    
    // Get all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching auth users:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get custom users for comparison
    const { data: customUsers } = await supabase
      .from('users')
      .select('*');

    // Format the response to include useful info
    const formattedUsers = users.map(user => {
      const customUser = customUsers?.find(cu => cu.auth_id === user.id);
      
      return {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
        last_sign_in: user.last_sign_in_at,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
        custom_user_linked: !!customUser,
        custom_user_id: customUser?.id,
        auth_id_in_custom: customUser?.auth_id,
        status: customUser?.status || 'unknown',
        role: customUser?.role || 'unknown',
        image: customUser?.image, 
        name: customUser?.name,   
        phone: customUser?.phone  || user.phone || null
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      confirmed: formattedUsers.filter(u => u.email_confirmed).length,
      unconfirmed: formattedUsers.filter(u => !u.email_confirmed).length
    });

  } catch (error) {
    console.error('Error in auth users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth users' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const supabase = supabaseServer();

    if (!status || !['active', 'inactive', 'pending', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (active, inactive, pending, suspended) is required' },
        { status: 400 }
      );
    }

    // Update status in custom users table
    const { data, error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('auth_user_id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If suspending user, also ban them in Auth
    if (status === 'suspended') {
      await supabase.auth.admin.updateUserById(params.id, { ban_duration: 'none' });
    }

    return NextResponse.json({
      message: `User status updated to ${status}`,
      user: data
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
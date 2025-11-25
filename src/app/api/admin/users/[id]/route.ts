import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET - Get specific user by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer();

    // Get auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(params.id);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Get custom user data
    const { data: customUser, error: customError } = await supabase
      .from('users')
      .select('*')
      .or(`auth_user_id.eq.${params.id},email.eq.${authUser.user.email}`)
      .single();

    const user = {
      auth: authUser.user,
      custom: customUser || null
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const supabase = supabaseServer();

    // Separate auth updates from custom updates
    const { custom_updates, auth_updates, ...rest } = updates;
    
    const authUpdates: any = {};
    const customUpdates: any = { ...custom_updates };

    // Map common fields to auth user metadata
    if (rest.name) authUpdates.user_metadata = { name: rest.name };
    if (rest.role) {
      authUpdates.user_metadata = { 
        ...authUpdates.user_metadata, 
        role: rest.role 
      };
    }

    // Update auth user if there are auth updates
    let authResult = null;
    if (Object.keys(authUpdates).length > 0) {
      const { data, error } = await supabase.auth.admin.updateUserById(
        params.id,
        authUpdates
      );
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      authResult = data;
    }

    // Update custom user if there are custom updates
    let customResult = null;
    if (Object.keys(customUpdates).length > 0 || Object.keys(rest).length > 0) {
      const { data, error } = await supabase
        .from('users')
        .update({ ...customUpdates, ...rest })
        .eq('auth_user_id', params.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      customResult = data;
    }

    return NextResponse.json({
      message: 'User updated successfully',
      updates: {
        auth: authResult?.user || null,
        custom: customResult
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer();

    // First, get user email to find custom record
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(params.id);
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 400 });
    }

    // Delete from custom users table
    const { error: customError } = await supabase
      .from('users')
      .delete()
      .eq('auth_user_id', params.id);

    if (customError) {
      console.warn('Could not delete custom user record:', customError.message);
    }

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      deleted_user: {
        email: authUser.user.email,
        auth_id: params.id
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
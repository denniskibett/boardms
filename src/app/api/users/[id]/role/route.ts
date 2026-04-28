// src/app/api/users/[id]/role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/users/[id]/role - Update user's role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const supabase = supabaseServer();
    
    // Check if user is admin
    const currentUserRole = session.user?.role?.toLowerCase().replace(/\s+/g, '_');
    const canAssignRoles = currentUserRole === 'admin' || 
                          currentUserRole === 'sysadmin' || 
                          currentUserRole === 'cabinet_secretariat';

    if (!canAssignRoles) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to assign roles' }, { status: 403 });
    }

    // Get role information
    const roleKey = role.toLowerCase().replace(/\s+/g, '_');
    const { data: roleInfo } = await supabase
      .from('system_roles')
      .select('*')
      .eq('role_key', roleKey)
      .single();

    if (!roleInfo) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user's role
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        role: roleInfo.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('role_audit_logs')
      .insert({
        action: 'USER_ROLE_CHANGE',
        changes: { user_id: id, old_role: updatedUser.role, new_role: roleInfo.name },
        performed_by: session.user.id
      });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      role: roleInfo
    });
  } catch (error) {
    console.error('Error in PUT /api/users/[id]/role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
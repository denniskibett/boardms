// src/app/api/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/roles - Fetch all roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();
    
    // Fetch all system roles
    const { data: roles, error } = await supabase
      .from('system_roles')
      .select('*')
      .order('hierarchy_level', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    // Get user counts per role
    const { data: users } = await supabase
      .from('users')
      .select('role');

    const userCounts: { [key: string]: number } = {};
    users?.forEach(user => {
      const roleKey = user.role.toLowerCase().replace(/\s+/g, '_');
      userCounts[roleKey] = (userCounts[roleKey] || 0) + 1;
    });

    // Format roles for frontend
    const formattedRoles = roles?.map(role => ({
      id: role.role_key,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      userCount: userCounts[role.role_key] || 0,
      isSystemRole: role.is_system_role,
      hierarchy: role.hierarchy_level
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    console.error('Error in GET /api/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/roles - Create a new custom role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = session.user?.role?.toLowerCase().replace(/\s+/g, '_');
    if (userRole !== 'admin' && userRole !== 'sysadmin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can create roles' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions, roleKey } = body;

    if (!name || !permissions) {
      return NextResponse.json({ error: 'Name and permissions are required' }, { status: 400 });
    }

    const supabase = supabaseServer();
    
    // Generate role key if not provided
    const role_key = roleKey || name.toLowerCase().replace(/\s+/g, '_');
    
    // Check if role already exists
    const { data: existing } = await supabase
      .from('system_roles')
      .select('role_key')
      .eq('role_key', role_key)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    // Get highest hierarchy level
    const { data: maxHierarchy } = await supabase
      .from('system_roles')
      .select('hierarchy_level')
      .order('hierarchy_level', { ascending: false })
      .limit(1);

    const hierarchy_level = (maxHierarchy?.[0]?.hierarchy_level || 12) + 1;

    // Create new role
    const { data: newRole, error } = await supabase
      .from('system_roles')
      .insert({
        role_key,
        name,
        description: description || '',
        hierarchy_level,
        is_system_role: false,
        permissions
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('role_audit_logs')
      .insert({
        role_id: newRole.id,
        action: 'CREATE',
        changes: permissions,
        performed_by: session.user.id
      });

    return NextResponse.json({
      id: newRole.role_key,
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      userCount: 0,
      isSystemRole: newRole.is_system_role,
      hierarchy: newRole.hierarchy_level
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/roles - Update a role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user?.role?.toLowerCase().replace(/\s+/g, '_');
    if (userRole !== 'admin' && userRole !== 'sysadmin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can update roles' }, { status: 403 });
    }

    const body = await request.json();
    const { roleKey, name, description, permissions } = body;

    if (!roleKey) {
      return NextResponse.json({ error: 'Role key is required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Check if role exists
    const { data: existingRole } = await supabase
      .from('system_roles')
      .select('*')
      .eq('role_key', roleKey)
      .single();

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Don't allow modifying system roles if not admin/sysadmin
    if (existingRole.is_system_role && userRole !== 'sysadmin') {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 403 });
    }

    // Update role
    const { data: updatedRole, error } = await supabase
      .from('system_roles')
      .update({
        name: name || existingRole.name,
        description: description || existingRole.description,
        permissions: permissions || existingRole.permissions,
        updated_at: new Date().toISOString()
      })
      .eq('role_key', roleKey)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('role_audit_logs')
      .insert({
        role_id: updatedRole.id,
        action: 'UPDATE',
        changes: { old: existingRole.permissions, new: permissions },
        performed_by: session.user.id
      });

    return NextResponse.json({
      id: updatedRole.role_key,
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: updatedRole.permissions,
      isSystemRole: updatedRole.is_system_role,
      hierarchy: updatedRole.hierarchy_level
    });
  } catch (error) {
    console.error('Error in PUT /api/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/roles?roleKey=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user?.role?.toLowerCase().replace(/\s+/g, '_');
    if (userRole !== 'admin' && userRole !== 'sysadmin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can delete roles' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleKey = searchParams.get('roleKey');

    if (!roleKey) {
      return NextResponse.json({ error: 'Role key is required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Check if role exists
    const { data: role } = await supabase
      .from('system_roles')
      .select('*')
      .eq('role_key', roleKey)
      .single();

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Don't allow deleting system roles
    if (role.is_system_role) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 });
    }

    // Check if role has users assigned
    const { data: usersWithRole } = await supabase
      .from('users')
      .select('id')
      .eq('role', role.name)
      .limit(1);

    if (usersWithRole && usersWithRole.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role with assigned users. Please reassign users first.' 
      }, { status: 400 });
    }

    // Delete the role
    const { error } = await supabase
      .from('system_roles')
      .delete()
      .eq('role_key', roleKey);

    if (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('role_audit_logs')
      .insert({
        role_id: role.id,
        action: 'DELETE',
        performed_by: session.user.id
      });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
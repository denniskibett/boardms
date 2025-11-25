// src/app/api/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// GET - Fetch all groups with their members
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    
    console.log('🔄 Fetching groups with members (UUIDs only)...');

    // First, fetch all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    if (groupsError) {
      console.error('❌ Error fetching groups:', groupsError);
      throw groupsError;
    }

    if (!groups || groups.length === 0) {
      console.log('✅ No groups found');
      return NextResponse.json([]);
    }

    console.log(`✅ Found ${groups.length} groups`);

    // Fetch all group_users in a single query
    const { data: allGroupUsers, error: groupUsersError } = await supabase
      .from('group_users')
      .select('*')
      .in('group_id', groups.map(g => g.id));

    if (groupUsersError) {
      console.error('❌ Error fetching group users:', groupUsersError);
      throw groupUsersError;
    }

    console.log(`✅ Found ${allGroupUsers?.length || 0} group user relationships`);

    // Get all unique user UUIDs from group_users
    const userUuids = allGroupUsers ? [...new Set(allGroupUsers.map(gu => gu.user_id))] : [];

    // Fetch all users by their UUIDs (auth_ids)
    let allUsers: any[] = [];
    if (userUuids.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, auth_id, name, email, role, image')
        .in('auth_id', userUuids);

      if (usersError) {
        console.error('❌ Error fetching users by UUID:', usersError);
      } else {
        allUsers = usersData || [];
        console.log(`✅ Found ${allUsers.length} users for groups`);
      }
    }

    // Build the final response by combining groups with their members
    const groupsWithMembers = groups.map(group => {
      const groupUserRelations = allGroupUsers?.filter(gu => gu.group_id === group.id) || [];
      
      const groupUsers = groupUserRelations
        .map(gu => {
          const user = allUsers.find(u => u.auth_id === gu.user_id);
          return user ? {
            id: user.auth_id, // Use UUID as ID for consistency
            auth_id: user.auth_id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
          } : null;
        })
        .filter(user => user != null);

      return {
        id: group.id.toString(),
        name: group.name,
        users: groupUsers
      };
    });

    console.log(`✅ Built ${groupsWithMembers.length} groups with members`);
    
    return NextResponse.json(groupsWithMembers);
    
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    const { name, user_ids } = await request.json();
    const supabase = supabaseServer();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: name.trim()
      })
      .select()
      .single();

    if (groupError) {
      console.error('❌ Error creating group:', groupError);
      throw groupError;
    }

    // Add users to the group if provided - use UUIDs directly
    if (user_ids && user_ids.length > 0) {
      const groupUsers = user_ids.map((userAuthId: string) => ({
        group_id: newGroup.id,
        user_id: userAuthId // Store UUID directly, no parseInt
      }));

      const { error: usersError } = await supabase
        .from('group_users')
        .insert(groupUsers);

      if (usersError) {
        console.error('❌ Error adding users to group:', usersError);
        // Continue anyway - the group was created successfully
      }
    }

    console.log(`✅ Created new group: ${newGroup.name}`);
    
    return NextResponse.json({
      id: newGroup.id.toString(),
      name: newGroup.name,
      users: []
    });
    
  } catch (error) {
    console.error('❌ Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
// src/app/api/meetings/[id]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { requireAccess } from '@/lib/auth/permissions';

// GET - Fetch meeting participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await requireAccess('meetings', 'view');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const supabase: any = supabaseServer();
    
    
    // Fetch individual participants with user details
    const { data: individualParticipants, error: individualError } = await supabase
      .from('meeting_participants')
      .select(`
        id,
        meeting_id,
        user_id,
        group_id,
        rsvp_id,
        created_at,
        users (
          auth_id,
          name,
          email,
          role,
          image
        )
      `)
      .eq('meeting_id', meetingId)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: true });

    if (individualError) {
      console.error('Error fetching individual participants:', individualError);
      throw individualError;
    }

    // Fetch group participants with group details
    const { data: groupParticipants, error: groupError } = await supabase
      .from('meeting_participants')
      .select(`
        id,
        meeting_id,
        user_id,
        group_id,
        rsvp_id,
        created_at,
        groups (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('meeting_id', meetingId)
      .not('group_id', 'is', null)
      .order('created_at', { ascending: true });

    if (groupError) {
      console.error('Error fetching group participants:', groupError);
      throw groupError;
    }

    // Fetch group members for group participants
    const groupParticipantsWithMembers = await Promise.all(
      (groupParticipants || []).map(async (participant: any) => {
        if (!participant.groups) return participant;

        // Fetch group members for this group
        const { data: groupUsers, error: groupUsersError } = await supabase
          .from('group_users')
          .select(`
            user_id,
            users (
              auth_id,
              name,
              email,
              role,
              image
            )
          `)
          .eq('group_id', participant.groups.id);

        if (groupUsersError) {
          console.error(`Error fetching group users for group ${participant.groups.id}:`, groupUsersError);
          return participant;
        }

        return {
          ...participant,
          groups: {
            ...participant.groups,
            users: (groupUsers || []).map((gu: any) => ({
              id: gu.users.auth_id, // UUID as primary ID
              auth_id: gu.users.auth_id,
              name: gu.users.name,
              email: gu.users.email,
              role: gu.users.role,
              image: gu.users.image
            }))
          }
        };
      })
    );

    // Fetch RSVP statuses
    const { data: rsvpCategories, error: rsvpError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'rsvp_status')
      .order('id', { ascending: true });

    if (rsvpError) {
      console.error('Error fetching RSVP categories:', rsvpError);
      throw rsvpError;
    }


    // Format individual participants
    const formattedIndividualParticipants = (individualParticipants || []).map((participant: any) => {
      const rsvpCategory = rsvpCategories?.find((cat: any) => cat.id === participant.rsvp_id);
      
      return {
        id: participant.id.toString(),
        meeting_id: participant.meeting_id.toString(),
        user_id: participant.user_id, // UUID - keep as is
        group_id: null,
        rsvp_id: participant.rsvp_id?.toString() || null,
        type: 'individual' as const,
        user: participant.users ? {
          id: participant.users.auth_id, // UUID as primary ID
          auth_id: participant.users.auth_id,
          name: participant.users.name,
          email: participant.users.email,
          role: participant.users.role,
          image: participant.users.image
        } : undefined,
        rsvp: rsvpCategory ? {
          id: rsvpCategory.id.toString(),
          name: rsvpCategory.name,
          colour: rsvpCategory.colour
        } : undefined
      };
    });

    // Format group participants
    const formattedGroupParticipants = (groupParticipantsWithMembers || []).map(participant => {
      const rsvpCategory = rsvpCategories?.find((cat: any) => cat.id === participant.rsvp_id);
      
      return {
        id: participant.id.toString(),
        meeting_id: participant.meeting_id.toString(),
        user_id: null,
        group_id: participant.group_id?.toString(),
        rsvp_id: participant.rsvp_id?.toString() || null,
        type: 'group' as const,
        group: participant.groups ? {
          id: participant.groups.id.toString(),
          name: participant.groups.name,
          users: participant.groups.users || []
        } : undefined,
        rsvp: rsvpCategory ? {
          id: rsvpCategory.id.toString(),
          name: rsvpCategory.name,
          colour: rsvpCategory.colour
        } : undefined
      };
    });

    const allParticipants = [...formattedIndividualParticipants, ...formattedGroupParticipants];
    
    
    return NextResponse.json(allParticipants);
    
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST - Add participants to meeting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await requireAccess('meetings', 'edit');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const { user_ids, group_ids } = await request.json();
    const supabase: any = supabaseServer();
    
    
    const newParticipants = [];
    
    // Process individual users (UUIDs)
    if (user_ids && user_ids.length > 0) {
      const individualParticipants = await addIndividualParticipants(supabase, meetingId, user_ids);
      newParticipants.push(...individualParticipants);
    }
    
    // Process groups (extract member UUIDs)
    if (group_ids && group_ids.length > 0) {
      const groupParticipants = await addGroupParticipants(supabase, meetingId, group_ids);
      newParticipants.push(...groupParticipants);
    }
    
    
    return NextResponse.json(newParticipants);
    
  } catch (error) {
    console.error('Error adding participants:', error);
    return NextResponse.json(
      { error: 'Failed to add participants' },
      { status: 500 }
    );
  }
}

// PATCH - Update participant RSVP status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await requireAccess('meetings', 'edit');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const { participantId, rsvp_id } = await request.json();
    const supabase: any = supabaseServer();
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    
    const updatedParticipant = await updateParticipantRSVP(supabase, meetingId, participantId, rsvp_id);
    
    return NextResponse.json(updatedParticipant);
    
  } catch (error) {
    console.error('Error updating participant RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to update participant RSVP' },
      { status: 500 }
    );
  }
}

// DELETE - Remove participant from meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await requireAccess('meetings', 'delete');
  if (g.error) return g.error;

  try {
    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');
    const supabase: any = supabaseServer();
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    
    await removeParticipant(supabase, meetingId, participantId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Participant removed successfully' 
    });
    
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
}

// ===== DATABASE OPERATIONS =====

// FIXED: Add individual participants with UUID validation
async function addIndividualParticipants(
  supabase: any, 
  meetingId: string, 
  userIds: string[] // Array of UUIDs
) {
  const newParticipants = [];
  
  for (const userId of userIds) {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`Invalid UUID format: ${userId}`);
      continue;
    }
    
    
    // Check if participant already exists - using UUID
    const { data: existingParticipant } = await supabase
      .from('meeting_participants')
      .select('id')
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingParticipant) {
      continue;
    }

    // Insert new participant with UUID
    const { data: newParticipant, error } = await supabase
      .from('meeting_participants')
      .insert({
        meeting_id: parseInt(meetingId),
        user_id: userId, // Store UUID directly
        group_id: null,
        rsvp_id: null
      })
      .select(`
        id,
        meeting_id,
        user_id,
        group_id,
        rsvp_id,
        users (
          auth_id,
          name,
          email,
          role,
          image
        )
      `)
      .single();

    if (error) {
      console.error(`Error adding user ${userId} to meeting:`, error);
      continue;
    }

    const formattedParticipant = {
      id: newParticipant.id.toString(),
      meeting_id: newParticipant.meeting_id.toString(),
      user_id: newParticipant.user_id, // UUID
      group_id: null,
      rsvp_id: newParticipant.rsvp_id?.toString() || null,
      type: 'individual' as const,
      user: newParticipant.users ? {
        id: newParticipant.users.auth_id, // UUID as primary ID
        auth_id: newParticipant.users.auth_id,
        name: newParticipant.users.name,
        email: newParticipant.users.email,
        role: newParticipant.users.role,
        image: newParticipant.users.image
      } : undefined,
      rsvp: null
    };
    
    newParticipants.push(formattedParticipant);
  }
  
  return newParticipants;
}

// FIXED: Add group participants by extracting member UUIDs
async function addGroupParticipants(
  supabase: any, 
  meetingId: string, 
  groupIds: string[]
) {
  const newParticipants = [];
  
  for (const groupId of groupIds) {
    
    // Get all users in this group
    const { data: groupUsers, error: groupUsersError } = await supabase
      .from('group_users')
      .select(`
        user_id,
        users (
          auth_id,
          name,
          email,
          role,
          image
        )
      `)
      .eq('group_id', parseInt(groupId));

    if (groupUsersError) {
      console.error(`Error fetching group users for group ${groupId}:`, groupUsersError);
      continue;
    }

    if (!groupUsers || groupUsers.length === 0) {
      continue;
    }


    // Extract UUIDs from group members
    const groupMemberUUIDs = groupUsers
      .map((gu: any) => gu.user_id)
      .filter((uuid: any) => uuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid));

    if (groupMemberUUIDs.length === 0) {
      continue;
    }

    // Add group members as individual participants
    const groupMemberParticipants = await addIndividualParticipants(supabase, meetingId, groupMemberUUIDs);
    newParticipants.push(...groupMemberParticipants);
    
  }
  
  return newParticipants;
}

// FIXED: Update participant RSVP
async function updateParticipantRSVP(
  supabase: any,
  meetingId: string,
  participantId: string,
  rsvpId: string | null
) {
  // Update participant RSVP
  const { data: updatedParticipant, error } = await supabase
    .from('meeting_participants')
    .update({ 
      rsvp_id: rsvpId ? parseInt(rsvpId) : null 
    })
    .eq('id', parseInt(participantId))
    .eq('meeting_id', parseInt(meetingId))
    .select(`
      id,
      meeting_id,
      user_id,
      group_id,
      rsvp_id
    `)
    .single();

  if (error) {
    console.error('Error updating participant RSVP:', error);
    throw error;
  }

  // Fetch the RSVP category details
  let rsvpCategory = null;
  if (rsvpId) {
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('id', parseInt(rsvpId))
      .eq('type', 'rsvp_status')
      .single();

    if (category) {
      rsvpCategory = {
        id: category.id.toString(),
        name: category.name,
        colour: category.colour
      };
    }
  }

  return {
    id: updatedParticipant.id.toString(),
    rsvp_id: updatedParticipant.rsvp_id?.toString() || null,
    rsvp: rsvpCategory
  };
}

// FIXED: Remove participant
async function removeParticipant(supabase: any, meetingId: string, participantId: string) {
  const { error } = await supabase
    .from('meeting_participants')
    .delete()
    .eq('id', parseInt(participantId))
    .eq('meeting_id', parseInt(meetingId));

  if (error) {
    console.error('Error removing participant:', error);
    throw error;
  }

  return true;
}
// src/app/api/meetings/[id]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// GET - Fetch meeting participants (both individuals and groups)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const supabase = supabaseServer();
    
    console.log(`🔄 Fetching participants for meeting: ${meetingId}`);
    
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
          id,
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
      console.error('❌ Error fetching individual participants:', individualError);
      throw individualError;
    }

    // Fetch group participants with group details and members
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
          updated_at,
          group_users (
            id,
            group_id,
            user_id,
            mandatory_id,
            users (
              id,
              auth_id,
              name,
              email,
              role,
              image
            )
          )
        )
      `)
      .eq('meeting_id', meetingId)
      .not('group_id', 'is', null)
      .order('created_at', { ascending: true });

    if (groupError) {
      console.error('❌ Error fetching group participants:', groupError);
      throw groupError;
    }

    // Fetch RSVP statuses from categories table
    const { data: rsvpCategories, error: rsvpError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'rsvp_status')
      .order('id', { ascending: true });

    if (rsvpError) {
      console.error('❌ Error fetching RSVP categories:', rsvpError);
      throw rsvpError;
    }

    console.log(`✅ Found ${rsvpCategories?.length || 0} RSVP status categories`);

    // Format individual participants
    const formattedIndividualParticipants = (individualParticipants || []).map(participant => {
      const rsvpCategory = rsvpCategories?.find(cat => cat.id === participant.rsvp_id);
      
      return {
        id: participant.id.toString(),
        meeting_id: participant.meeting_id.toString(),
        user_id: participant.user_id?.toString(),
        group_id: null,
        rsvp_id: participant.rsvp_id?.toString() || null,
        type: 'individual' as const,
        user: participant.users ? {
          id: participant.users.id.toString(),
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
    const formattedGroupParticipants = (groupParticipants || []).map(participant => {
      const rsvpCategory = rsvpCategories?.find(cat => cat.id === participant.rsvp_id);
      
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
          users: participant.groups.group_users?.map((groupUser: any) => ({
            id: groupUser.users.id.toString(),
            auth_id: groupUser.users.auth_id,
            name: groupUser.users.name,
            email: groupUser.users.email,
            role: groupUser.users.role,
            image: groupUser.users.image
          })) || []
        } : undefined,
        rsvp: rsvpCategory ? {
          id: rsvpCategory.id.toString(),
          name: rsvpCategory.name,
          colour: rsvpCategory.colour
        } : undefined
      };
    });

    const allParticipants = [...formattedIndividualParticipants, ...formattedGroupParticipants];
    
    console.log(`✅ Found ${allParticipants.length} participants for meeting ${meetingId}`);
    
    return NextResponse.json(allParticipants);
    
  } catch (error) {
    console.error('❌ Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST - Add participants (users or groups) to meeting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const { user_ids, group_ids } = await request.json();
    const supabase = supabaseServer();
    
    console.log(`🔄 Adding participants to meeting ${meetingId}:`, { user_ids, group_ids });
    
    const newParticipants = [];
    
    // Add individual users
    if (user_ids && user_ids.length > 0) {
      const individualParticipants = await addIndividualParticipants(supabase, meetingId, user_ids);
      newParticipants.push(...individualParticipants);
    }
    
    // Add groups (mass add all group members as individuals)
    if (group_ids && group_ids.length > 0) {
      const groupParticipants = await addGroupParticipants(supabase, meetingId, group_ids);
      newParticipants.push(...groupParticipants);
    }
    
    console.log(`✅ Added ${newParticipants.length} participants to meeting ${meetingId}`);
    
    return NextResponse.json(newParticipants);
    
  } catch (error) {
    console.error('❌ Error adding participants:', error);
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
  try {
    const { id: meetingId } = await params;
    const { participantId, rsvp_id } = await request.json();
    const supabase = supabaseServer();
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating RSVP for participant ${participantId}:`, rsvp_id);
    
    const updatedParticipant = await updateParticipantRSVP(supabase, participantId, rsvp_id);
    
    return NextResponse.json(updatedParticipant);
    
  } catch (error) {
    console.error('❌ Error updating participant RSVP:', error);
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
  try {
    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');
    const supabase = supabaseServer();
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Removing participant ${participantId} from meeting ${meetingId}`);
    
    await removeParticipant(supabase, participantId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Participant removed successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error removing participant:', error);
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
}

// ===== SUPABASE DATABASE OPERATIONS =====

async function addIndividualParticipants(
  supabase: any, 
  meetingId: string, 
  userIds: string[] // These are UUIDs (auth_ids)
) {
  const newParticipants = [];
  
  for (const userAuthId of userIds) {
    // Check if participant already exists
    const { data: existingParticipant } = await supabase
      .from('meeting_participants')
      .select('id')
      .eq('meeting_id', meetingId)
      .eq('user_id', userAuthId) // Use UUID directly
      .single();

    if (existingParticipant) {
      console.log(`⚠️ User ${userAuthId} already exists in meeting ${meetingId}`);
      continue;
    }

    // Insert new participant with UUID (no parseInt!)
    const { data: newParticipant, error } = await supabase
      .from('meeting_participants')
      .insert({
        meeting_id: parseInt(meetingId),
        user_id: userAuthId, // Store UUID directly
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
          id,
          auth_id,
          name,
          email,
          role,
          image
        )
      `)
      .single();

    if (error) {
      console.error(`❌ Error adding user ${userAuthId} to meeting:`, error);
      continue;
    }

    const formattedParticipant = {
      id: newParticipant.id.toString(),
      meeting_id: newParticipant.meeting_id.toString(),
      user_id: newParticipant.user_id?.toString(),
      group_id: null,
      rsvp_id: newParticipant.rsvp_id?.toString() || null,
      type: 'individual' as const,
      user: newParticipant.users ? {
        id: newParticipant.users.id.toString(),
        auth_id: newParticipant.users.auth_id,
        name: newParticipant.users.name,
        email: newParticipant.users.email,
        role: newParticipant.users.role,
        image: newParticipant.users.image
      } : undefined,
      rsvp: null
    };
    
    newParticipants.push(formattedParticipant);
    console.log(`✅ Added user ${userAuthId} to meeting ${meetingId}`);
  }
  
  return newParticipants;
}

async function addGroupParticipants(
  supabase: any, 
  meetingId: string, 
  groupIds: string[]
) {
  const newParticipants = [];
  
  for (const groupId of groupIds) {
    console.log(`🔄 Processing group ${groupId} for mass add...`);
    
    // First, get all users in this group
    const { data: groupUsers, error: groupUsersError } = await supabase
      .from('group_users')
      .select(`
        user_id,
        users (
          id,
          auth_id,
          name,
          email,
          role,
          image
        )
      `)
      .eq('group_id', parseInt(groupId));

    if (groupUsersError) {
      console.error(`❌ Error fetching group users for group ${groupId}:`, groupUsersError);
      continue;
    }

    if (!groupUsers || groupUsers.length === 0) {
      console.log(`⚠️ Group ${groupId} has no members`);
      continue;
    }

    console.log(`✅ Found ${groupUsers.length} users in group ${groupId}`);

    // Mass add all group members as individual participants
    const groupMemberParticipants = [];
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const groupUser of groupUsers) {
      const userAuthId = groupUser.user_id; // This is the UUID
      
      // Check if user already exists in meeting
      const { data: existingParticipant } = await supabase
        .from('meeting_participants')
        .select('id')
        .eq('meeting_id', meetingId)
        .eq('user_id', userAuthId)
        .single();

      if (existingParticipant) {
        console.log(`⚠️ User ${userAuthId} from group ${groupId} already exists in meeting`);
        skippedCount++;
        continue;
      }

      // Add user to meeting
      const { data: newParticipant, error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: parseInt(meetingId),
          user_id: userAuthId,
          group_id: null, // Add as individual, not as group
          rsvp_id: null
        })
        .select(`
          id,
          meeting_id,
          user_id,
          group_id,
          rsvp_id,
          users (
            id,
            auth_id,
            name,
            email,
            role,
            image
          )
        `)
        .single();

      if (error) {
        console.error(`❌ Error adding user ${userAuthId} from group ${groupId}:`, error);
        errorCount++;
        continue;
      }

      const formattedParticipant = {
        id: newParticipant.id.toString(),
        meeting_id: newParticipant.meeting_id.toString(),
        user_id: newParticipant.user_id?.toString(),
        group_id: null,
        rsvp_id: newParticipant.rsvp_id?.toString() || null,
        type: 'individual' as const,
        user: newParticipant.users ? {
          id: newParticipant.users.id.toString(),
          auth_id: newParticipant.users.auth_id,
          name: newParticipant.users.name,
          email: newParticipant.users.email,
          role: newParticipant.users.role,
          image: newParticipant.users.image
        } : undefined,
        rsvp: null
      };
      
      groupMemberParticipants.push(formattedParticipant);
      addedCount++;
      console.log(`✅ Added user ${userAuthId} from group ${groupId} to meeting`);
    }

    console.log(`📊 Group ${groupId} summary: ${addedCount} added, ${skippedCount} skipped, ${errorCount} errors`);
    newParticipants.push(...groupMemberParticipants);
  }
  
  return newParticipants;
}

async function updateParticipantRSVP(
  supabase: any, 
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
    .select(`
      id,
      meeting_id,
      user_id,
      group_id,
      rsvp_id
    `)
    .single();

  if (error) {
    console.error('❌ Error updating participant RSVP:', error);
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

async function removeParticipant(supabase: any, participantId: string) {
  const { error } = await supabase
    .from('meeting_participants')
    .delete()
    .eq('id', parseInt(participantId));

  if (error) {
    console.error('❌ Error removing participant:', error);
    throw error;
  }

  console.log(`✅ Removed participant ${participantId}`);
  return true;
}
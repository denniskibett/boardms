// src/app/api/groups/[id]/route.ts — participant groups (group_users.user_id holds the user's auth uuid)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/auth/permissions';

type Ctx = { params: Promise<{ id: string }> };

/** Accepts `user_ids: string[]` or legacy `users: [{ user_id }]`. */
function memberIds(body: any): string[] {
  if (Array.isArray(body.user_ids)) return body.user_ids.map(String);
  if (Array.isArray(body.users)) return body.users.map((u: any) => String(u?.user_id ?? u?.id ?? u)).filter(Boolean);
  return [];
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const g = await requireAccess('meetings', 'view');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const supabase = supabaseServer();
    const { data: group, error } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: links } = await supabase.from('group_users').select('user_id').eq('group_id', id);
    const uuids = (links || []).map((l) => l.user_id).filter(Boolean);
    const { data: users } = uuids.length
      ? await supabase.from('users').select('auth_id, name, email, role, image').in('auth_id', uuids)
      : { data: [] as any[] };

    return NextResponse.json({
      id: String(group.id),
      name: group.name,
      users: (users || []).map((u: any) => ({ id: u.auth_id, ...u })),
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const g = await requireAccess('meetings', 'edit');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Group name is required' }, { status: 400 });

    const supabase = supabaseServer();
    const { data: updated, error } = await supabase
      .from('groups')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (body.user_ids !== undefined || body.users !== undefined) {
      const ids = memberIds(body);
      const { error: delError } = await supabase.from('group_users').delete().eq('group_id', id);
      if (delError) throw delError;
      if (ids.length) {
        const { error: insError } = await supabase
          .from('group_users')
          .insert(ids.map((user_id) => ({ group_id: Number(id), user_id })));
        if (insError) throw insError;
      }
    }

    return NextResponse.json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const g = await requireAccess('meetings', 'delete');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const supabase = supabaseServer();
    const { error: linkError } = await supabase.from('group_users').delete().eq('group_id', id);
    if (linkError) throw linkError;
    const { data, error } = await supabase.from('groups').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

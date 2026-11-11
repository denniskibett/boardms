// GET /api/audit — audit_logs with actor names. Needs audit.view.
//   ?from=YYYY-MM-DD ?to=YYYY-MM-DD ?action=USER_UPDATE ?type=user ?limit=500
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
};

const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(request: NextRequest) {
  const g = await requireAccess('audit', 'view');
  if (g.error) return g.error;

  const sp = new URL(request.url).searchParams;
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 500, 1), 2000);
  const db = supabaseServer();

  let q = db
    .from('audit_logs')
    .select('id, user_id, action, target_type, target_id, metadata, ip_address, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  const from = sp.get('from');
  const to = sp.get('to');
  if (isDate(from)) q = q.gte('created_at', `${from}T00:00:00`);
  if (isDate(to)) q = q.lte('created_at', `${to}T23:59:59`);
  if (sp.get('action')) q = q.eq('action', sp.get('action')!);
  if (sp.get('type')) q = q.eq('target_type', sp.get('type')!);

  const { data, error } = await q;
  if (error) {
    console.error('GET /api/audit:', error.message);
    return NextResponse.json({ error: 'Failed to load the audit trail' }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  const ids = Array.from(new Set(rows.map((r) => r.user_id).filter((x): x is number => x != null)));
  const names = new Map<number, { name: string; email: string; role: string }>();
  if (ids.length) {
    const { data: users } = await db.from('users').select('id, name, email, role').in('id', ids);
    for (const u of users ?? []) names.set(u.id, u);
  }

  return NextResponse.json(
    rows.map((r) => {
      const u = r.user_id != null ? names.get(r.user_id) : undefined;
      return {
        id: r.id,
        createdAt: r.created_at,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        actor: u?.name ?? (r.metadata?.actor as string | undefined) ?? 'System',
        actorEmail: u?.email ?? null,
        actorRole: u?.role ?? null,
        ipAddress: r.ip_address,
        metadata: r.metadata ?? {},
      };
    }),
  );
}

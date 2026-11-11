// GET /api/reports — aggregate figures for the Reports page. Needs reports.view.
//   ?from=YYYY-MM-DD ?to=YYYY-MM-DD  (filters meetings by start_at and memos/agenda/letters by created_at)
// Each section is only included when the role can also view that module.
import { NextRequest, NextResponse } from 'next/server';
import { requireAccess, userCan } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

function tally<T>(rows: T[], key: (r: T) => string | null | undefined) {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = (key(r) || 'unspecified').toString();
    out[k] = (out[k] ?? 0) + 1;
  }
  return Object.entries(out)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(request: NextRequest) {
  const g = await requireAccess('reports', 'view');
  if (g.error) return g.error;

  const sp = new URL(request.url).searchParams;
  const from = sp.get('from');
  const to = sp.get('to');
  const db = supabaseServer();

  const ranged = (q: any, col: string) => {
    if (isDate(from)) q = q.gte(col, `${from}T00:00:00`);
    if (isDate(to)) q = q.lte(col, `${to}T23:59:59`);
    return q;
  };
  const safe = async <T,>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> => {
    try {
      const { data, error } = await p;
      return error ? [] : ((data as T[]) ?? []);
    } catch {
      return [];
    }
  };
  const can = (m: Parameters<typeof userCan>[1]) => userCan(g.user, m, 'view');

  type Meeting = { id: number; name: string; type: string | null; status: string | null; start_at: string | null; location: string | null };
  const [meetings, agenda, memos, letters, users, ministries, departments, agencies] = await Promise.all([
    can('meetings')
      ? safe<Meeting>(ranged(db.from('meetings').select('id, name, type, status, start_at, location'), 'start_at').order('start_at', { ascending: false }))
      : Promise.resolve([] as Meeting[]),
    can('agenda') ? safe<{ status: string | null }>(ranged(db.from('agenda').select('status'), 'created_at')) : Promise.resolve([]),
    can('memos')
      ? safe<{ status: string | null; priority: string | null }>(ranged(db.from('gov_memos').select('status, priority'), 'created_at'))
      : Promise.resolve([]),
    can('actionLetters') ? safe<{ status: string | null }>(ranged(db.from('action_letters').select('status'), 'created_at')) : Promise.resolve([]),
    can('users') ? safe<{ role: string | null; status: string | null }>(db.from('users').select('role, status')) : Promise.resolve([]),
    can('mdas') ? safe<{ id: number }>(db.from('ministries').select('id')) : Promise.resolve([]),
    can('mdas') ? safe<{ id: number }>(db.from('state_departments').select('id').is('deleted_at', null)) : Promise.resolve([]),
    can('mdas') ? safe<{ id: number }>(db.from('agencies').select('id').is('deleted_at', null)) : Promise.resolve([]),
  ]);

  const byMonth = tally(meetings.filter((m) => m.start_at), (m) => m.start_at!.slice(0, 7)).sort((a, b) => a.label.localeCompare(b.label));

  return NextResponse.json({
    range: { from: isDate(from) ? from : null, to: isDate(to) ? to : null },
    meetings: can('meetings')
      ? { total: meetings.length, byStatus: tally(meetings, (m) => m.status), byType: tally(meetings, (m) => m.type), byMonth, list: meetings }
      : null,
    agenda: can('agenda') ? { total: agenda.length, byStatus: tally(agenda, (a) => a.status) } : null,
    memos: can('memos') ? { total: memos.length, byStatus: tally(memos, (m) => m.status), byPriority: tally(memos, (m) => m.priority) } : null,
    actionLetters: can('actionLetters') ? { total: letters.length, byStatus: tally(letters, (l) => l.status) } : null,
    users: can('users') ? { total: users.length, byRole: tally(users, (u) => u.role), byStatus: tally(users, (u) => u.status) } : null,
    mdas: can('mdas') ? { ministries: ministries.length, stateDepartments: departments.length, agencies: agencies.length } : null,
  });
}

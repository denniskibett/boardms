// app/(admin)/dashboard/page.tsx — real counts and lists, each section shown only when the role can view the module.
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  FolderOpen,
  Mail,
  Users,
  UsersRound,
} from 'lucide-react';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/kit';
import MetricCard, { MetricGrid } from '@/components/dashboard/MetricCard';
import {
  ActivityList,
  AgendaList,
  MemoList,
  UpcomingMeetingsList,
  type ActivityRow,
  type AgendaRow,
  type MeetingRow,
  type MemoRow,
} from '@/components/dashboard/DashboardLists';

export const metadata: Metadata = {
  title: 'Dashboard | boardms',
  description: 'Overview of meetings, agenda, memos and activity',
};
export const dynamic = 'force-dynamic';

type Db = ReturnType<typeof supabaseServer>;

/** Count rows; returns null when the table or query fails so the card shows "—" instead of breaking the page. */
async function count(db: Db, table: string, apply?: (q: any) => any): Promise<number | null> {
  try {
    let q = db.from(table).select('id', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count: n, error } = await q;
    return error ? null : (n ?? 0);
  } catch {
    return null;
  }
}

async function rows<T>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  try {
    const { data, error } = await p;
    return error ? [] : ((data as T[]) ?? []);
  } catch {
    return [];
  }
}

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Africa/Nairobi' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin');

  const can = (m: Parameters<typeof userCan>[1]) => userCan(user, m, 'view');
  const db = supabaseServer();
  const now = new Date().toISOString();

  const [
    upcomingCount,
    draftAgenda,
    memoCount,
    memoPending,
    pendingLetters,
    committees,
    ministries,
    activeUsers,
    resources,
    meetings,
    memos,
    agenda,
    activity,
    roleRow,
  ] = await Promise.all([
    can('meetings') ? count(db, 'meetings', (q) => q.gte('start_at', now)) : null,
    can('agenda') ? count(db, 'agenda', (q) => q.eq('status', 'draft')) : null,
    can('memos') ? count(db, 'gov_memos') : null,
    can('memos') ? count(db, 'gov_memos', (q) => q.in('status', ['submitted', 'pending', 'under_review', 'in_review'])) : null,
    can('actionLetters') ? count(db, 'action_letters', (q) => q.eq('status', 'pending')) : null,
    can('committees') ? count(db, 'cabinet_committees') : null,
    can('mdas') ? count(db, 'ministries') : null,
    can('users') ? count(db, 'users', (q) => q.eq('status', 'active')) : null,
    can('resources') ? count(db, 'resources') : null,
    can('meetings')
      ? rows<MeetingRow>(
          db.from('meetings').select('id, name, type, start_at, location, status').gte('start_at', now).order('start_at', { ascending: true }).limit(6),
        )
      : Promise.resolve([] as MeetingRow[]),
    can('memos')
      ? rows<MemoRow>(db.from('gov_memos').select('id, name, status, priority, updated_at, created_at').order('updated_at', { ascending: false }).limit(5))
      : Promise.resolve([] as MemoRow[]),
    can('agenda')
      ? rows<AgendaRow>(db.from('agenda').select('id, name, status, meeting_id, updated_at, created_at').order('updated_at', { ascending: false }).limit(5))
      : Promise.resolve([] as AgendaRow[]),
    can('audit')
      ? rows<ActivityRow>(db.from('audit_logs').select('id, action, target_type, metadata, created_at').order('created_at', { ascending: false }).limit(6))
      : Promise.resolve([] as ActivityRow[]),
    user.role ? db.from('system_roles').select('name').eq('role_key', user.role).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const roleName = (roleRow as { data: { name?: string } | null }).data?.name ?? user.role ?? '';
  const firstName = (user.name || user.email).split(/[\s@]/)[0];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Nairobi' });

  const cards = [
    can('meetings') && { icon: CalendarDays, label: 'Upcoming meetings', value: upcomingCount, href: '/meetings' },
    can('agenda') && { icon: BookOpen, label: 'Agenda items in draft', value: draftAgenda, href: '/agenda' },
    can('memos') && {
      icon: FileText,
      label: 'Cabinet memos',
      value: memoCount,
      hint: memoPending ? `${memoPending} awaiting review` : undefined,
      href: '/memos',
    },
    can('actionLetters') && { icon: Mail, label: 'Pending action letters', value: pendingLetters, href: '/action-letters' },
    can('committees') && { icon: UsersRound, label: 'Committees', value: committees, href: '/committees' },
    can('mdas') && { icon: Building2, label: 'Ministries', value: ministries, href: '/mdas' },
    can('users') && { icon: Users, label: 'Active users', value: activeUsers, href: '/users' },
    can('resources') && { icon: FolderOpen, label: 'Resources', value: resources, href: '/resources' },
  ].filter(Boolean) as { icon: typeof Users; label: string; value: number | null; hint?: string; href: string }[];

  const sections = [
    can('meetings') && <UpcomingMeetingsList key="m" rows={meetings} />,
    can('agenda') && <AgendaList key="a" rows={agenda} />,
    can('memos') && <MemoList key="memo" rows={memos} />,
    can('audit') && <ActivityList key="audit" rows={activity} />,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting()}, ${firstName}`} description={[roleName, today].filter(Boolean).join(' · ')} />

      {cards.length > 0 && (
        <MetricGrid>
          {cards.slice(0, 8).map((c) => (
            <MetricCard key={c.label} icon={c.icon} label={c.label} value={c.value ?? '—'} hint={c.hint} href={c.href} />
          ))}
        </MetricGrid>
      )}

      {sections.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">{sections}</div>
      ) : (
        cards.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            Your role has no modules yet. Ask a system administrator to grant access.
          </div>
        )
      )}
    </div>
  );
}

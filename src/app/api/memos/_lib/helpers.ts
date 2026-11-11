// Shared server helpers for the memos / decisions / action-letters / resources / committees / MDA routes.
import { supabaseServer } from '@/lib/supabase/server';
import type { SessionUser } from '@/lib/auth/permissions';

/** Session user id is the Supabase auth uuid; domain tables reference the integer users.id. */
export async function dbUserId(user: SessionUser): Promise<number | null> {
  const supabase = supabaseServer();
  if (user.id) {
    const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
    if (data?.id) return data.id;
  }
  if (!user.email) return null;
  const { data: byEmail } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
  return byEmail?.id ?? null;
}

/** Fetch `{id → row}` for a set of ids from a lookup table (avoids ambiguous PostgREST embeds). */
export async function lookup<T extends { id: number }>(
  table: string,
  ids: (number | null | undefined)[],
  columns = 'id, name',
): Promise<Map<number, T>> {
  const unique = [...new Set(ids.filter((v): v is number => typeof v === 'number'))];
  const map = new Map<number, T>();
  if (unique.length === 0) return map;
  const { data } = await supabaseServer().from(table).select(columns).in('id', unique);
  for (const row of (data ?? []) as unknown as T[]) map.set(row.id, row);
  return map;
}

export function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

/** Adds ministry / department / agency / creator names to memo rows. */
export async function enrichMemos<
  M extends { ministry_id?: number | null; state_department_id?: number | null; agency_id?: number | null; created_by?: number | null },
>(memos: M[]) {
  const [ministries, departments, agencies, users] = await Promise.all([
    lookup<{ id: number; name: string; acronym: string | null }>('ministries', memos.map((m) => m.ministry_id), 'id, name, acronym'),
    lookup<{ id: number; name: string }>('state_departments', memos.map((m) => m.state_department_id)),
    lookup<{ id: number; name: string }>('agencies', memos.map((m) => m.agency_id)),
    lookup<{ id: number; name: string; email: string }>('users', memos.map((m) => m.created_by), 'id, name, email'),
  ]);
  return memos.map((m) => ({
    ...m,
    ministry_name: m.ministry_id ? ministries.get(m.ministry_id)?.name ?? null : null,
    ministry_acronym: m.ministry_id ? ministries.get(m.ministry_id)?.acronym ?? null : null,
    state_department_name: m.state_department_id ? departments.get(m.state_department_id)?.name ?? null : null,
    agency_name: m.agency_id ? agencies.get(m.agency_id)?.name ?? null : null,
    creator_name: m.created_by ? users.get(m.created_by)?.name ?? null : null,
    creator_email: m.created_by ? users.get(m.created_by)?.email ?? null : null,
  }));
}

export function errorMessage(e: unknown, fallback = 'Unexpected error') {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return fallback;
}

/** "ministry_3" / "state_department_7" / "agency_12" → memo_affected_entities rows. */
export function affectedRows(memoId: number, entities: string[]) {
  return entities
    .map((key) => {
      const i = key.lastIndexOf('_');
      const entityType = key.slice(0, i);
      const id = toInt(key.slice(i + 1));
      if (!id || !['ministry', 'state_department', 'agency'].includes(entityType)) return null;
      return {
        memo_id: memoId,
        entity_type: entityType,
        ministry_id: entityType === 'ministry' ? id : null,
        state_department_id: entityType === 'state_department' ? id : null,
        agency_id: entityType === 'agency' ? id : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

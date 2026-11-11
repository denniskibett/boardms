// src/lib/audit.ts — server-only helper that writes one row to audit_logs.
// Never throws: auditing must not break the action being audited.
import { supabaseServer } from '@/lib/supabase/server';
import type { SessionUser } from '@/lib/auth/permissions';

/** users.id for a session user (session ids are Supabase auth UUIDs). */
export async function profileIdFor(user: Pick<SessionUser, 'id' | 'email'>): Promise<number | null> {
  const db = supabaseServer();
  const { data } = await db.from('users').select('id').eq('auth_id', user.id).maybeSingle();
  if (data?.id) return data.id;
  if (!user.email) return null;
  const { data: byEmail } = await db.from('users').select('id').eq('email', user.email.toLowerCase()).maybeSingle();
  return byEmail?.id ?? null;
}

export async function logAudit(
  actor: Pick<SessionUser, 'id' | 'email' | 'name'>,
  action: string,
  targetType: string,
  targetId: number | string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    const userId = await profileIdFor(actor);
    const numericTarget = targetId != null && /^\d+$/.test(String(targetId)) ? Number(targetId) : null;
    const { error } = await supabaseServer()
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        target_type: targetType,
        target_id: numericTarget,
        metadata: { ...metadata, actor: actor.name || actor.email, ...(numericTarget == null && targetId != null ? { target: String(targetId) } : {}) },
      });
    if (error) console.error('audit_logs insert failed:', error.message);
  } catch (e) {
    console.error('audit_logs insert failed:', e);
  }
}

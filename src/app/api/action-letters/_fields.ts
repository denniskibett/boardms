// Editable action_letters columns.
export const LETTER_STATUSES = ['pending', 'sent', 'acknowledged', 'in_progress', 'completed', 'overdue'] as const;

export function letterFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const int = (v: unknown) => (v === '' || v == null ? null : parseInt(String(v), 10) || null);
  if ('subject' in body) out.subject = String(body.subject ?? '').trim();
  if ('content' in body) out.content = body.content ? String(body.content) : null;
  if ('to_ministry_id' in body) out.to_ministry_id = int(body.to_ministry_id);
  if ('deliberation_id' in body) out.deliberation_id = int(body.deliberation_id);
  if ('due_date' in body) out.due_date = body.due_date ? String(body.due_date) : null;
  if ('status' in body && (LETTER_STATUSES as readonly string[]).includes(String(body.status))) {
    out.status = body.status;
    if (body.status === 'sent') out.sent_at = new Date().toISOString();
    if (body.status === 'acknowledged') out.acknowledged_at = new Date().toISOString();
  }
  return out;
}

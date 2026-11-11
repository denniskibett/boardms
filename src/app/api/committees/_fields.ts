// Editable cabinet_committees columns.
export function committeeFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if ('name' in body) out.name = String(body.name ?? '').trim();
  if ('description' in body) out.description = body.description ? String(body.description).trim() : null;
  if ('chair_title' in body) out.chair_title = body.chair_title ? String(body.chair_title).trim() : null;
  if ('status' in body) out.status = body.status === 'inactive' ? 'inactive' : 'active';
  if ('cluster_id' in body) out.cluster_id = body.cluster_id ? parseInt(String(body.cluster_id), 10) || null : null;
  return out;
}

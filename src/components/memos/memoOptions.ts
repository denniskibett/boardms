// Shared memo option lists and helpers.

export const MEMO_TYPES = [
  { value: 'cabinet', label: 'Cabinet Memo' },
  { value: 'interior', label: 'Interior Memo' },
  { value: 'treasury', label: 'Treasury Memo' },
  { value: 'presidential', label: 'Presidential Memo' },
];

export const MEMO_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const MEMO_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export interface Memo {
  id: number;
  name: string;
  summary: string | null;
  body?: string | null;
  memo_type: string;
  priority: string;
  status: string;
  ministry_id: number | null;
  state_department_id: number | null;
  agency_id: number | null;
  created_by: number | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at?: string;
  ministry_name?: string | null;
  ministry_acronym?: string | null;
  state_department_name?: string | null;
  agency_name?: string | null;
  creator_name?: string | null;
  creator_email?: string | null;
  affected_entities?: string[];
}

export const labelFor = (list: { value: string; label: string }[], v?: string | null) =>
  list.find((o) => o.value === v)?.label ?? (v ? v.replace(/_/g, ' ') : '—');

export const priorityTone = (p?: string | null) =>
  p === 'urgent' ? 'error' : p === 'high' ? 'warning' : p === 'medium' ? 'brand' : 'gray';

export function formatDate(d?: string | null) {
  if (!d) return '—';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '—' : t.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** fetch + JSON with the server's error message on failure. */
export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || `Request failed (${res.status})`);
  return json as T;
}

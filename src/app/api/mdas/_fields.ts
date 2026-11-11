// Editable columns per MDA type (shared by the /api/mdas routes).
export type MDAType = 'ministry' | 'department' | 'agency';

export const MDA_TABLE: Record<MDAType, string> = {
  ministry: 'ministries',
  department: 'state_departments',
  agency: 'agencies',
};

const FIELDS: Record<MDAType, string[]> = {
  ministry: ['name', 'acronym', 'headquarters', 'website', 'email', 'phone', 'status'],
  department: ['name', 'ministry_id', 'principal_secretary', 'location', 'website', 'email', 'phone', 'status'],
  agency: ['name', 'acronym', 'state_department_id', 'director_general', 'chairperson', 'location', 'website', 'email', 'phone', 'status'],
};

const INT_FIELDS = new Set(['ministry_id', 'state_department_id']);

export function parseType(v: string | null): MDAType | null {
  return v === 'ministry' || v === 'department' || v === 'agency' ? v : null;
}

/** Picks the allowed columns from a request body, normalising blanks to null. */
export function pickFields(type: MDAType, body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of FIELDS[type]) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === '' || v === undefined || v === null) out[key] = null;
    else if (INT_FIELDS.has(key)) out[key] = parseInt(String(v), 10) || null;
    else out[key] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

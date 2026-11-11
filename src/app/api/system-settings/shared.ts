// Shared helpers for /api/system-settings and /api/settings (same table, two legacy URLs).
import { supabaseServer } from '@/lib/supabase/server';

export const TIMEZONES = [
  { name: 'Africa/Nairobi', abbrev: 'EAT', utc_offset: '+03:00' },
  { name: 'UTC', abbrev: 'UTC', utc_offset: '+00:00' },
  { name: 'Europe/London', abbrev: 'GMT', utc_offset: '+00:00' },
  { name: 'Europe/Paris', abbrev: 'CET', utc_offset: '+01:00' },
  { name: 'Asia/Dubai', abbrev: 'GST', utc_offset: '+04:00' },
  { name: 'America/New_York', abbrev: 'EST', utc_offset: '-05:00' },
];

/** Columns an admin may write. Anything else in the request body is ignored. */
export const WRITABLE = [
  'name', 'version', 'timezone', 'date_format', 'language',
  'email_notifications', 'push_notifications', 'meeting_reminders', 'deadline_alerts', 'weekly_reports',
  'session_timeout', 'password_policy', 'two_factor_auth', 'ip_whitelist', 'audit_log_retention',
  'smtp_enabled', 'smtp_server', 'smtp_port', 'file_storage', 'max_file_size',
  'logo', 'slogan', 'logo_auth', 'logo_dark', 'logo_icon', 'logo_primary', 'favicon',
  'primary_color', 'secondary_color', 'system_email', 'system_email_name', 'copyright_text', 'description',
] as const;

/** Branding fields safe to show before sign-in (login page, favicon, colours). */
export const PUBLIC_FIELDS = [
  'name', 'description', 'slogan', 'logo', 'logo_auth', 'logo_dark', 'logo_icon', 'logo_primary', 'favicon',
  'primary_color', 'secondary_color', 'copyright_text', 'timezone', 'date_format', 'language', 'password_policy',
] as const;

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  id: 1,
  name: 'boardms',
  version: '1.0.0',
  timezone: 'Africa/Nairobi',
  date_format: 'DD/MM/YYYY',
  language: 'en',
  email_notifications: true,
  push_notifications: true,
  meeting_reminders: true,
  deadline_alerts: true,
  weekly_reports: false,
  session_timeout: 30,
  password_policy: 'strong',
  two_factor_auth: false,
  ip_whitelist: [],
  audit_log_retention: 365,
  smtp_enabled: false,
  smtp_server: '',
  smtp_port: 587,
  file_storage: 'supabase',
  max_file_size: 10,
  logo_auth: '/images/logo/auth-logo.svg',
  logo_dark: '/images/logo/logo-dark.svg',
  logo_icon: '/images/logo/logo-icon.svg',
  logo_primary: '/images/logo/logo.svg',
  primary_color: '#465fff',
  secondary_color: '#1e40af',
  favicon: '/favicon.ico',
  system_email: '',
  system_email_name: 'boardms',
  copyright_text: `© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`,
  description: 'Board and cabinet meeting management',
};

export async function loadSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseServer()
    .from('system_settings')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) console.error('system_settings read failed:', error.message);
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export function publicSubset(s: Record<string, unknown>) {
  return Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, s[k]]));
}

export async function saveSettings(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const k of WRITABLE) if (k in body) patch[k] = body[k];
  patch.updated_at = new Date().toISOString();

  const db = supabaseServer();
  const { data: existing } = await db.from('system_settings').select('id').order('id', { ascending: true }).limit(1).maybeSingle();
  const res = existing
    ? await db.from('system_settings').update(patch).eq('id', existing.id).select().single()
    : await db.from('system_settings').insert({ ...patch, created_at: patch.updated_at }).select().single();
  return res;
}

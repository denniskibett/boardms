/**
 * boardms RBAC — single source of truth (safe to import on client and server).
 *
 * Model: each role has `permissions: { [module]: Action[] }` stored in `system_roles.permissions`.
 * Six actions only: view, create, edit, delete, approve, manage.
 *   - `manage` implies every other action on that module.
 *   - any of create/edit/delete/approve implies `view`.
 * The `sysadmin` role always has everything (so the system can't be locked out).
 */

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'manage'] as const;
export type Action = (typeof ACTIONS)[number];

export const ACTION_LABELS: Record<Action, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  manage: 'Manage',
};

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Home dashboard and summaries' },
  { key: 'meetings', label: 'Meetings', description: 'Schedule meetings, participants, minutes' },
  { key: 'agenda', label: 'Agenda', description: 'Agenda items and their documents' },
  { key: 'books', label: 'Meeting Books', description: 'Compile and read the meeting book' },
  { key: 'memos', label: 'Cabinet Memos', description: 'Draft, submit and approve memos' },
  { key: 'decisions', label: 'Decisions', description: 'Cabinet decisions and extracts' },
  { key: 'actionLetters', label: 'Action Letters', description: 'Issue and track action letters' },
  { key: 'committees', label: 'Committees', description: 'Committees and membership' },
  { key: 'resources', label: 'Resources', description: 'Document library' },
  { key: 'mdas', label: 'MDAs', description: 'Ministries, departments and agencies' },
  { key: 'users', label: 'Users', description: 'User accounts' },
  { key: 'roles', label: 'Roles & Permissions', description: 'Who can do what' },
  { key: 'reports', label: 'Reports', description: 'Reports and analytics' },
  { key: 'audit', label: 'Audit Trail', description: 'System activity log' },
  { key: 'settings', label: 'System Settings', description: 'Branding and configuration' },
] as const;
export type ModuleKey = (typeof MODULES)[number]['key'];
export type Permissions = Partial<Record<ModuleKey, Action[]>>;

export const SUPER_ROLE = 'sysadmin';

/** "Cabinet Secretary" / "cabinet-secretary" → "cabinet_secretary". */
const ROLE_ALIASES: Record<string, string> = {
  business_administrator: 'admin',
  administrator: 'admin',
  system_administrator: 'sysadmin',
  system_admin: 'sysadmin',
  cabinet_office_officer: 'co_officer',
  co_officer: 'co_officer',
};

export function normalizeRoleKey(role?: string | null): string | null {
  if (!role) return null;
  const key = role.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ROLE_ALIASES[key] ?? key;
}

/** Legacy verbs stored before the clean-up, mapped onto the six actions. */
const LEGACY_ACTION: Record<string, Action | null> = {
  read: 'view',
  view: 'view',
  create: 'create',
  draft: 'create',
  prepare: 'create',
  generate: 'create',
  schedule: 'create',
  update: 'edit',
  edit: 'edit',
  submit: 'edit',
  process: 'edit',
  minute: 'edit',
  track: 'edit',
  assign: 'edit',
  delete: 'delete',
  approve: 'approve',
  sign: 'approve',
  certify: 'approve',
  recommend: 'approve',
  manage: 'manage',
  assign_roles: 'manage',
  system_config: 'manage',
};

const MODULE_KEYS = new Set<string>(MODULES.map((m) => m.key));

/** Accepts anything stored in system_roles.permissions and returns a clean map. */
export function normalizePermissions(raw: unknown): Permissions {
  const out: Permissions = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [mod, actions] of Object.entries(raw as Record<string, unknown>)) {
    if (!MODULE_KEYS.has(mod) || !Array.isArray(actions)) continue;
    const set = new Set<Action>();
    for (const a of actions) {
      const mapped = LEGACY_ACTION[String(a).toLowerCase()];
      if (mapped) set.add(mapped);
    }
    if (set.size) out[mod as ModuleKey] = ACTIONS.filter((a) => set.has(a));
  }
  return out;
}

export function can(
  roleKey: string | null | undefined,
  perms: Permissions | null | undefined,
  module: ModuleKey,
  action: Action = 'view',
): boolean {
  if (normalizeRoleKey(roleKey) === SUPER_ROLE) return true;
  const list = perms?.[module];
  if (!list?.length) return false;
  if (list.includes('manage') || list.includes(action)) return true;
  return action === 'view'; // any other action on the module implies view
}

const ALL: Action[] = ["manage"];
const V: Action[] = ['view'];
const CE: Action[] = ['view', 'create', 'edit'];
const VA: Action[] = ['view', 'approve'];

/** Clean defaults per role — used by "Reset to default" in the Roles screen and the seed. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permissions> = {
  sysadmin: Object.fromEntries(MODULES.map((m) => [m.key, ALL])) as Permissions,
  admin: {
    ...(Object.fromEntries(MODULES.map((m) => [m.key, ALL])) as Permissions),
  },
  president: {
    dashboard: V, meetings: VA, agenda: V, books: V, memos: VA, decisions: VA, actionLetters: VA,
    committees: V, resources: V, mdas: V, users: V, reports: V,
  },
  deputy_president: {
    dashboard: V, meetings: VA, agenda: V, books: V, memos: VA, decisions: VA, actionLetters: VA,
    committees: ['view', 'create', 'edit'], resources: V, mdas: V, users: V, reports: V,
  },
  prime_cabinet_secretary: {
    dashboard: V, meetings: ['view', 'create', 'edit', 'approve'], agenda: ['view', 'create', 'edit', 'approve'],
    books: ['view', 'create'], memos: ['view', 'create', 'edit', 'approve'], decisions: ['view', 'create', 'edit', 'approve'],
    actionLetters: ['view', 'create', 'edit', 'approve'], committees: ['manage'], resources: CE, mdas: V, users: V, reports: V,
  },
  cabinet_secretariat: {
    dashboard: V, meetings: ['manage'], agenda: ['manage'], books: ['manage'], memos: ['manage'], decisions: ['manage'],
    actionLetters: ['manage'], committees: ['manage'], resources: ['manage'], mdas: CE, users: CE, reports: V, audit: V,
  },
  attorney_general: {
    dashboard: V, meetings: V, agenda: V, books: V, memos: VA, decisions: VA, actionLetters: V,
    committees: V, resources: V, mdas: V, reports: V,
  },
  cabinet_secretary: {
    dashboard: V, meetings: V, agenda: V, books: V, memos: CE, decisions: V, actionLetters: ['view', 'edit'],
    committees: V, resources: V, mdas: V, reports: V,
  },
  principal_secretary: {
    dashboard: V, meetings: V, agenda: V, books: V, memos: CE, decisions: V, actionLetters: ['view', 'edit'],
    committees: V, resources: V, mdas: V, reports: V,
  },
  director: {
    dashboard: V, meetings: V, agenda: V, books: V, memos: CE, decisions: V, actionLetters: V, committees: V,
    resources: V, mdas: V,
  },
  assistant_director: {
    dashboard: V, meetings: V, agenda: V, books: V, memos: CE, decisions: V, actionLetters: V, committees: V,
    resources: V, mdas: V,
  },
  co_officer: {
    dashboard: V, meetings: CE, agenda: CE, books: ['view', 'create'], memos: ['view', 'edit'], decisions: CE,
    actionLetters: CE, committees: V, resources: CE, mdas: V, reports: V,
  },
};

/**
 * Normalise every role in system_roles to the clean RBAC model (src/lib/rbac.ts).
 *
 *   pnpm tsx scripts/rbac-clean-roles.ts           # dry run: prints the changes
 *   pnpm tsx scripts/rbac-clean-roles.ts --apply   # backs up to backups/ then writes
 *
 * Roles with a clean default get that default; any other role keeps its permissions,
 * converted from legacy verbs (read/update/review/…) to view/create/edit/delete/approve/manage.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_ROLE_PERMISSIONS, normalizePermissions } from '../src/lib/rbac';

const apply = process.argv.includes('--apply');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  const { data: roles, error } = await db.from('system_roles').select('*').order('hierarchy_level');
  if (error) throw error;

  if (apply) {
    mkdirSync('backups', { recursive: true });
    const file = `backups/system_roles-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    writeFileSync(file, JSON.stringify(roles, null, 2));
    console.log(`Backup written: ${file}`);
  }

  for (const r of roles ?? []) {
    const next = DEFAULT_ROLE_PERMISSIONS[r.role_key] ?? normalizePermissions(r.permissions);
    const summary = Object.entries(next)
      .map(([m, a]) => `${m}:${(a as string[]).join('/')}`)
      .join('  ');
    console.log(`\n${r.role_key} (${r.name})\n  ${summary}`);
    if (apply) {
      const { error: e } = await db
        .from('system_roles')
        .update({ permissions: next, updated_at: new Date().toISOString() })
        .eq('id', r.id);
      if (e) throw e;
    }
  }
  console.log(apply ? '\nDone — roles updated.' : '\nDry run only. Re-run with --apply to write.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

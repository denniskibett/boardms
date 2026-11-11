/**
 * Create (or reset) one test login per role, for testing RBAC.
 *
 *   pnpm tsx scripts/seed-test-users.ts            # dry run: lists what it would do
 *   pnpm tsx scripts/seed-test-users.ts --apply    # creates/resets users, writes test-users.local.json
 *
 * Emails: test.<role_key>@boardms.test  (e.g. test.cabinet_secretary@boardms.test)
 * Each run with --apply sets a NEW random password and writes all logins to
 * test-users.local.json (git-ignored). Passwords are never printed.
 * Delete them later with:  pnpm tsx scripts/seed-test-users.ts --delete --apply
 */
import 'dotenv/config';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');
const remove = process.argv.includes('--delete');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = () => `Bm-${randomBytes(9).toString('base64url')}!7`;

async function findAuthUser(email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const { data: roles, error } = await db.from('system_roles').select('role_key, name').order('hierarchy_level');
  if (error) throw error;

  const out: { role: string; role_name: string; email: string; password: string }[] = [];

  for (const r of roles ?? []) {
    const email = `test.${r.role_key}@boardms.test`;
    const existing = await findAuthUser(email);

    if (remove) {
      console.log(`${apply ? 'Deleting' : 'Would delete'} ${email}`);
      if (apply) {
        if (existing) await db.auth.admin.deleteUser(existing.id);
        await db.from('users').delete().eq('email', email);
      }
      continue;
    }

    const pw = password();
    console.log(`${apply ? (existing ? 'Resetting' : 'Creating') : existing ? 'Would reset' : 'Would create'} ${email}  (${r.name})`);
    if (!apply) continue;

    let authId = existing?.id;
    if (existing) {
      const { error: e } = await db.auth.admin.updateUserById(existing.id, { password: pw, email_confirm: true });
      if (e) throw e;
    } else {
      const { data, error: e } = await db.auth.admin.createUser({
        email,
        password: pw,
        email_confirm: true,
        user_metadata: { name: `Test ${r.name}`, test_user: true },
      });
      if (e) throw e;
      authId = data.user.id;
    }

    // Store the role key; sign-in normalises it the same way as legacy display names.
    const profile = { email, name: `Test ${r.name}`, role: r.role_key, status: 'active', auth_id: authId };
    const { data: row } = await db.from('users').select('id').eq('email', email).maybeSingle();
    const { error: pe } = row
      ? await db.from('users').update(profile).eq('id', row.id)
      : await db.from('users').insert([{ ...profile, created_at: new Date().toISOString() }]);
    if (pe) throw pe;

    out.push({ role: r.role_key, role_name: r.name, email, password: pw });
  }

  if (apply && !remove) {
    writeFileSync('test-users.local.json', JSON.stringify(out, null, 2));
    console.log(`\n${out.length} logins written to test-users.local.json (git-ignored). Passwords are not printed.`);
  } else if (!apply) {
    console.log('\nDry run only. Re-run with --apply.');
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

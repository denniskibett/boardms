import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/kit';
import UsersList from '@/components/users/UsersList';
import AccessDenied from '@/components/users/AccessDenied';

export const metadata: Metadata = {
  title: 'Users | boardms',
  description: 'User accounts, roles and access',
};

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin');

  return (
    <div>
      <PageHeader
        title="Users"
        description="Accounts, roles and sign-in access."
        actions={
          userCan(user, 'roles', 'view') ? (
            <Link
              href="/users/roles"
              className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
            >
              Roles &amp; permissions
            </Link>
          ) : null
        }
      />
      {userCan(user, 'users', 'view') ? <UsersList /> : <AccessDenied what="user management" />}
    </div>
  );
}

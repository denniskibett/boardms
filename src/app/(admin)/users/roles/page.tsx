import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/kit';
import RolesPermissions from '@/components/users/RolesPermissions';
import AccessDenied from '@/components/users/AccessDenied';

export const metadata: Metadata = {
  title: 'Roles & Permissions | boardms',
  description: 'Who can do what in each module',
};

export default async function RolesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin');

  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Decide what each role can view, create, edit, delete, approve or manage." />
      {userCan(user, 'roles', 'view') ? <RolesPermissions /> : <AccessDenied what="roles and permissions" />}
    </div>
  );
}

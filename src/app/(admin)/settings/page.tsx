import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/kit';
import SystemSettings from '@/components/settings/SystemSettings';
import AccessDenied from '@/components/users/AccessDenied';

export const metadata: Metadata = {
  title: 'System Settings | boardms',
  description: 'Branding and configuration',
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin');
  return (
    <div>
      <PageHeader title="System settings" description="Branding, regional settings, notifications and security." />
      {userCan(user, 'settings', 'view') ? (
        <SystemSettings canEdit={userCan(user, 'settings', 'edit')} />
      ) : (
        <AccessDenied what="system settings" />
      )}
    </div>
  );
}

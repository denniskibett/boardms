import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/kit';
import AuditTrail from '@/components/audit/AuditTrail';
import AccessDenied from '@/components/users/AccessDenied';

export const metadata: Metadata = {
  title: 'Audit Trail | boardms',
  description: 'Who changed what, and when',
};

export default async function AuditPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin');
  return (
    <div>
      <PageHeader title="Audit trail" description="Who changed what, and when." />
      {userCan(user, 'audit', 'view') ? <AuditTrail /> : <AccessDenied what="the audit trail" />}
    </div>
  );
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/kit';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import AccessDenied from '@/components/users/AccessDenied';

export const metadata: Metadata = {
  title: 'Reports | boardms',
  description: 'Meetings, agenda, memos and user figures',
};

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin');
  return (
    <div>
      <PageHeader title="Reports" description="Figures for meetings, agenda items, memos and action letters over a chosen period." />
      {userCan(user, 'reports', 'view') ? <ReportsDashboard /> : <AccessDenied what="reports" />}
    </div>
  );
}

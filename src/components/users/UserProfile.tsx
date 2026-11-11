'use client';

/** Single user page (/users/[id]): details card with the same "…" actions as the users table. */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ActionsMenu, Card, DetailList, PageHeader, StatusBadge, toneForStatus } from '@/components/ui/kit';
import Notice, { type NoticeState } from './Notice';
import { Avatar, fmtDate, useUserActions, type UserRecord } from './useUserActions';

export default function UserProfile({ user: initial }: { user: UserRecord }) {
  const router = useRouter();
  const [user, setUser] = useState(initial);
  const [notice, setNotice] = useState<NoticeState>(null);

  const ua = useUserActions({
    setNotice,
    onChanged: (saved) => (saved?.id ? setUser(saved) : router.refresh()),
    onDeleted: () => router.push('/users'),
  });

  return (
    <div className="space-y-6">
      <Link href="/users" className="inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      <PageHeader title={user.name} description={user.email} actions={<ActionsMenu items={ua.items(user).filter((i) => i.label !== 'View')} />} />

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.name} image={user.image} size={80} />
            <h2 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">{user.name}</h2>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">{user.role}</p>
            <div className="mt-3">
              <StatusBadge tone={toneForStatus(user.status)}>{user.status ?? '—'}</StatusBadge>
            </div>
          </div>
        </Card>

        <Card title="Account" className="lg:col-span-2">
          <DetailList
            items={[
              { label: 'Email', value: <span className="break-all">{user.email}</span> },
              { label: 'Phone', value: user.phone || '—' },
              { label: 'Role', value: user.role },
              { label: 'Status', value: user.status ?? '—' },
              { label: 'Last sign-in', value: fmtDate(user.last_login, true) },
              { label: 'Created', value: fmtDate(user.created_at) },
              { label: 'Sign-in account', value: user.auth_id ? 'Linked' : 'Not linked' },
            ]}
          />
        </Card>
      </div>

      {ua.element}
    </div>
  );
}

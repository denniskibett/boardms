import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser, userCan } from '@/lib/auth/permissions';
import { supabaseServer } from '@/lib/supabase/server';
import UserProfile from '@/components/users/UserProfile';
import AccessDenied from '@/components/users/AccessDenied';
import type { UserRecord } from '@/components/users/useUserActions';

type Props = { params: Promise<{ id: string }> };

const COLUMNS = 'id, auth_id, name, email, role, image, status, phone, last_login, created_at';

async function loadUser(id: string) {
  const q = supabaseServer().from('users').select(COLUMNS);
  const { data } = await (/^\d+$/.test(id) ? q.eq('id', Number(id)) : q.eq('auth_id', id)).maybeSingle();
  return (data as UserRecord | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me || !userCan(me, 'users', 'view')) return { title: 'User | boardms' };
  const user = await loadUser(id);
  return { title: user ? `${user.name} | Users | boardms` : 'User not found | boardms' };
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect('/signin');

  const user = await loadUser(id);
  const self = !!user && (user.auth_id === me.id || user.email?.toLowerCase() === me.email?.toLowerCase());
  if (!userCan(me, 'users', 'view') && !self) return <AccessDenied what="this user" />;
  if (!user) notFound();
  if (self) redirect('/profile');

  return <UserProfile user={user} />;
}

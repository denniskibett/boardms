import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import MyProfile from '@/components/users/MyProfile';

export const metadata: Metadata = {
  title: 'My profile | boardms',
  description: 'Your account details',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');
  return <MyProfile />;
}

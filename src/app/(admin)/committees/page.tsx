// app/(admin)/committees/page.tsx
import type { Metadata } from 'next';
import CommitteesList from '@/components/committees/CommitteesList';

export const metadata: Metadata = {
  title: 'Committees | E-Cabinet System',
  description: 'View and manage cabinet committees',
};

export default function CommitteesPage() {
  return <CommitteesList />;
}

// app/(admin)/memos/all/page.tsx
import type { Metadata } from 'next';
import MemosTable from '@/components/memos/MemosTable';

export const metadata: Metadata = {
  title: 'All Memos | E-Cabinet System',
  description: 'View all government memos across all ministries',
};

export default function AllMemosPage() {
  return <MemosTable scope="all" />;
}

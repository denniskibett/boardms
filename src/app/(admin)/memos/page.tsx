// app/(admin)/memos/page.tsx
import type { Metadata } from 'next';
import MemosTable from '@/components/memos/MemosTable';

export const metadata: Metadata = {
  title: 'My Memos | E-Cabinet System',
  description: 'View and manage the memos you have created',
};

export default function MyMemosPage() {
  return <MemosTable scope="my" />;
}

// app/(admin)/mdas/page.tsx
import type { Metadata } from 'next';
import MDAsManager from '@/components/mdas/MDAsManager';

export const metadata: Metadata = {
  title: 'MDAs | E-Cabinet System',
  description: 'Ministries, state departments and agencies',
};

export default function MDAsPage() {
  return <MDAsManager />;
}

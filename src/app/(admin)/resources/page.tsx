// app/(admin)/resources/page.tsx
import type { Metadata } from 'next';
import ResourcesManager from '@/components/resources/ResourcesManager';

export const metadata: Metadata = {
  title: 'Resources | E-Cabinet System',
  description: 'Cabinet document library',
};

export default function ResourcesPage() {
  return <ResourcesManager />;
}

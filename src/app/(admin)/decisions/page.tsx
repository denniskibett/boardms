// app/(admin)/decisions/page.tsx
import type { Metadata } from 'next';
import DecisionsList from '@/components/decisions/DecisionsList';

export const metadata: Metadata = {
  title: 'Cabinet Decisions | E-Cabinet System',
  description: 'View all cabinet decisions and resolutions',
};

export default function DecisionsPage() {
  return <DecisionsList />;
}

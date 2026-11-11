import type { Metadata } from 'next';
import ActionLettersList from '@/components/action-letters/ActionLettersList';

export const metadata: Metadata = {
  title: 'Action Letters | E-Cabinet System',
  description: 'Manage action letters sent to ministries for implementation',
};

export default function ActionLettersPage() {
  return <ActionLettersList />;
}

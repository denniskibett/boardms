import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import MeetingBook from '@/components/books/MeetingBook';

export const metadata: Metadata = { title: 'Meeting Book' };

export default async function MeetingBookPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  return (
    <div>
      <Link href="/books" className="mb-4 inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-800 dark:hover:text-white">
        <ChevronLeft className="h-4 w-4" /> Meeting Books
      </Link>
      <MeetingBook meetingId={meetingId} />
    </div>
  );
}

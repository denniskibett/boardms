import SingleMeeting from '@/components/meetings/SingleMeeting';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  // ✅ FIX: Await params for Next.js 13+
  const { id } = await params;
  return <SingleMeeting meetingId={id} />;
}
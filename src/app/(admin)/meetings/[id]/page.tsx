import SingleMeeting from '@/components/meetings/SingleMeeting';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  // ✅ CORRECT: Await params for Next.js 14+
  const { id } = await params;
  return <SingleMeeting meetingId={id} />;
}
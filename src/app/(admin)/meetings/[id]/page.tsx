// app/meetings/[id]/page.tsx
import SingleMeeting from '@/components/meetings/SingleMeeting';

interface PageProps {
  params: {
    id: string;
  };
}

export default function MeetingPage({ params }: PageProps) {
  return <SingleMeeting meetingId={params.id} />;
}
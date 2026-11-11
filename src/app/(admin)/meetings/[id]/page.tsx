// src/app/(admin)/meetings/[id]/page.tsx
"use client";
import { useParams } from 'next/navigation';
import SingleMeeting from '@/components/meetings/SingleMeeting';
import { useMeetingsData } from '@/hooks/useMeetingsData';

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.id as string;
  // Only system settings (timezone / time format) are needed here; SingleMeeting loads the meeting itself.
  const { settings } = useMeetingsData();

  return <SingleMeeting meetingId={meetingId} settings={settings} />;
}

// src/app/(admin)/meetings/[id]/page.tsx
"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SingleMeeting from '@/components/meetings/SingleMeeting';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { Loader2 } from 'lucide-react';

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.id as string;
  const { 
    settings, 
    loading: settingsLoading,
    fetchAgendas,
    agendaLoading
  } = useMeetingsData();
  
  const [isLoading, setIsLoading] = useState(true);

  // Pre-fetch agendas for this meeting as soon as the page loads
  useEffect(() => {
    const loadAgendas = async () => {
      if (meetingId) {
        setIsLoading(true);
        try {
          // This will use cache if available, otherwise fetch
          await fetchAgendas(meetingId);
        } catch (error) {
          console.error('Error pre-fetching agendas:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAgendas();
  }, [meetingId, fetchAgendas]);

  // Show loading while settings are loading or agendas are being pre-fetched
  if ((settingsLoading && !settings) || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return <SingleMeeting meetingId={meetingId} settings={settings} />;
}
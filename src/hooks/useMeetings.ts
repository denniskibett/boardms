import { useState, useEffect } from 'react';

export interface Meeting {
  id: string;
  name: string;
  type: string;
  start_at: string;
  location: string;
  chair_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  created_by: string;
  description?: string;
  period?: string;
  actual_end?: string;
  colour: string;
  committee?: string;
  chair_name?: string;
  attendees_count?: number;
}

interface UseMeetingsOptions {
  date?: string;
  committee?: string;
  type?: string;
  autoFetch?: boolean;
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { date, committee, type, autoFetch = true } = options;
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFetch) {
      fetchMeetings();
    }
  }, [date, committee, type, autoFetch]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (committee) params.append('committee', committee);
      if (type) params.append('type', type);
      
      const url = `/api/meetings?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch meetings: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setMeetings(data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchMeetings();
  };

  // Helper methods
  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.start_at) >= new Date()
  );
  
  const pastMeetings = meetings.filter(meeting => 
    new Date(meeting.start_at) < new Date()
  );
  
  const todayMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.start_at);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  });

  return {
    meetings,
    upcomingMeetings,
    pastMeetings,
    todayMeetings,
    loading,
    error,
    refetch,
    fetchMeetings
  };
}
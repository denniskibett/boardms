// src/hooks/useMeetings.ts
import { useState, useEffect, useCallback } from 'react';

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
  useCache?: boolean; // New option
  cacheKey?: string;  // New option
}

// Simple in-memory cache
const meetingsCache = new Map<string, {
  data: Meeting[];
  timestamp: number;
  filters: any;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { date, committee, type, autoFetch = true, useCache = true, cacheKey = 'default' } = options;
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key based on filters
  const getCacheKey = useCallback(() => {
    return `${cacheKey}-${date || ''}-${committee || ''}-${type || ''}`;
  }, [cacheKey, date, committee, type]);

  // Check if cache is valid
  const isCacheValid = useCallback((key: string) => {
    const cached = meetingsCache.get(key);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < CACHE_DURATION;
  }, []);

  const fetchMeetings = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = getCacheKey();
      
      // Check cache first (unless skipCache is true)
      if (useCache && !skipCache && isCacheValid(cacheKey)) {
        const cached = meetingsCache.get(cacheKey);
        if (cached) {
          setMeetings(cached.data);
          setLoading(false);
          return;
        }
      }
      
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
        
        // Store in cache
        if (useCache) {
          meetingsCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            filters: { date, committee, type }
          });
        }
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
  }, [date, committee, type, useCache, getCacheKey, isCacheValid]);

  useEffect(() => {
    if (autoFetch) {
      fetchMeetings();
    }
  }, [autoFetch, fetchMeetings]);

  const refetch = useCallback(() => {
    // Clear cache for this key and fetch fresh
    const key = getCacheKey();
    meetingsCache.delete(key);
    fetchMeetings(true);
  }, [getCacheKey, fetchMeetings]);

  const clearCache = useCallback(() => {
    meetingsCache.clear();
  }, []);

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

  // Group meetings by status
  const meetingsByStatus = meetings.reduce((acc, meeting) => {
    const status = meeting.status || 'unknown';
    if (!acc[status]) acc[status] = [];
    acc[status].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  // Group meetings by type
  const meetingsByType = meetings.reduce((acc, meeting) => {
    const type = meeting.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  return {
    meetings,
    upcomingMeetings,
    pastMeetings,
    todayMeetings,
    meetingsByStatus,
    meetingsByType,
    loading,
    error,
    refetch,
    clearCache,
    fetchMeetings
  };
}

export interface MeetingStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

/** Counts derived from an already-loaded meetings list (there is no /api/meetings/stats endpoint). */
export function computeMeetingStats(meetings: Meeting[]): MeetingStats {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7)); // Monday
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86_400_000);
  const endOfDay = new Date(startOfDay.getTime() + 86_400_000);

  const stats: MeetingStats = { today: 0, thisWeek: 0, thisMonth: 0, total: meetings.length, byType: {}, byStatus: {} };
  for (const m of meetings) {
    const d = new Date(m.start_at);
    if (d >= startOfDay && d < endOfDay) stats.today++;
    if (d >= startOfWeek && d < endOfWeek) stats.thisWeek++;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) stats.thisMonth++;
    stats.byType[m.type || 'unknown'] = (stats.byType[m.type || 'unknown'] || 0) + 1;
    stats.byStatus[m.status || 'unknown'] = (stats.byStatus[m.status || 'unknown'] || 0) + 1;
  }
  return stats;
}

// src/hooks/useMeetingsData.ts
import { useMeetings, useMeetingsStats } from './useMeetings';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Add Agenda interfaces
interface AgendaDocument {
  id: string;
  agenda_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  metadata: any;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
}

interface Agenda {
  id: string;
  name: string;
  description: string;
  status: string;
  sort_order: number;
  presenter_id: string;
  ministry_id: string | null;
  memo_id: string | null;
  cabinet_approval_required: boolean;
  meeting_id: string;
  created_at: string;
  updated_at: string;
  documents?: AgendaDocument[];
  ministry?: {
    id: string;
    name: string;
  };
  presenter?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Add document conversion cache interface
interface DocumentConversion {
  htmlContent: string;
  timestamp: number;
  type: string;
  documentId: string;
}

interface CachedData {
  categories: {
    locations: any[];
    meetingTypes: any[];
    meetingStatuses: any[];
    colours: any[];
    decisionStatus: any[];
  };
  users: any[];
  settings: any;
  agendas: {
    [meetingId: string]: Agenda[];
  };
  agendaDocuments: {
    [agendaId: string]: AgendaDocument[];
  };
  documentConversions: {
    [documentId: string]: DocumentConversion;
  };
  lastFetched: {
    categories: number;
    users: number;
    settings: number;
    agendas: { [meetingId: string]: number };
    documents: { [agendaId: string]: number };
    conversions: { [documentId: string]: number };
  };
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for supporting data
const AGENDA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for agenda data
const CONVERSION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for document conversions

export function useMeetingsData() {
  // Use your enhanced useMeetings hook with caching enabled
  const meetingsData = useMeetings({ 
    autoFetch: true,
    useCache: true,
    cacheKey: 'all-meetings'
  });
  
  const statsData = useMeetingsStats();
  
  // State for supporting data with caching
  const [cachedData, setCachedData] = useState<CachedData>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('meetings-supporting-data');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse supporting data cache', e);
        }
      }
    }
    
    return {
      categories: { 
        locations: [], 
        meetingTypes: [], 
        meetingStatuses: [], 
        colours: [],
        decisionStatus: []
      },
      users: [],
      settings: { 
        timezone: 'Africa/Nairobi', 
        date_format: 'DD/MM/YYYY', 
        time_format: '24' 
      },
      agendas: {},
      agendaDocuments: {},
      documentConversions: {},
      lastFetched: { 
        categories: 0, 
        users: 0, 
        settings: 0,
        agendas: {},
        documents: {},
        conversions: {}
      }
    };
  });
  
  const [supportingLoading, setSupportingLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState<{ [meetingId: string]: boolean }>({});

  // Save supporting data to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('meetings-supporting-data', JSON.stringify(cachedData));
    }
  }, [cachedData]);

  // Check if supporting data is expired
  const isSupportingDataExpired = useCallback((type: keyof CachedData['lastFetched']) => {
    const age = Date.now() - (cachedData.lastFetched[type] || 0);
    return age > CACHE_DURATION;
  }, [cachedData.lastFetched]);

  // Check if agenda data is expired for a specific meeting
  const isAgendaExpired = useCallback((meetingId: string) => {
    const age = Date.now() - (cachedData.lastFetched.agendas[meetingId] || 0);
    return age > AGENDA_CACHE_DURATION;
  }, [cachedData.lastFetched.agendas]);

  // Check if document data is expired for a specific agenda
  const isDocumentsExpired = useCallback((agendaId: string) => {
    const age = Date.now() - (cachedData.lastFetched.documents[agendaId] || 0);
    return age > AGENDA_CACHE_DURATION;
  }, [cachedData.lastFetched.documents]);

  // Check if document conversion is expired
  const isConversionExpired = useCallback((documentId: string) => {
    const age = Date.now() - (cachedData.lastFetched.conversions[documentId] || 0);
    return age > CONVERSION_CACHE_DURATION;
  }, [cachedData.lastFetched.conversions]);

  // Get document conversion from cache
  const getDocumentConversion = useCallback((documentId: string): string | null => {
    const conversion = cachedData.documentConversions[documentId];
    if (!conversion) return null;
    
    if (isConversionExpired(documentId)) {
      return null;
    }
    
    return conversion.htmlContent;
  }, [cachedData.documentConversions, isConversionExpired]);

  // Set document conversion in cache
  const setDocumentConversion = useCallback((documentId: string, htmlContent: string, type: string) => {
    setCachedData(prev => ({
      ...prev,
      documentConversions: {
        ...prev.documentConversions,
        [documentId]: {
          htmlContent,
          timestamp: Date.now(),
          type,
          documentId
        }
      },
      lastFetched: {
        ...prev.lastFetched,
        conversions: {
          ...prev.lastFetched.conversions,
          [documentId]: Date.now()
        }
      }
    }));
  }, []);

  // Fetch all supporting data at once
  const fetchSupportingData = useCallback(async () => {
    setSupportingLoading(true);
    
    try {
      const needCategories = isSupportingDataExpired('categories');
      const needUsers = isSupportingDataExpired('users');
      const needSettings = isSupportingDataExpired('settings');
      
      if (!needCategories && !needUsers && !needSettings) {
        setSupportingLoading(false);
        return;
      }

      const promises = [];
      
      if (needCategories) {
        promises.push(
          fetch('/api/categories?all=true').then(r => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (needUsers) {
        promises.push(
          fetch('/api/users?roles=President,Deputy President,Cabinet Secretary,Principal Secretary,Prime Cabinet Secretary,Attorney General&orderBy=name&order=asc').then(r => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (needSettings) {
        promises.push(
          fetch('/api/system-settings').then(r => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      const [categoriesData, usersData, settingsData] = await Promise.all(promises);

      setCachedData(prev => {
        const newData = { ...prev };
        
        if (categoriesData) {
          // ✅ FIX: Handle case where categoriesData might be an object with a data property
          let categoriesArray = categoriesData;
          
          // If categoriesData is an object with a data property that's an array
          if (categoriesData && typeof categoriesData === 'object' && 'data' in categoriesData && Array.isArray(categoriesData.data)) {
            categoriesArray = categoriesData.data;
          }
          // If categoriesData is an object with rows property (like from supabase)
          else if (categoriesData && typeof categoriesData === 'object' && 'rows' in categoriesData && Array.isArray(categoriesData.rows)) {
            categoriesArray = categoriesData.rows;
          }
          // If categoriesData is not an array, try to convert it
          else if (!Array.isArray(categoriesArray)) {
            console.warn('Categories data is not an array, using empty array', categoriesData);
            categoriesArray = [];
          }
          
          // Ensure we're working with an array
          if (Array.isArray(categoriesArray)) {
            newData.categories = {
              locations: categoriesArray.filter((c: any) => c?.type === 'location'),
              meetingTypes: categoriesArray.filter((c: any) => c?.type === 'meeting'),
              meetingStatuses: categoriesArray.filter((c: any) => c?.type === 'meeting_status'),
              colours: categoriesArray.filter((c: any) => c?.type === 'colour'),
              decisionStatus: categoriesArray.filter((c: any) => c?.type === 'decision_status')
            };
          } else {
            console.error('Could not extract categories array from response', categoriesData);
            newData.categories = prev.categories; // Keep existing categories
          }
          
          newData.lastFetched.categories = Date.now();
        }
        
        if (usersData) {
          // Handle users data similarly if needed
          let usersArray = usersData;
          if (usersData && typeof usersData === 'object' && 'data' in usersData && Array.isArray(usersData.data)) {
            usersArray = usersData.data;
          } else if (usersData && typeof usersData === 'object' && 'rows' in usersData && Array.isArray(usersData.rows)) {
            usersArray = usersData.rows;
          }
          newData.users = Array.isArray(usersArray) ? usersArray : [];
          newData.lastFetched.users = Date.now();
        }
        
        if (settingsData) {
          newData.settings = { ...newData.settings, ...settingsData };
          newData.lastFetched.settings = Date.now();
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error fetching supporting data:', error);
    } finally {
      setSupportingLoading(false);
    }
  }, [isSupportingDataExpired]);

  // Fetch agendas for a specific meeting
  const fetchAgendas = useCallback(async (meetingId: string, force = false) => {
    if (!meetingId) return [];
    
    // Check cache unless forced
    if (!force && !isAgendaExpired(meetingId)) {
      return cachedData.agendas[meetingId] || [];
    }

    setAgendaLoading(prev => ({ ...prev, [meetingId]: true }));

    try {
      console.log(`📋 Fetching agendas for meeting: ${meetingId}`);
      const response = await fetch(`/api/agenda?meetingId=${meetingId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agendas: ${response.status}`);
      }

      const agendaData = await response.json();
      
      // Handle different response formats
      let agendasArray = agendaData;
      if (agendaData && typeof agendaData === 'object' && 'data' in agendaData && Array.isArray(agendaData.data)) {
        agendasArray = agendaData.data;
      } else if (agendaData && typeof agendaData === 'object' && 'rows' in agendaData && Array.isArray(agendaData.rows)) {
        agendasArray = agendaData.rows;
      }
      
      if (!Array.isArray(agendasArray)) {
        console.error('Agendas data is not an array', agendaData);
        return [];
      }
      
      // For each agenda, check if we have cached documents
      const agendasWithDocs = await Promise.all(
        agendasArray.map(async (agenda: any) => {
          const cachedDocs = cachedData.agendaDocuments[agenda.id];
          const docsExpired = isDocumentsExpired(agenda.id);
          
          if (!force && cachedDocs && !docsExpired) {
            return { ...agenda, documents: cachedDocs };
          }
          
          // Fetch documents for this agenda
          try {
            const docsResponse = await fetch(`/api/agenda/documents?agendaId=${agenda.id}`);
            if (docsResponse.ok) {
              const documents = await docsResponse.json();
              
              // Handle different document response formats
              let docsArray = documents;
              if (documents && typeof documents === 'object' && 'data' in documents && Array.isArray(documents.data)) {
                docsArray = documents.data;
              } else if (documents && typeof documents === 'object' && 'rows' in documents && Array.isArray(documents.rows)) {
                docsArray = documents.rows;
              }
              
              // Cache the documents
              setCachedData(prev => ({
                ...prev,
                agendaDocuments: {
                  ...prev.agendaDocuments,
                  [agenda.id]: Array.isArray(docsArray) ? docsArray : []
                },
                lastFetched: {
                  ...prev.lastFetched,
                  documents: {
                    ...prev.lastFetched.documents,
                    [agenda.id]: Date.now()
                  }
                }
              }));
              
              return { ...agenda, documents: Array.isArray(docsArray) ? docsArray : [] };
            }
          } catch (error) {
            console.error(`Error fetching documents for agenda ${agenda.id}:`, error);
          }
          
          return agenda;
        })
      );

      // Update cache
      setCachedData(prev => ({
        ...prev,
        agendas: {
          ...prev.agendas,
          [meetingId]: agendasWithDocs
        },
        lastFetched: {
          ...prev.lastFetched,
          agendas: {
            ...prev.lastFetched.agendas,
            [meetingId]: Date.now()
          }
        }
      }));

      return agendasWithDocs;
    } catch (error) {
      console.error('Error fetching agendas:', error);
      return [];
    } finally {
      setAgendaLoading(prev => ({ ...prev, [meetingId]: false }));
    }
  }, [cachedData, isAgendaExpired, isDocumentsExpired]);

  // Fetch documents for a specific agenda
  const fetchAgendaDocuments = useCallback(async (agendaId: string, force = false) => {
    if (!agendaId) return [];
    
    if (!force && !isDocumentsExpired(agendaId)) {
      return cachedData.agendaDocuments[agendaId] || [];
    }

    try {
      console.log(`📁 Fetching documents for agenda: ${agendaId}`);
      const response = await fetch(`/api/agenda/documents?agendaId=${agendaId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const documents = await response.json();
      
      // Handle different response formats
      let docsArray = documents;
      if (documents && typeof documents === 'object' && 'data' in documents && Array.isArray(documents.data)) {
        docsArray = documents.data;
      } else if (documents && typeof documents === 'object' && 'rows' in documents && Array.isArray(documents.rows)) {
        docsArray = documents.rows;
      }

      // Update cache
      setCachedData(prev => ({
        ...prev,
        agendaDocuments: {
          ...prev.agendaDocuments,
          [agendaId]: Array.isArray(docsArray) ? docsArray : []
        },
        lastFetched: {
          ...prev.lastFetched,
          documents: {
            ...prev.lastFetched.documents,
            [agendaId]: Date.now()
          }
        }
      }));

      return Array.isArray(docsArray) ? docsArray : [];
    } catch (error) {
      console.error('Error fetching agenda documents:', error);
      return [];
    }
  }, [cachedData, isDocumentsExpired]);

  // Add a new agenda item
  const addAgenda = useCallback(async (meetingId: string, agendaData: any) => {
    try {
      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agendaData,
          meeting_id: parseInt(meetingId)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create agenda');
      }

      const newAgenda = await response.json();

      // Invalidate cache for this meeting
      setCachedData(prev => ({
        ...prev,
        lastFetched: {
          ...prev.lastFetched,
          agendas: {
            ...prev.lastFetched.agendas,
            [meetingId]: 0 // Expire cache
          }
        }
      }));

      // Refetch agendas for this meeting
      await fetchAgendas(meetingId, true);

      return newAgenda;
    } catch (error) {
      console.error('Error adding agenda:', error);
      throw error;
    }
  }, [fetchAgendas]);

  // Update an agenda item
  const updateAgenda = useCallback(async (agendaId: string, updates: any, meetingId: string) => {
    try {
      const response = await fetch(`/api/agenda/${agendaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update agenda');
      }

      // Invalidate cache for this meeting
      setCachedData(prev => ({
        ...prev,
        lastFetched: {
          ...prev.lastFetched,
          agendas: {
            ...prev.lastFetched.agendas,
            [meetingId]: 0 // Expire cache
          }
        }
      }));

      // Refetch agendas for this meeting
      await fetchAgendas(meetingId, true);
    } catch (error) {
      console.error('Error updating agenda:', error);
      throw error;
    }
  }, [fetchAgendas]);

  // Delete an agenda item
  const deleteAgenda = useCallback(async (agendaId: string, meetingId: string) => {
    try {
      const response = await fetch(`/api/agenda/${agendaId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete agenda');
      }

      // Invalidate cache for this meeting
      setCachedData(prev => ({
        ...prev,
        lastFetched: {
          ...prev.lastFetched,
          agendas: {
            ...prev.lastFetched.agendas,
            [meetingId]: 0 // Expire cache
          }
        }
      }));

      // Refetch agendas for this meeting
      await fetchAgendas(meetingId, true);
    } catch (error) {
      console.error('Error deleting agenda:', error);
      throw error;
    }
  }, [fetchAgendas]);

  // Upload document to agenda
  const uploadAgendaDocument = useCallback(async (agendaId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agendaId', agendaId);
      formData.append('name', file.name);

      const response = await fetch('/api/agenda/documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      const document = await response.json();

      // Invalidate documents cache for this agenda
      setCachedData(prev => ({
        ...prev,
        lastFetched: {
          ...prev.lastFetched,
          documents: {
            ...prev.lastFetched.documents,
            [agendaId]: 0 // Expire cache
          }
        }
      }));

      // Find the meeting ID for this agenda to refresh
      const meetingId = Object.entries(cachedData.agendas).find(
        ([_, agendas]) => agendas.some(a => a.id === agendaId)
      )?.[0];

      if (meetingId) {
        await fetchAgendas(meetingId, true);
      }

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }, [cachedData.agendas, fetchAgendas]);

  // Delete document from agenda
  const deleteAgendaDocument = useCallback(async (documentId: string, agendaId: string) => {
    try {
      const response = await fetch(`/api/agenda/documents?documentId=${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      // Invalidate documents cache for this agenda
      setCachedData(prev => ({
        ...prev,
        lastFetched: {
          ...prev.lastFetched,
          documents: {
            ...prev.lastFetched.documents,
            [agendaId]: 0 // Expire cache
          }
        }
      }));

      // Find the meeting ID for this agenda to refresh
      const meetingId = Object.entries(cachedData.agendas).find(
        ([_, agendas]) => agendas.some(a => a.id === agendaId)
      )?.[0];

      if (meetingId) {
        await fetchAgendas(meetingId, true);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }, [cachedData.agendas, fetchAgendas]);

  // Fetch supporting data on mount
  useEffect(() => {
    fetchSupportingData();
  }, [fetchSupportingData]);

  // Memoize calendar events
  const calendarEvents = useMemo(() => {
    if (!meetingsData.meetings || !Array.isArray(meetingsData.meetings)) return [];
    
    return meetingsData.meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.name,
      start: meeting.start_at,
      end: meeting.actual_end,
      extendedProps: {
        committee: meeting.type,
        type: meeting.type,
        location: meeting.location,
        chair_id: meeting.chair_id,
        status: meeting.status,
        description: meeting.description,
        colour: meeting.colour,
        period: meeting.period
      }
    }));
  }, [meetingsData.meetings]);

  const loading = meetingsData.loading || statsData.loading || supportingLoading;

  return {
    // Meetings data
    meetings: meetingsData.meetings || [],
    upcomingMeetings: meetingsData.upcomingMeetings || [],
    pastMeetings: meetingsData.pastMeetings || [],
    todayMeetings: meetingsData.todayMeetings || [],
    meetingsByStatus: meetingsData.meetingsByStatus || {},
    meetingsByType: meetingsData.meetingsByType || {},
    
    // Stats
    stats: statsData.stats || { 
      today: 0, 
      thisWeek: 0, 
      thisMonth: 0, 
      total: 0, 
      byType: {}, 
      byStatus: {} 
    },
    
    // Supporting data
    categories: cachedData.categories || { 
      locations: [], 
      meetingTypes: [], 
      meetingStatuses: [], 
      colours: [], 
      decisionStatus: [] 
    },
    users: cachedData.users || [],
    settings: cachedData.settings || { 
      timezone: 'Africa/Nairobi', 
      date_format: 'DD/MM/YYYY', 
      time_format: '24' 
    },
    
    // Agenda data (by meeting ID)
    agendas: cachedData.agendas || {},
    agendaDocuments: cachedData.agendaDocuments || {},
    agendaLoading: agendaLoading || {},
    
    // Document conversions cache
    getDocumentConversion,
    setDocumentConversion,
    
    // Formatted data
    calendarEvents: calendarEvents || [],
    
    // Loading states
    loading,
    meetingsLoading: meetingsData.loading || false,
    statsLoading: statsData.loading || false,
    supportingLoading: supportingLoading || false,
    
    // Actions
    refetchMeetings: meetingsData.refetch || (() => {}),
    refetchStats: statsData.refetch || (() => {}),
    refreshSupportingData: fetchSupportingData,
    
    // Agenda actions
    fetchAgendas: fetchAgendas || (async () => []),
    fetchAgendaDocuments: fetchAgendaDocuments || (async () => []),
    addAgenda: addAgenda || (async () => {}),
    updateAgenda: updateAgenda || (async () => {}),
    deleteAgenda: deleteAgenda || (async () => {}),
    uploadAgendaDocument: uploadAgendaDocument || (async () => {}),
    deleteAgendaDocument: deleteAgendaDocument || (async () => {}),
    
    refreshAll: () => {
      meetingsData.refetch?.();
      statsData.refetch?.();
      fetchSupportingData();
    },
    
    error: meetingsData.error || statsData.error || null
  };
}
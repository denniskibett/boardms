// src/hooks/useAgenda.ts
import { useMeetingsData } from './useMeetingsData';
import { useCallback, useMemo, useEffect } from 'react';

interface UseAgendaOptions {
  meetingId: string;
  autoFetch?: boolean;
}

export function useAgenda({ meetingId, autoFetch = true }: UseAgendaOptions) {
  const {
    agendas = {}, // Provide default empty object
    agendaDocuments = {}, // Provide default empty object
    agendaLoading = {}, // Provide default empty object
    fetchAgendas,
    fetchAgendaDocuments,
    addAgenda,
    updateAgenda,
    deleteAgenda,
    uploadAgendaDocument,
    deleteAgendaDocument,
    settings,
    users = [], // Provide default empty array
    categories = { decisionStatus: [] } // Provide default structure
  } = useMeetingsData();

  // Get agendas for this specific meeting - with safety checks
  const meetingAgendas = useMemo(() => {
    if (!agendas || !meetingId) return [];
    return agendas[meetingId] || [];
  }, [agendas, meetingId]);

  // Get loading state for this meeting
  const loading = useMemo(() => {
    if (!agendaLoading || !meetingId) return false;
    return agendaLoading[meetingId] || false;
  }, [agendaLoading, meetingId]);

  // Get all documents for this meeting's agendas
  const allDocuments = useMemo(() => {
    if (!meetingAgendas.length || !agendaDocuments) return [];
    
    return meetingAgendas.flatMap(agenda => {
      const docs = agendaDocuments[agenda.id] || [];
      return docs.map(doc => ({
        ...doc,
        agendaId: agenda.id,
        agendaName: agenda.name
      }));
    });
  }, [meetingAgendas, agendaDocuments]);

  // Get agenda by document ID
  const getAgendaByDocument = useCallback((documentId: string) => {
    if (!meetingAgendas.length || !agendaDocuments) return null;
    
    return meetingAgendas.find(agenda => 
      (agendaDocuments[agenda.id] || []).some(doc => doc.id === documentId)
    );
  }, [meetingAgendas, agendaDocuments]);

  // Get document by ID
  const getDocumentById = useCallback((documentId: string) => {
    if (!meetingAgendas.length || !agendaDocuments) return null;
    
    for (const agenda of meetingAgendas) {
      const docs = agendaDocuments[agenda.id] || [];
      const doc = docs.find(d => d.id === documentId);
      if (doc) return { ...doc, agendaId: agenda.id, agendaName: agenda.name };
    }
    return null;
  }, [meetingAgendas, agendaDocuments]);

  // Get sorted agendas by order
  const sortedAgendas = useMemo(() => {
    return [...meetingAgendas].sort((a, b) => a.sort_order - b.sort_order);
  }, [meetingAgendas]);

  // Get agenda status options from categories
  const agendaStatusOptions = useMemo(() => {
    return categories?.decisionStatus || [];
  }, [categories?.decisionStatus]);

  // Refresh agendas for this meeting
  const refreshAgendas = useCallback(async () => {
    if (!meetingId) return [];
    return fetchAgendas(meetingId, true);
  }, [meetingId, fetchAgendas]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && meetingId) {
      fetchAgendas(meetingId);
    }
  }, [autoFetch, meetingId, fetchAgendas]);

  return {
    // Data
    agendas: sortedAgendas,
    allDocuments,
    loading,
    
    // Specific getters
    getAgendaByDocument,
    getDocumentById,
    
    // Options
    agendaStatusOptions,
    users,
    settings,
    
    // Actions
    fetchAgendas: refreshAgendas,
    fetchAgendaDocuments,
    addAgenda: (data: any) => addAgenda(meetingId, data),
    updateAgenda: (agendaId: string, updates: any) => updateAgenda(agendaId, updates, meetingId),
    deleteAgenda: (agendaId: string) => deleteAgenda(agendaId, meetingId),
    uploadDocument: (agendaId: string, file: File) => uploadAgendaDocument(agendaId, file),
    deleteDocument: (documentId: string, agendaId: string) => deleteAgendaDocument(documentId, agendaId),
    
    // Reorder agendas
    reorderAgendas: async (reorderedAgendas: any[]) => {
      const promises = reorderedAgendas.map((agenda, index) => 
        updateAgenda(agenda.id, { sort_order: index + 1 }, meetingId)
      );
      await Promise.all(promises);
      await refreshAgendas();
    }
  };
}
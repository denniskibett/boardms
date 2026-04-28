// src/hooks/useOpenBook.ts
import { useState, useEffect, useMemo } from 'react';
import { useMeetingsData } from './useMeetingsData';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'csv';
  file?: File;
  content?: string;
  agenda_id?: number;
}

interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description: string;
  duration: number;
  isDocument?: boolean;
  documentIndex?: number;
  linkedDocumentId?: string;
  linkedDocumentName?: string;
  meeting_id?: number;
  documents?: any[];
  status?: string;
  ministry_name?: string;
  presenter_id?: number | string;
  ministry_id?: number | string;
  presenter?: string;
  cabinet_approval_required?: boolean;
}

interface Annotation {
  id: string;
  page: number;
  type: 'pen' | 'highlight' | 'text';
  content: string;
  position: { x: number; y: number };
  color: string;
  createdAt: Date;
}

export function useOpenBook(meetingId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Use the centralized meetings data hook
  const meetingsData = useMeetingsData();

  // ✅ Move the helper function definition to the top, before any useMemo that uses it
  const mapFileTypeToDocumentType = (fileType: string, fileName?: string): Document['type'] => {
    // First check by filename extension (most reliable)
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') return 'csv';
      if (extension === 'pptx') return 'pptx';
      if (extension === 'ppt') return 'ppt';
      if (extension === 'docx') return 'docx';
      if (extension === 'doc') return 'doc';
      if (extension === 'xlsx') return 'xlsx';
      if (extension === 'xls') return 'xls';
      if (extension === 'pdf') return 'pdf';
      if (extension === 'txt') return 'text';
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) return 'image';
    }

    // Fallback to MIME type mapping
    const typeMap: { [key: string]: Document['type'] } = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/csv': 'csv',
      'text/plain': 'text',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
    };

    return typeMap[fileType] || 'doc';
  };
  
  // Get agendas for this specific meeting from the cache
  const meetingAgendas = meetingId ? meetingsData.agendas[meetingId] || [] : [];
  
  // Convert from Agenda format to OpenBook's AgendaItem format
  const agendas: AgendaItem[] = useMemo(() => {
    return meetingAgendas.map(agenda => ({
      id: agenda.id.toString(),
      order: agenda.sort_order,
      title: agenda.name,
      description: agenda.description || '',
      duration: 30, // Default duration
      meeting_id: parseInt(agenda.meeting_id),
      status: agenda.status,
      ministry_name: agenda.ministry?.name,
      presenter: agenda.presenter?.name,
      presenter_id: agenda.presenter_id,
      ministry_id: agenda.ministry_id,
      cabinet_approval_required: agenda.cabinet_approval_required,
      documents: agenda.documents || []
    })).sort((a, b) => a.order - b.order);
  }, [meetingAgendas]);

  // Convert documents from all agendas to OpenBook's Document format
  const allDocuments: Document[] = useMemo(() => {
    const docs: Document[] = [];
    
    meetingAgendas.forEach(agenda => {
      if (agenda.documents) {
        agenda.documents.forEach(doc => {
          docs.push({
            id: doc.id.toString(),
            name: doc.name,
            url: doc.file_url,
            pages: 1,
            type: mapFileTypeToDocumentType(doc.file_type, doc.name), // Now this works because function is defined above
            agenda_id: parseInt(agenda.id)
          });
        });
      }
    });
    
    return docs;
  }, [meetingAgendas]);

  // Update local documents when meetings data changes
  useEffect(() => {
    setDocuments(allDocuments);
    setLocalLoading(meetingsData.loading);
  }, [allDocuments, meetingsData.loading]);

  const uploadDocument = async (file: File, agendaId?: number) => {
    if (!meetingId || !agendaId) {
      console.error('❌ Meeting ID and Agenda ID are required for upload');
      return null;
    }

    try {
      // Use the meetingsData hook to upload the document
      const document = await meetingsData.uploadAgendaDocument(agendaId.toString(), file);
      
      // Refresh agendas to get the updated document list
      await meetingsData.fetchAgendas(meetingId, true);
      
      return {
        id: document.id.toString(),
        name: document.name,
        url: document.file_url,
        pages: 1,
        type: mapFileTypeToDocumentType(document.file_type, document.name),
        agenda_id: agendaId
      };
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  };

  const addAgenda = async (agenda: Omit<AgendaItem, 'id'>) => {
    if (!meetingId) {
      console.error('❌ Meeting ID is required to add agenda');
      return null;
    }

    try {
      // Use the meetingsData hook to add the agenda
      const agendaData = {
        name: agenda.title,
        description: agenda.description || '',
        meeting_id: parseInt(meetingId),
        sort_order: agenda.order || agendas.length + 1,
        status: 'draft'
      };

      const newAgenda = await meetingsData.addAgenda(meetingId, agendaData);
      
      // Convert to OpenBook format
      return {
        id: newAgenda.id.toString(),
        order: newAgenda.sort_order,
        title: newAgenda.name,
        description: newAgenda.description || '',
        duration: 30,
        meeting_id: newAgenda.meeting_id,
        status: newAgenda.status,
        documents: []
      };
    } catch (error) {
      console.error('❌ Error adding agenda:', error);
      throw error;
    }
  };

  const updateAgenda = async (id: string, updates: Partial<AgendaItem>) => {
    if (!meetingId) {
      console.error('❌ Meeting ID is required to update agenda');
      return;
    }

    try {
      // Find the current agenda item to get all its data
      const currentAgenda = agendas.find(a => a.id === id);
      
      if (!currentAgenda) {
        console.error('❌ Agenda not found:', id);
        return;
      }

      // Convert OpenBook updates to the format expected by meetingsData
      // IMPORTANT: Include ALL fields from the current agenda
      const apiUpdates: any = {
        name: updates.title !== undefined ? updates.title : currentAgenda.title,
        description: updates.description !== undefined ? updates.description : currentAgenda.description,
        status: updates.status !== undefined ? updates.status : (currentAgenda.status || 'draft'),
        sort_order: updates.order !== undefined ? updates.order : currentAgenda.order,
        presenter_id: updates.presenter_id !== undefined ? updates.presenter_id : currentAgenda.presenter_id,
        ministry_id: updates.ministry_id !== undefined ? updates.ministry_id : currentAgenda.ministry_id,
        cabinet_approval_required: updates.cabinet_approval_required !== undefined 
          ? updates.cabinet_approval_required 
          : (currentAgenda.cabinet_approval_required || false)
      };

      console.log('📤 Sending full agenda data to API:', apiUpdates);

      // Use the meetingsData hook to update the agenda
      await meetingsData.updateAgenda(id, apiUpdates, meetingId);
      
    } catch (error) {
      console.error('❌ Error updating agenda:', error);
      throw error;
    }
  };

  const deleteAgenda = async (id: string) => {
    if (!meetingId) {
      console.error('❌ Meeting ID is required to delete agenda');
      return;
    }

    try {
      // Use the meetingsData hook to delete the agenda
      await meetingsData.deleteAgenda(id, meetingId);
    } catch (error) {
      console.error('❌ Error deleting agenda:', error);
      throw error;
    }
  };

  const handleReorderAgendas = async (reorderedAgendas: AgendaItem[]) => {
    if (!meetingId) return;

    console.log('🔄 Reordering agendas:', reorderedAgendas);
    
    try {
      // Update each agenda's sort_order based on new positions
      // IMPORTANT: Send ALL fields for each agenda, not just sort_order
      const updatePromises = reorderedAgendas.map((agenda, index) => {
        const newOrder = index + 1;
        
        // Find the original agenda in the current data
        const originalAgenda = agendas.find(a => a.id === agenda.id);
        
        if (!originalAgenda) {
          console.error('❌ Original agenda not found:', agenda.id);
          return Promise.resolve();
        }
        
        // Only update if the order actually changed
        if (originalAgenda.order !== newOrder) {
          console.log(`📤 Updating agenda ${agenda.id} from position ${originalAgenda.order} to ${newOrder}`);
          
          // Prepare update data with ALL fields from the original agenda
          const updateData = {
            name: originalAgenda.title,
            description: originalAgenda.description || '',
            status: originalAgenda.status || 'draft',
            sort_order: newOrder, // This is the only thing that changes
            presenter_id: originalAgenda.presenter_id || null,
            ministry_id: originalAgenda.ministry_id || null,
            cabinet_approval_required: originalAgenda.cabinet_approval_required || false
          };

          // Use the meetingsData hook to update each agenda with ALL fields
          return meetingsData.updateAgenda(agenda.id, updateData, meetingId);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      
      console.log('✅ All agenda items reordered successfully');

      // Refresh agendas in the background to ensure consistency
      setTimeout(() => {
        meetingsData.fetchAgendas(meetingId, true).catch(console.error);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error reordering agendas:', error);
      throw error;
    }
  };

  const addAnnotation = (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  const getDocumentByIndex = (index: number): Document | undefined => {
    return documents[index];
  };

  const getDocumentAgendas = (): AgendaItem[] => {
    return agendas.filter(agenda => agenda.isDocument);
  };

  return {
    documents,
    agendas,
    annotations,
    loading: meetingsData.loading || localLoading,
    uploadDocument,
    addAgenda,
    updateAgenda,
    deleteAgenda,
    addAnnotation,
    deleteAnnotation,
    getDocumentByIndex,
    getDocumentAgendas,
    handleReorderAgendas,
    refreshAgendas: () => meetingId && meetingsData.fetchAgendas(meetingId, true),
    isSyncingOrders: false,
    pendingOrderUpdates: []
  };
}
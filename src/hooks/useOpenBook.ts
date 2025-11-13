import { useState, useEffect } from 'react';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx';
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
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch meeting data including agendas and documents
  useEffect(() => {
    const fetchMeetingData = async () => {
      if (!meetingId) {
        console.log('❌ No meetingId provided, using local state only');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('📡 Fetching meeting data for meetingId:', meetingId);
        
        // Fetch agendas for this meeting
        const agendasResponse = await fetch(`/api/agenda?meetingId=${meetingId}`);
        if (!agendasResponse.ok) {
          throw new Error(`Failed to fetch agendas: ${agendasResponse.status}`);
        }
        
        const agendaData = await agendasResponse.json();
        console.log('📋 Fetched agendas from API:', agendaData);

        // Process existing agendas and their documents
        const allAgendas: AgendaItem[] = [];
        const allDocuments: Document[] = [];

        for (const agenda of agendaData) {
          console.log(`🔍 Processing agenda: ${agenda.name} (ID: ${agenda.id})`);
          
          // Fetch documents for this agenda
          let agendaDocuments = [];
          try {
            const docsResponse = await fetch(`/api/agenda/documents?agendaId=${agenda.id}`);
            if (docsResponse.ok) {
              agendaDocuments = await docsResponse.json();
              console.log(`📁 Found ${agendaDocuments.length} documents for agenda ${agenda.id}`);
              
              // Convert agenda documents to our Document format
              const convertedDocs: Document[] = agendaDocuments.map((doc: any) => ({
                id: doc.id.toString(),
                name: doc.name,
                url: doc.file_url,
                pages: 1,
                type: mapFileTypeToDocumentType(doc.file_type),
                agenda_id: agenda.id
              }));
              
              allDocuments.push(...convertedDocs);
            }
          } catch (docError) {
            console.error(`❌ Error fetching documents for agenda ${agenda.id}:`, docError);
          }

          // Add the main agenda item with all its properties
          allAgendas.push({
            id: agenda.id.toString(),
            order: agenda.sort_order,
            title: agenda.name,
            description: agenda.description || '',
            duration: 30, // Default duration
            meeting_id: agenda.meeting_id,
            status: agenda.status,
            ministry_name: agenda.ministry_name,
            documents: agendaDocuments
          });
        }

        // Sort agendas by order
        allAgendas.sort((a, b) => a.order - b.order);
        
        console.log('✅ Final processed agendas:', allAgendas);
        console.log('✅ All documents:', allDocuments);

        setAgendas(allAgendas);
        setDocuments(allDocuments);

      } catch (error) {
        console.error('❌ Error fetching meeting data:', error);
        // Fallback to empty data
        setAgendas([]);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingData();
  }, [meetingId]);

  // Helper function to map file types
  const mapFileTypeToDocumentType = (fileType: string): Document['type'] => {
    const typeMap: { [key: string]: Document['type'] } = {
      'pdf': 'pdf',
      'word': 'docx',
      'powerpoint': 'ppt',
      'excel': 'xls',
      'text': 'text',
      'image': 'image'
    };
    return typeMap[fileType] || 'doc';
  };

  const uploadDocument = async (file: File, agendaId?: number) => {
    let type: Document['type'] = 'doc';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('image')) type = 'image';
    else if (file.type.includes('text') || file.name.endsWith('.txt')) type = 'text';
    else if (file.name.endsWith('.docx')) type = 'docx';
    else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) type = 'ppt';
    else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) type = 'xls';

    let content = '';
    if (type === 'text') {
      content = await file.text();
    }

    // If agendaId is provided, upload to specific agenda
    if (agendaId && meetingId) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agendaId', agendaId.toString());
        formData.append('name', file.name);

        const response = await fetch('/api/agenda/documents', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload document to agenda');
        }

        const uploadedDoc = await response.json();
        
        // Add to local state
        const newDocument: Document = {
          id: uploadedDoc.id.toString(),
          name: uploadedDoc.name,
          url: uploadedDoc.file_url,
          pages: type === 'pdf' ? 10 : 1,
          type: type,
          file: file,
          content: content,
          agenda_id: agendaId
        };

        setDocuments(prev => [newDocument, ...prev]);

        // Refresh agendas to include the new document
        const agendasResponse = await fetch(`/api/agenda?meetingId=${meetingId}`);
        if (agendasResponse.ok) {
          const agendaData = await agendasResponse.json();
          const processedAgendas = agendaData.map((agenda: any) => ({
            id: agenda.id.toString(),
            order: agenda.sort_order,
            title: agenda.name,
            description: agenda.description || '',
            duration: 30,
            meeting_id: agenda.meeting_id,
            status: agenda.status,
            ministry_name: agenda.ministry_name
          })).sort((a: AgendaItem, b: AgendaItem) => a.order - b.order);
          
          setAgendas(processedAgendas);
        }

        return;
      } catch (error) {
        console.error('Error uploading document to agenda:', error);
        // Fall through to local upload
      }
    }

    // Local upload (fallback)
    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      pages: type === 'pdf' ? 10 : 1,
      type: type,
      file: file,
      content: content,
      agenda_id: agendaId
    };

    setDocuments(prev => [newDocument, ...prev]);
  };

  const addAgenda = async (agenda: Omit<AgendaItem, 'id'>) => {
    console.log('📝 Adding agenda with meetingId:', meetingId);
    
    if (!meetingId) {
      console.log('⚠️ No meetingId, creating local agenda only');
      // Local only
      const newAgenda: AgendaItem = {
        ...agenda,
        id: Date.now().toString()
      };
      setAgendas(prev => [...prev, newAgenda]);
      return;
    }

    try {
      // Create agenda via API
      const agendaData = {
        name: agenda.title,
        description: agenda.description,
        meeting_id: parseInt(meetingId),
        sort_order: agenda.order,
        status: 'draft'
      };

      console.log('📤 Sending agenda data to API:', agendaData);

      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agendaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error response:', errorData);
        throw new Error(`Failed to create agenda: ${response.status}`);
      }

      const newAgenda = await response.json();
      console.log('✅ Agenda created via API:', newAgenda);
      
      // Refresh agendas list
      const agendasResponse = await fetch(`/api/agenda?meetingId=${meetingId}`);
      if (agendasResponse.ok) {
        const agendaData = await agendasResponse.json();
        const processedAgendas = agendaData.map((agenda: any) => ({
          id: agenda.id.toString(),
          order: agenda.sort_order,
          title: agenda.name,
          description: agenda.description || '',
          duration: 30,
          meeting_id: agenda.meeting_id,
          status: agenda.status,
          ministry_name: agenda.ministry_name
        })).sort((a: AgendaItem, b: AgendaItem) => a.order - b.order);
        
        setAgendas(processedAgendas);
      }

    } catch (error) {
      console.error('❌ Error creating agenda via API:', error);
      // Fallback to local
      const newAgenda: AgendaItem = {
        ...agenda,
        id: Date.now().toString(),
        meeting_id: parseInt(meetingId)
      };
      setAgendas(prev => [...prev, newAgenda]);
    }
  };

  const updateAgenda = async (id: string, updates: Partial<AgendaItem>) => {
    console.log('✏️ Updating agenda:', id, updates);
    
    // Update locally first for immediate UI response
    setAgendas(prev => prev.map(agenda => 
      agenda.id === id ? { ...agenda, ...updates } : agenda
    ));

    // Sync with API
    if (meetingId) {
      try {
        const updateData: any = {
          id: parseInt(id)
        };

        if (updates.title) updateData.name = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.order !== undefined) updateData.sort_order = updates.order;

        const response = await fetch('/api/agenda', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to update agenda via API, keeping local changes');
        } else {
          console.log('✅ Agenda updated via API');
        }
      } catch (error) {
        console.error('Error updating agenda via API:', error);
      }
    }
  };

  const deleteAgenda = async (id: string) => {
    console.log('🗑️ Deleting agenda:', id);
    
    // Remove from local state immediately
    const agendaToDelete = agendas.find(agenda => agenda.id === id);
    setAgendas(prev => prev.filter(agenda => agenda.id !== id));

    // Delete from API
    if (meetingId && !id.startsWith('doc-')) {
      try {
        const response = await fetch(`/api/agenda?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to delete agenda via API, removed locally only');
          // Re-add if API deletion failed
          if (agendaToDelete) {
            setAgendas(prev => [...prev, agendaToDelete]);
          }
        } else {
          console.log('✅ Agenda deleted via API');
        }
      } catch (error) {
        console.error('Error deleting agenda via API:', error);
        // Re-add if API deletion failed
        if (agendaToDelete) {
          setAgendas(prev => [...prev, agendaToDelete]);
        }
      }
    }
  };

  // ... rest of the functions remain the same
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

  const handleReorderAgendas = (reorderedAgendas: AgendaItem[]) => {
    console.log('🔄 Reordering agendas:', reorderedAgendas);
    
    // Update local state immediately
    setAgendas(reorderedAgendas);
    
    // Sync order changes with API
    reorderedAgendas.forEach((agenda, index) => {
      updateAgenda(agenda.id, { order: index + 1 });
    });
  };

  return {
    documents,
    agendas,
    annotations,
    loading,
    uploadDocument,
    addAgenda,
    updateAgenda,
    deleteAgenda,
    addAnnotation,
    deleteAnnotation,
    getDocumentByIndex,
    getDocumentAgendas,
    handleReorderAgendas
  };
}
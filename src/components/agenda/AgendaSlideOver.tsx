"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Bug, Upload, File, Trash2, Eye } from 'lucide-react';

interface AgendaSlideOverProps {
  agenda: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agenda: any) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Ministry {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

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
}

const AgendaSlideOver: React.FC<AgendaSlideOverProps> = ({ agenda, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft',
    sort_order: 1,
    presenter_id: '',
    ministry_id: '',
    cabinet_approval_required: false
  });
  const [users, setUsers] = useState<User[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [statusOptions, setStatusOptions] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<AgendaDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch users, ministries, status options, and documents
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setDebugInfo(prev => ({ ...prev, loading: true }));
      
      try {
        console.log('🔍 DEBUG: Starting data fetch for AgendaSlideOver');
        
        const [usersResponse, ministriesResponse, categoriesResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/ministries'),
          fetch('/api/categories?type=decision_status')
        ]);

        console.log('🔍 DEBUG: API Responses:', {
          users: { status: usersResponse.status, ok: usersResponse.ok },
          ministries: { status: ministriesResponse.status, ok: ministriesResponse.ok },
          categories: { status: categoriesResponse.status, ok: categoriesResponse.ok }
        });

        if (!usersResponse.ok) throw new Error(`Users API failed: ${usersResponse.status}`);
        if (!ministriesResponse.ok) throw new Error(`Ministries API failed: ${ministriesResponse.status}`);
        if (!categoriesResponse.ok) throw new Error(`Categories API failed: ${categoriesResponse.status}`);

        const [usersData, ministriesData, categoriesData] = await Promise.all([
          usersResponse.json(),
          ministriesResponse.json(),
          categoriesResponse.json()
        ]);

        // Fetch documents if editing existing agenda
        if (agenda?.id) {
          console.log('🔍 DEBUG: Fetching documents for agenda:', agenda.id);
          const documentsResponse = await fetch(`/api/agenda/documents?agendaId=${agenda.id}`);
          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json();
            setDocuments(documentsData);
            console.log('🔍 DEBUG: Fetched documents:', documentsData);
          } else {
            console.error('❌ DEBUG: Failed to fetch documents:', documentsResponse.status);
          }
        }

        console.log('🔍 DEBUG: Fetched data:', {
          usersCount: usersData.length,
          ministriesCount: ministriesData.length,
          categoriesCount: categoriesData.length,
          documentsCount: documents.length,
          categories: categoriesData
        });

        setUsers(usersData);
        setMinistries(ministriesData);
        setStatusOptions(categoriesData);

        setDebugInfo(prev => ({
          ...prev,
          dataLoaded: true,
          usersCount: usersData.length,
          ministriesCount: ministriesData.length,
          categoriesCount: categoriesData.length,
          documentsCount: documents.length,
          categories: categoriesData,
          loading: false
        }));

      } catch (error) {
        console.error('❌ ERROR: Failed to fetch data:', error);
        setError('Failed to load form data. Please try again.');
        setDebugInfo(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
          loading: false
        }));
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, agenda?.id]);

  // Update form when agenda changes
  useEffect(() => {
    console.log('🔍 DEBUG: Agenda prop changed:', { 
      agenda, 
      hasId: agenda?.id,
      meetingId: agenda?.meeting_id 
    });

    if (agenda) {
      // Handle description - convert from JSON if needed
      let description = agenda.description || '';
      
      if (typeof description === 'string' && description.startsWith('{')) {
        try {
          const parsedDescription = JSON.parse(description);
          description = parsedDescription.text || parsedDescription || '';
          console.log('🔍 DEBUG: Parsed description from JSON');
        } catch {
          console.warn('🔍 DEBUG: Failed to parse description JSON, using as plain text');
        }
      }

      const newFormData = {
        name: agenda.name || '',
        description: description,
        status: agenda.status || 'draft',
        sort_order: agenda.sort_order || 1,
        presenter_id: agenda.presenter_id || '',
        ministry_id: agenda.ministry_id || '',
        cabinet_approval_required: agenda.cabinet_approval_required || false
      };

      console.log('🔍 DEBUG: Setting form data for existing agenda:', newFormData);
      setFormData(newFormData);

      setDebugInfo(prev => ({
        ...prev,
        editingAgenda: true,
        agendaId: agenda.id,
        originalData: agenda,
        formData: newFormData
      }));

    } else {
      // For new agenda, get next sort order
      const getNextSortOrder = async () => {
        if (agenda?.meeting_id) {
          try {
            console.log('🔍 DEBUG: Fetching next sort order for meeting:', agenda.meeting_id);
            const response = await fetch(`/api/agenda?meetingId=${agenda.meeting_id}`);
            
            console.log('🔍 DEBUG: Sort order response:', { 
              status: response.status, 
              ok: response.ok 
            });

            if (response.ok) {
              const agendaItems = await response.json();
              const maxSortOrder = agendaItems.length > 0 
                ? Math.max(...agendaItems.map((item: any) => item.sort_order || 0))
                : 0;
              const nextSortOrder = maxSortOrder + 1;
              
              console.log('🔍 DEBUG: Calculated sort order:', {
                agendaItemsCount: agendaItems.length,
                maxSortOrder,
                nextSortOrder
              });

              setFormData(prev => ({ ...prev, sort_order: nextSortOrder }));
            }
          } catch (error) {
            console.error('❌ ERROR: Failed to get next sort order:', error);
          }
        }
      };
      
      const initialFormData = {
        name: '',
        description: '',
        status: 'draft',
        sort_order: 1,
        presenter_id: '',
        ministry_id: '',
        cabinet_approval_required: false
      };

      console.log('🔍 DEBUG: Setting initial form data for new agenda:', initialFormData);
      setFormData(initialFormData);
      
      getNextSortOrder();

      setDebugInfo(prev => ({
        ...prev,
        editingAgenda: false,
        agendaId: null,
        formData: initialFormData
      }));
    }
  }, [agenda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo(prev => ({ ...prev, lastOperation: 'submit', submitError: null }));
    
    if (!formData.name.trim()) {
      const errorMsg = 'Agenda item name is required';
      setError(errorMsg);
      setDebugInfo(prev => ({ ...prev, validationError: errorMsg }));
      return;
    }

    if (!agenda?.meeting_id) {
      const errorMsg = 'Meeting ID is missing';
      setError(errorMsg);
      setDebugInfo(prev => ({ ...prev, validationError: errorMsg }));
      return;
    }

    setIsSaving(true);

    try {
      const url = agenda?.id ? `/api/agenda/${agenda.id}` : '/api/agenda';
      const method = agenda?.id ? 'PUT' : 'POST';

      // Get presenter name from selected user for both fields
      const selectedUser = users.find(user => user.id === formData.presenter_id);
      const presenter_id = formData.presenter_id || null;

      // Prepare data with both presenter_id and presenter_name for compatibility
      const submitData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        status: formData.status,
        sort_order: parseInt(formData.sort_order.toString()),
        cabinet_approval_required: Boolean(formData.cabinet_approval_required),
        meeting_id: agenda.meeting_id,
        // Send both fields for maximum compatibility
        presenter_id: presenter_id,
        ministry_id: formData.ministry_id || null,
        // Required fields for backend schema
        memo_id: null,
        created_by: null
      };

      console.log('🔄 DEBUG: Saving agenda data:', { 
        method, 
        url, 
        agendaId: agenda?.id,
        meetingId: agenda?.meeting_id,
        submitData
      });

      setDebugInfo(prev => ({
        ...prev,
        apiCall: {
          method,
          url,
          requestData: submitData,
          timestamp: new Date().toISOString()
        }
      }));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('📨 DEBUG: API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      const responseText = await response.text();
      console.log('📨 DEBUG: Raw response text:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : { error: 'Empty response body' };
        } catch {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            rawResponse: responseText.substring(0, 200) // Limit length for display
          };
        }
        
        console.error('❌ DEBUG: API Error response:', errorData);
        
        setDebugInfo(prev => ({
          ...prev,
          apiCall: {
            ...prev.apiCall,
            responseStatus: response.status,
            responseError: errorData,
            responseText: responseText.substring(0, 500) // Limit length
          }
        }));

        // Enhanced error message with more context
        let errorMessage = `Failed to ${agenda?.id ? 'update' : 'create'} agenda item`;
        
        if (errorData.error && errorData.error !== 'Empty response body') {
          errorMessage += `: ${errorData.error}`;
        }
        
        if (errorData.details) {
          errorMessage += ` (${errorData.details})`;
        }
        
        if (response.status === 500) {
          errorMessage += ' - Server error occurred';
        }
        
        errorMessage += ` [HTTP ${response.status}]`;
        
        throw new Error(errorMessage);
      }

      let savedAgenda;
      try {
        savedAgenda = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ DEBUG: Failed to parse response JSON:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('✅ DEBUG: Agenda saved successfully:', savedAgenda);

      setDebugInfo(prev => ({
        ...prev,
        apiCall: {
          ...prev.apiCall,
          responseStatus: response.status,
          responseData: savedAgenda,
          success: true
        }
      }));

      onSave(savedAgenda);
      onClose();

    } catch (err) {
      console.error('❌ ERROR: Failed to save agenda:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to save agenda item. Please try again.';
      setError(errorMsg);
      setDebugInfo(prev => ({ 
        ...prev, 
        submitError: errorMsg,
        lastError: err 
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async () => {
    setError(null);
    setDebugInfo(prev => ({ ...prev, lastOperation: 'quickAdd', submitError: null }));
    
    if (!formData.name.trim()) {
      const errorMsg = 'Agenda item name is required';
      setError(errorMsg);
      setDebugInfo(prev => ({ ...prev, validationError: errorMsg }));
      return;
    }

    if (!agenda?.meeting_id) {
      const errorMsg = 'Meeting ID is missing';
      setError(errorMsg);
      setDebugInfo(prev => ({ ...prev, validationError: errorMsg }));
      return;
    }

    setIsSaving(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        status: 'draft',
        sort_order: parseInt(formData.sort_order.toString()),
        cabinet_approval_required: false,
        meeting_id: agenda.meeting_id,
        presenter_id: null, 
        ministry_id: null,
        memo_id: null,
        created_by: null
      };

      console.log('🔄 DEBUG: Quick adding agenda:', { 
        meetingId: agenda.meeting_id,
        submitData 
      });

      setDebugInfo(prev => ({
        ...prev,
        apiCall: {
          method: 'POST',
          url: '/api/agenda',
          requestData: submitData,
          timestamp: new Date().toISOString()
        }
      }));

      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('📨 DEBUG: Quick add API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : { error: 'Empty response' };
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}`, rawResponse: responseText };
        }
        
        console.error('❌ DEBUG: Quick add API Error:', errorData);
        
        setDebugInfo(prev => ({
          ...prev,
          apiCall: {
            ...prev.apiCall,
            responseStatus: response.status,
            responseError: errorData,
            responseText
          }
        }));

        const errorMessage = errorData.error || errorData.details || `Failed to create agenda item (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      let savedAgenda;
      try {
        savedAgenda = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ DEBUG: Failed to parse quick add response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('✅ DEBUG: Agenda quick added successfully:', savedAgenda);

      setDebugInfo(prev => ({
        ...prev,
        apiCall: {
          ...prev.apiCall,
          responseStatus: response.status,
          responseData: savedAgenda,
          success: true
        }
      }));

      onSave(savedAgenda);
      onClose();

    } catch (err) {
      console.error('❌ ERROR: Failed to quick add agenda:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to add agenda item. Please try again.';
      setError(errorMsg);
      setDebugInfo(prev => ({ 
        ...prev, 
        submitError: errorMsg,
        lastError: err 
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // Document Management Functions
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!agenda?.id || !event.target.files?.length) return;

  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agendaId', agenda.id);
  formData.append('name', file.name);

  try {
    setIsUploading(true);
    console.log('🔄 Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      agendaId: agenda.id
    });
    
    const response = await fetch('/api/agenda/documents', {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    console.log('📨 Upload response:', {
      status: response.status,
      statusText: response.statusText,
      responseText
    });

    if (response.ok) {
      const newDoc = JSON.parse(responseText);
      console.log('✅ File uploaded successfully:', newDoc);
      
      setDocuments(prev => [...prev, newDoc]);
      event.target.value = '';
      
      alert('File uploaded successfully!');
    } else {
      let errorData;
      try {
        errorData = responseText ? JSON.parse(responseText) : { error: 'Empty response' };
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ Upload failed:', errorData);
      alert(`Upload failed: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`);
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    alert('Failed to upload file. Please try again.');
  } finally {
    setIsUploading(false);
  }
};

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      console.log('🔄 Deleting document:', documentId);
      const response = await fetch(`/api/agenda/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Document deleted');
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        alert('Document deleted successfully!');
      } else {
        const error = await response.json();
        console.error('❌ Delete failed:', error);
        alert(`Delete failed: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const handleViewDocument = (document: AgendaDocument) => {
    window.open(document.file_url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? parseInt(value) || 1 : 
                    value;

    console.log('🔍 DEBUG: Form field changed:', { name, value: newValue, type });

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    setDebugInfo(prev => ({
      ...prev,
      formChanges: [...(prev.formChanges || []), { field: name, value: newValue, timestamp: new Date().toISOString() }]
    }));
  };

  const copyDebugInfo = () => {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    alert('Debug info copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-2xl">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {agenda?.id ? 'Edit Agenda Item' : 'Add Agenda Item'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-700 dark:hover:bg-gray-600"
                    title="Toggle debug info"
                  >
                    <Bug className="h-3 w-3" />
                    Debug
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Debug Info */}
                  {showDebug && debugInfo && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Debug Information
                        </h4>
                        <button
                          onClick={copyDebugInfo}
                          className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded dark:bg-yellow-800 dark:hover:bg-yellow-700"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs text-yellow-700 dark:text-yellow-400 overflow-auto max-h-40">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                      <p className="text-gray-600 dark:text-gray-400">Loading form data...</p>
                    </div>
                  )}

                  {!isLoading && (
                    <>
                      {/* Basic Information Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Basic Info */}
                        <div className="space-y-6">
                          {/* Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Agenda Item Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              required
                              placeholder="Enter agenda item name"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Description
                            </label>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter agenda item description"
                            />
                          </div>

                          {/* Presenter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Presenter
                            </label>
                            <select
                              name="presenter_id"
                              value={formData.presenter_id}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select Presenter</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Right Column - Additional Info */}
                        <div className="space-y-6">
                          {/* Ministry */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Sponsor Ministry
                            </label>
                            <select
                              name="ministry_id"
                              value={formData.ministry_id}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select Ministry</option>
                              {ministries.map(ministry => (
                                <option key={ministry.id} value={ministry.id}>
                                  {ministry.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Sort Order */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Sort Order
                            </label>
                            <input
                              type="number"
                              name="sort_order"
                              value={formData.sort_order}
                              onChange={handleChange}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          {/* Status */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Status
                            </label>
                            <select
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="draft">Draft</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              {statusOptions.map(category => (
                                <option key={category.id} value={category.name.toLowerCase()}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cabinet Approval */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="cabinet_approval"
                              name="cabinet_approval_required"
                              checked={formData.cabinet_approval_required}
                              onChange={handleChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="cabinet_approval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              Requires Cabinet Approval
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Documents Section - Only show for existing agenda items */}
                      {agenda?.id && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Documents ({documents.length})
                          </h3>
                          
                          {/* File Upload */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Upload Document
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                              >
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload Document'}
                              </button>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Max file size: 10MB
                              </span>
                            </div>
                          </div>

                          {/* Documents List */}
                          {documents.length > 0 ? (
                            <div className="space-y-3">
                              {documents.map((document) => (
                                <div
                                  key={document.id}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700"
                                >
                                  <div className="flex items-center gap-3">
                                    <File className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {document.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(document.file_size)} • {document.file_type}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleViewDocument(document)}
                                      className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="View document"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDocument(document.id)}
                                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      title="Delete document"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
                              <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Upload supporting documents for this agenda item
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Add Info */}
                      {!agenda?.id && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Quick Add Tips
                          </h4>
                          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• Only the agenda name is required for quick creation</li>
                            <li>• You can add more details later by editing the agenda item</li>
                            <li>• Status will be set to "Draft" by default</li>
                            <li>• Sort order will be automatically calculated</li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 py-5 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex justify-between items-center">
                  {/* Quick Add Button for new items */}
                  {!agenda?.id && (
                    <button
                      onClick={handleQuickAdd}
                      disabled={isSaving || !formData.name.trim()}
                      className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md shadow-sm hover:bg-green-200 disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed dark:bg-green-900 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-800"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {isSaving ? 'Adding...' : 'Quick Add'}
                    </button>
                  )}
                  
                  <div className="flex justify-end space-x-3 flex-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSaving || !formData.name.trim()}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSaving ? 'Saving...' : agenda?.id ? 'Update' : 'Save & Configure'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaSlideOver;
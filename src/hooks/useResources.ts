// hooks/useResources.ts
import { useState, useEffect } from 'react';

interface Resource {
  id: number;
  name: string;
  display_name: string;
  resource_type_id: number;
  year: number;
  description?: string;
  metadata?: any;
  created_by: number;
  created_at: string;
  updated_at: string;
  resource_type_name?: string;
  created_by_name?: string;
  file_count?: number;
}

interface ResourceCategory {
  id: number;
  name: string;
  type: string;
  metadata?: any;
}

interface ResourceFile {
  id: number;
  resource_id: number;
  name: string;
  display_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  ministry_id?: number;
  uploaded_by: number;
  uploaded_at: string;
  metadata?: any;
  ministry_name?: string;
  uploaded_by_name?: string;
}

interface CreateResourceData {
  name: string;
  display_name: string;
  resource_type_id: number;
  year: number;
  description?: string;
  metadata?: any;
}

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ONLY resource_type categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=resource_type');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching resource categories:', err);
    }
  };

  // Fetch all resources
  const fetchResources = async (filters?: { year?: number; type?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.type) params.append('type', filters.type);

      const response = await fetch(`/api/resources?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      
      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  // Create new resource
  const createResource = async (resourceData: CreateResourceData): Promise<Resource | null> => {
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create resource');
      }

      const newResource = await response.json();
      setResources(prev => [newResource, ...prev]);
      return newResource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
      return null;
    }
  };

  // Update resource
  const updateResource = async (id: number, resourceData: Partial<CreateResourceData>): Promise<Resource | null> => {
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update resource');
      }

      const updatedResource = await response.json();
      setResources(prev => prev.map(res => res.id === id ? updatedResource : res));
      return updatedResource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
      return null;
    }
  };

  // Delete resource
  const deleteResource = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete resource');
      }

      setResources(prev => prev.filter(res => res.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
      return false;
    }
  };

  // Fetch files for a resource
  const fetchResourceFiles = async (resourceId: number): Promise<ResourceFile[]> => {
    try {
      const response = await fetch(`/api/resources/${resourceId}/files`);
      if (!response.ok) throw new Error('Failed to fetch resource files');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resource files');
      return [];
    }
  };

  // Upload file to resource
  const uploadFile = async (
    resourceId: number, 
    file: File, 
    ministryId?: number, 
    displayName?: string
  ): Promise<ResourceFile | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceId', resourceId.toString());
      if (ministryId) formData.append('ministryId', ministryId.toString());
      if (displayName) formData.append('displayName', displayName);

      const response = await fetch(`/api/resources/${resourceId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      return null;
    }
  };

  // Delete file from resource
  const deleteFile = async (fileId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/resources/files?fileId=${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchResources();
  }, []);

  return {
    resources,
    categories,
    loading,
    error,
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    fetchResourceFiles,
    uploadFile,
    deleteFile,
    refetch: () => fetchResources(),
  };
}
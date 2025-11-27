// src/hooks/useResources.ts - UPDATED
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  fetchResources,
  fetchCategories,
  createResource,
  updateResource,
  deleteResource,
  fetchResourceFiles,
  uploadFile,
  deleteFile,
  clearError,
} from '@/lib/store/slices/resourcesSlice';

export function useResources() {
  const dispatch = useAppDispatch();
  const { resources, categories, files, loading, error, lastFetched } = useAppSelector(
    (state) => state.resources
  );

  // Memoized functions for better performance
  const memoizedFetchResources = useCallback(
    (filters?: { year?: number; type?: string }) => {
      return dispatch(fetchResources(filters));
    },
    [dispatch]
  );

  const memoizedFetchCategories = useCallback(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const memoizedCreateResource = useCallback(
    (resourceData: any) => dispatch(createResource(resourceData)),
    [dispatch]
  );

  const memoizedUpdateResource = useCallback(
    (id: number, updates: any) => dispatch(updateResource({ id, updates })),
    [dispatch]
  );

  const memoizedDeleteResource = useCallback(
    (id: number) => dispatch(deleteResource(id)),
    [dispatch]
  );

  const memoizedFetchResourceFiles = useCallback(
    (resourceId: number) => {
      return dispatch(fetchResourceFiles(resourceId));
    },
    [dispatch]
  );

  const memoizedUploadFile = useCallback(
    async (resourceId: number, file: File, ministryId?: number, displayName?: string) => {
      try {
        const result = await dispatch(uploadFile({ 
          resourceId, 
          file, 
          ministryId, 
          displayName: displayName || file.name 
        })).unwrap();
        
        return result;
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },
    [dispatch]
  );

  const memoizedDeleteFile = useCallback(
    (fileId: number) => dispatch(deleteFile(fileId)),
    [dispatch]
  );

  const memoizedClearError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    // State
    resources,
    categories,
    files: files,
    loading,
    error,
    
    // Actions
    fetchResources: memoizedFetchResources,
    fetchCategories: memoizedFetchCategories,
    createResource: memoizedCreateResource,
    updateResource: memoizedUpdateResource,
    deleteResource: memoizedDeleteResource,
    fetchResourceFiles: memoizedFetchResourceFiles,
    uploadFile: memoizedUploadFile,
    deleteFile: memoizedDeleteFile,
    clearError: memoizedClearError,
    
    // Helper
    refetch: () => memoizedFetchResources(),
  };
}
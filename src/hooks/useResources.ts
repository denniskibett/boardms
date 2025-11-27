// src/hooks/useResources.ts
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
      // Cache optimization: Only fetch if data is older than 30 seconds
      const shouldRefetch = !lastFetched || Date.now() - lastFetched > 30000;
      
      if (shouldRefetch || filters) {
        return dispatch(fetchResources(filters));
      }
    },
    [dispatch, lastFetched]
  );

  const memoizedFetchCategories = useCallback(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

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
      // Only fetch if we don't have files cached for this resource
      if (!files[resourceId]) {
        return dispatch(fetchResourceFiles(resourceId));
      }
    },
    [dispatch, files]
  );

  const memoizedUploadFile = useCallback(
    (resourceId: number, file: File, ministryId?: number, displayName?: string) =>
      dispatch(uploadFile({ resourceId, file, ministryId, displayName: displayName || file.name })),
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
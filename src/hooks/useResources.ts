// src/hooks/useResources.ts — resources state (Redux) backed by the guarded /api/resources routes.
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
  type ResourceInput,
} from '@/lib/store/slices/resourcesSlice';

export function useResources() {
  const dispatch = useAppDispatch();
  const { resources, categories, files, loading, error } = useAppSelector((state) => state.resources);

  const doFetchResources = useCallback(
    (filters?: { year?: number; typeId?: number }) => dispatch(fetchResources(filters)),
    [dispatch],
  );
  const doFetchCategories = useCallback(() => dispatch(fetchCategories()), [dispatch]);

  // Mutations resolve with the saved row and reject with the server's error message.
  const doCreateResource = useCallback((data: ResourceInput) => dispatch(createResource(data)).unwrap(), [dispatch]);
  const doUpdateResource = useCallback(
    (id: number, updates: Partial<ResourceInput>) => dispatch(updateResource({ id, updates })).unwrap(),
    [dispatch],
  );
  const doDeleteResource = useCallback((id: number) => dispatch(deleteResource(id)).unwrap(), [dispatch]);
  const doFetchResourceFiles = useCallback((resourceId: number) => dispatch(fetchResourceFiles(resourceId)).unwrap(), [dispatch]);
  const doUploadFile = useCallback(
    (resourceId: number, file: File, ministryId?: number, displayName?: string) =>
      dispatch(uploadFile({ resourceId, file, ministryId, displayName: displayName || file.name })).unwrap(),
    [dispatch],
  );
  const doDeleteFile = useCallback(
    (resourceId: number, fileId: number) => dispatch(deleteFile({ resourceId, fileId })).unwrap(),
    [dispatch],
  );
  const doClearError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    resources,
    categories,
    files,
    loading,
    error,
    fetchResources: doFetchResources,
    fetchCategories: doFetchCategories,
    createResource: doCreateResource,
    updateResource: doUpdateResource,
    deleteResource: doDeleteResource,
    fetchResourceFiles: doFetchResourceFiles,
    uploadFile: doUploadFile,
    deleteFile: doDeleteFile,
    clearError: doClearError,
    refetch: () => doFetchResources(),
  };
}

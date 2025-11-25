// src/hooks/useMDAs.ts
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { 
  fetchMDAs, 
  fetchMDA, 
  fetchHierarchicalMDAs,
  setSearch,
  setEntitiesFilters,
  clearEntitiesFilters 
} from '@/lib/store/slices/mdaSlice';
import { UseMDAsParams, UseMDAReturn, UseHierarchicalMDAsReturn } from '@/types/mda';

// Replacement for useMDAs hook
export const useMDAs = (params: UseMDAsParams = {}) => {
  const dispatch = useAppDispatch();
  const { 
    entities, 
    entitiesLoading, 
    entitiesError, 
    entitiesPagination,
    entitiesFilters 
  } = useAppSelector((state) => state.mdas);

  const loadMDAs = useCallback((newParams?: UseMDAsParams) => {
    const finalParams = { ...params, ...newParams };
    dispatch(fetchMDAs(finalParams));
  }, [dispatch, params]);

  const updateFilters = useCallback((newFilters: Partial<UseMDAsParams>) => {
    dispatch(setEntitiesFilters(newFilters));
  }, [dispatch]);

  const resetFilters = useCallback(() => {
    dispatch(clearEntitiesFilters());
  }, [dispatch]);

  // Auto-fetch when params change
  useEffect(() => {
    loadMDAs();
  }, [loadMDAs]);

  return {
    data: entities,
    loading: entitiesLoading,
    error: entitiesError,
    pagination: entitiesPagination,
    filters: entitiesFilters,
    loadMDAs,
    updateFilters,
    resetFilters
  };
};

// Replacement for useMDA hook
export const useMDA = (id: string | undefined): UseMDAReturn => {
  const dispatch = useAppDispatch();
  const { 
    currentMDA, 
    currentMDALoading, 
    currentMDAError 
  } = useAppSelector((state) => state.mdas);

  const loadMDA = useCallback((mdaId: string) => {
    dispatch(fetchMDA(mdaId));
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      loadMDA(id);
    }
  }, [id, loadMDA]);

  return {
    data: currentMDA,
    loading: currentMDALoading,
    error: currentMDAError
  };
};

// Replacement for useHierarchicalMDAs hook
export const useHierarchicalMDAs = (): UseHierarchicalMDAsReturn => {
  const dispatch = useAppDispatch();
  const { 
    hierarchicalData, 
    hierarchicalLoading, 
    hierarchicalError,
    search 
  } = useAppSelector((state) => state.mdas);

  const loadHierarchicalData = useCallback(() => {
    dispatch(fetchHierarchicalMDAs());
  }, [dispatch]);

  const updateSearch = useCallback((searchTerm: string) => {
    dispatch(setSearch(searchTerm));
  }, [dispatch]);

  useEffect(() => {
    loadHierarchicalData();
  }, [loadHierarchicalData]);

  return {
    data: hierarchicalData,
    loading: hierarchicalLoading,
    error: hierarchicalError,
    search,
    updateSearch,
    loadHierarchicalData
  };
};
// hooks/useMemos.ts
import { useState, useEffect } from 'react';

export interface GovMemo {
  id: number;
  name: string; // Changed from title to name
  summary: string;
  body: string;
  memo_type: string;
  priority: string;
  status: string;
  ministry_id: number | null;
  state_department_id: number | null;
  agency_id: number | null;
  created_by: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  ministry_name?: string;
  state_department_name?: string;
  agency_name?: string;
  creator_name?: string;
  creator_email?: string;
}

export interface CreateMemoData {
  name: string;
  summary: string;
  body: string;
  memo_type: string;
  priority: string;
  ministry_id: string;
  state_department_id: string;
  agency_id: string;
  affected_entities: string[];
  status: string;
  workflow?: {
    current_stage: string;
    next_stage: string;
    target_committee: string;
  };
}

export function useMemos(filters?: { status?: string; type?: string }) {
  const [memos, setMemos] = useState<GovMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters?.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }

      const response = await fetch(`/api/memos?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memos: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMemos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching memos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, [filters?.status, filters?.type]);

  const createMemo = async (memoData: CreateMemoData) => {
    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create memo');
      }
      
      const newMemo = await response.json();
      
      // Refresh the list
      await fetchMemos();
      
      return newMemo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create memo';
      setError(errorMessage);
      throw err;
    }
  };

  const updateMemo = async (id: number, memoData: Partial<GovMemo>) => {
    try {
      const response = await fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoData),
      });

      if (!response.ok) {
        throw new Error('Failed to update memo');
      }
      
      const updatedMemo = await response.json();
      
      // Update local state
      setMemos(prev => prev.map(memo => memo.id === id ? updatedMemo : memo));
      
      return updatedMemo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update memo';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteMemo = async (id: number) => {
    try {
      const response = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete memo');
      }
      
      // Update local state
      setMemos(prev => prev.filter(memo => memo.id !== id));
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memo';
      setError(errorMessage);
      throw err;
    }
  };

  return { 
    memos, 
    loading, 
    error, 
    createMemo, 
    updateMemo,
    deleteMemo,
    refetch: fetchMemos 
  };
}
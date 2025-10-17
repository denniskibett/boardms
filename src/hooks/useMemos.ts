// hooks/useMemos.ts
import { useState, useEffect } from 'react';

export interface GovMemo {
  id: number;
  title: string;
  summary: string;
  body: string;
  status: string;
  submitted_by: number;
  submitted_by_name?: string;
  submitted_by_ministry?: string;
  assigned_committee?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function useMemos(filters?: { status?: string; committee?: string }) {
  const [memos, setMemos] = useState<GovMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.committee) params.append('committee', filters.committee);

        const response = await fetch(`/api/memos?${params}`);
        if (!response.ok) throw new Error('Failed to fetch memos');
        
        const data = await response.json();
        setMemos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [filters?.status, filters?.committee]);

  const createMemo = async (memoData: Omit<GovMemo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoData),
      });

      if (!response.ok) throw new Error('Failed to create memo');
      
      const newMemo = await response.json();
      setMemos(prev => [newMemo, ...prev]);
      return newMemo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memo');
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

      if (!response.ok) throw new Error('Failed to update memo');
      
      const updatedMemo = await response.json();
      setMemos(prev => prev.map(memo => memo.id === id ? updatedMemo : memo));
      return updatedMemo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memo');
      throw err;
    }
  };

  return { memos, loading, error, createMemo, updateMemo };
}
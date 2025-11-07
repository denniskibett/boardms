import { useState, useEffect } from 'react';

interface MemoDetail {
  id: number;
  name: string;
  summary: string;
  body: string;
  memo_type: string;
  priority: string;
  status: string;
  ministry_id: number;
  state_department_id: number | null;
  agency_id: number | null;
  created_by: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  ministry_name: string;
  ministry_acronym: string;
  state_department_name: string | null;
  agency_name: string | null;
  creator_by: string;
  creator_email: string;
  affected_entities: string[];
  workflow: any;
  debug?: any;
}

export function useMemoDetail(id: string | number) {
  const [memo, setMemo] = useState<MemoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemo = async () => {
      if (!id) {
        setError('No memo ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching memo with ID: ${id}`);
        const response = await fetch(`/api/memos/${id}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || `Failed to fetch memo: ${response.status}`);
        }
        
        const memoData = await response.json();
        console.log('Fetched memo data:', memoData);
        setMemo(memoData);
      } catch (err) {
        console.error('Error in useMemoDetail:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch memo');
      } finally {
        setLoading(false);
      }
    };

    fetchMemo();
  }, [id]);

  return { memo, loading, error };
}
// src/hooks/useMemo.ts — load one memo (with ministry / department / agency / creator names).
import { useCallback, useEffect, useState } from 'react';
import type { Memo } from '@/components/memos/memoOptions';

export type MemoDetail = Memo & { affected_entities: string[] };

export function useMemoDetail(id: string | number) {
  const [memo, setMemo] = useState<MemoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('No memo ID provided');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/memos/${id}`);
      const json = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setMemo(null);
        return;
      }
      if (!res.ok) throw new Error(json.error || `Failed to fetch memo (${res.status})`);
      setMemo(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return { memo, loading, error, refetch: load };
}

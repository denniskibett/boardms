// app/hooks/useCategories.ts
import { useState, useEffect } from 'react';

export interface Category {
  id: number;
  name: string;
  type: string;
  icon?: string;
  colour?: string;
  created_at: string;
  updated_at: string;
}

export function useCategories(type?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [type]); // Re-fetch when type changes

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = type ? `/api/categories?type=${type}` : '/api/categories';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchCategories();

  // Common filtered sets
  const meetingTypes = categories.filter(c => c.type === 'meeting_type');
  const meetingStatuses = categories.filter(c => c.type === 'meeting_status');
  const decisionStatuses = categories.filter(c => c.type === 'decision_status');
  const locations = categories.filter(c => c.type === 'location');
  const resourceTypes = categories.filter(c => c.type === 'resource_type');

  return {
    categories,
    meetingTypes,
    meetingStatuses,
    decisionStatuses,
    locations,
    resourceTypes,
    loading,
    error,
    refetch
  };
}

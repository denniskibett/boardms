// app/hooks/useCategories.ts
import { useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  type: string;
  colour?: string;
  description?: string;
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
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCategories();
  };

  // Helper methods for common category types
  const meetingTypes = categories.filter(cat => cat.type === 'meeting_status');
  const locations = categories.filter(cat => cat.type === 'location');
  const meetingStatuses = categories.filter(cat => cat.type === 'meeting_status');

  return {
    categories,
    meetingTypes,
    locations,
    meetingStatuses,
    loading,
    error,
    refetch
  };
}
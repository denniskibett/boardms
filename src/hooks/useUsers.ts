// hooks/useUsers.ts
import { useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  ministry?: string;
  status: string;
  last_login?: string;
  created_at: string;
}

export function useUsers(filters?: { role?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters?.role && filters.role !== 'all') {
          params.append('role', filters.role);
        }

        const response = await fetch(`/api/users?${params}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filters?.role]);

  return { users, loading, error };
}
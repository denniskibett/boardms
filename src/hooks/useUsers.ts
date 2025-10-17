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
        if (filters?.role) params.append('role', filters.role);

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

  const createUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to create user');
      
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    }
  };

  return { users, loading, error, createUser };
}
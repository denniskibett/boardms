'use client';

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface QuickAddAgendaProps {
  meetingId: string;
  onAgendaAdded: () => void;
}

export default function QuickAddAgenda({ meetingId, onAgendaAdded }: QuickAddAgendaProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;

  setIsLoading(true);
  setError(null);
  
  try {
    // Ensure meetingId is a number and name is a clean string
    const payload = {
      meeting_id: Number(meetingId), // Convert to number
      name: String(name).trim(),     // Ensure it's a string
      description: "",
      status: "draft",
      presenter_name: "",
      cabinet_approval_required: false,
      created_by: 1 // Change to number (not string)
    };

    console.log('Sending payload:', payload); // Debug log

    const response = await fetch('/api/agenda', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Add better error handling for non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }

    if (response.ok) {
      const newAgenda = await response.json();
      console.log('✅ Agenda created:', newAgenda);
      setName('');
      onAgendaAdded();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add agenda item');
    }
  } catch (error) {
    console.error('Failed to add agenda:', error);
    setError(error instanceof Error ? error.message : 'Failed to add agenda item');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add new agenda item..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Agenda
        </button>
      </form>
    </div>
  );
}
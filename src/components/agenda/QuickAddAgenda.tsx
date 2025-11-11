"use client";
import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface QuickAddAgendaProps {
  meetingId: string;
  onAgendaAdded: () => void;
}

const QuickAddAgenda: React.FC<QuickAddAgendaProps> = ({ meetingId, onAgendaAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Agenda name is required');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get the next sort_order directly by fetching current agenda items
      const nextSortOrder = await getNextSortOrder(meetingId);
      
      console.log('🔢 Next sort order calculated:', nextSortOrder);

      // Prepare minimal data that matches your database schema
      const agendaData = {
        name: formData.name.trim(),
        meeting_id: parseInt(meetingId), // Ensure it's a number
        sort_order: nextSortOrder,
        status: 'draft', // Use a valid status
        description: '', // Required field but can be empty
        presenter_name: null, // Set to null since it's integer type
        ministry_id: null, // Set to null
        cabinet_approval_required: false,
        memo_id: null, // Add this required field
        created_by: null // Add this required field
      };

      console.log('🔄 Adding agenda with data:', agendaData);

      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agendaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to add agenda');
      }

      const newAgenda = await response.json();
      console.log('✅ Agenda added successfully:', newAgenda);

      // Reset form and close
      setFormData({
        name: '',
      });
      setIsOpen(false);
      
      // Notify parent component
      onAgendaAdded();
      
    } catch (error) {
      console.error('❌ Error adding agenda:', error);
      alert(error instanceof Error ? error.message : 'Failed to add agenda item');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get the next sort order by fetching current agenda items
  const getNextSortOrder = async (meetingId: string): Promise<number> => {
    try {
      console.log('🔄 Fetching current agenda items for meeting:', meetingId);
      
      const response = await fetch(`/api/agenda?meetingId=${meetingId}`);
      
      if (response.ok) {
        const agendaItems = await response.json();
        console.log('📋 Current agenda items:', agendaItems);
        
        if (agendaItems.length === 0) {
          console.log('📝 No existing agenda items, starting with 1');
          return 1;
        }
        
        // Find the highest sort_order
        const maxSortOrder = Math.max(...agendaItems.map((item: any) => item.sort_order || 0));
        const nextSortOrder = maxSortOrder + 1;
        
        console.log('🔢 Sort order calculation:', {
          maxSortOrder,
          nextSortOrder,
          totalItems: agendaItems.length
        });
        
        return nextSortOrder;
      } else {
        console.warn('⚠️ Failed to fetch agenda items, defaulting to 1');
        return 1;
      }
    } catch (error) {
      console.error('❌ Error getting sort order:', error);
      return 1; // Default to 1 if there's an error
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Agenda Item
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Quick Add Agenda Item
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Agenda Item Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Enter agenda item name"
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Other details can be added later in the agenda editor
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isLoading ? 'Adding...' : 'Add Agenda Item'}
          </button>
          
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickAddAgenda;
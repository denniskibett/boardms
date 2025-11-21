// components/resources/ResourcesManager.tsx - UPDATED
"use client";

import React, { useState } from 'react';
import { useResources } from '@/hooks/useResources';
import { 
  Plus, 
  Grid3X3,
  ListTree
} from 'lucide-react';
import ResourceForm from '@/components/resources/ResourceForm';
import ResourceExplorer from './ResourceExplorer';
import ResourcesGridView from '@/components/resources/ResourcesGridView';
interface ResourcesManagerProps {
  initialView?: 'explorer' | 'grid' | 'table';
}

export default function ResourcesManager({ initialView = 'explorer' }: ResourcesManagerProps) {
  const {
    resources,
    categories,
    loading,
    error,
    fetchResources
  } = useResources();

  const [view, setView] = useState<'explorer' | 'grid' | 'table'>(initialView);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateResource = () => {
    setShowCreateForm(true);
  };

  const handleUploadFile = (resourceId: number) => {
    // This will be handled by the ResourceExplorer component
    console.log('Upload file for resource:', resourceId);
  };

  if (loading && resources.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Repository
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all cabinet documents, meetings, and decisions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView('explorer')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                view === 'explorer' 
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-700 dark:text-blue-300' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="Folder Explorer View"
            >
              <ListTree className="w-4 h-4" />
              <span className="hidden sm:inline">Explorer</span>
            </button>
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                view === 'grid' 
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-700 dark:text-blue-300' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <button
            onClick={handleCreateResource}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Resource
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {view === 'explorer' ? (
        <ResourceExplorer 
          onUploadFile={handleUploadFile}
          onCreateResource={handleCreateResource}
        />
      ) : (
        <ResourcesGridView 
          resources={resources}
          categories={categories}
          onUploadFile={handleUploadFile}
          onCreateResource={handleCreateResource}
        />
      )}

      {/* Create Resource Modal */}
      {showCreateForm && (
        <ResourceForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchResources();
          }}
        />
      )}
    </div>
  );
}
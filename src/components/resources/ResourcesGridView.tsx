// components/resources/ResourcesGridView.tsx - FIXED
"use client";

import React, { useState } from 'react';
import { 
  Search,
  Folder,
  File,
  Download,
  Edit,
  Trash2,
  Upload,
  Users,
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface ResourcesGridViewProps {
  resources: any[];
  categories: any[];
  onUploadFile: (resourceId: number) => void;
  onCreateResource: () => void;
}

export default function ResourcesGridView({ 
  resources, 
  categories, 
  onUploadFile, 
  onCreateResource 
}: ResourcesGridViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Group resources by type
  const resourcesByType: { [key: string]: any[] } = {};
  
  resources.forEach(resource => {
    const resourceType = resource.resource_type_name || 'UNCATEGORIZED';
    if (!resourcesByType[resourceType]) {
      resourcesByType[resourceType] = [];
    }
    resourcesByType[resourceType].push(resource);
  });

  // Filter resources based on search and filters
  const filteredResourcesByType: { [key: string]: any[] } = {};
  
  Object.entries(resourcesByType).forEach(([resourceType, typeResources]) => {
    const filtered = typeResources.filter(resource => {
      const matchesSearch = resource.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = selectedYear === 'all' || resource.year === selectedYear;
      const matchesType = selectedType === 'all' || resource.resource_type_name === selectedType;
      
      return matchesSearch && matchesYear && matchesType;
    });

    if (filtered.length > 0) {
      filteredResourcesByType[resourceType] = filtered;
    }
  });

  // Get unique years from resources
  const years = [...new Set(resources.map(r => r.year))].sort((a, b) => b - a);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'meetings': return <Users className="w-5 h-5" />;
      case 'decision_letters': return <File className="w-5 h-5" />;
      case 'cabinet_releases': return <BookOpen className="w-5 h-5" />;
      case 'minutes': return <File className="w-5 h-5" />;
      default: return <Folder className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Types</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Type Folders */}
      <div className="space-y-4">
        {Object.entries(filteredResourcesByType).map(([resourceType, typeResources]) => {
          const isExpanded = expandedTypes.has(resourceType);
          
          return (
            <div key={resourceType} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Resource Type Header */}
              <div 
                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => toggleType(resourceType)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {isExpanded ? (
                    <ChevronRight className="w-5 h-5 text-gray-400 transform rotate-90" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                    {getTypeIcon(resourceType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {resourceType.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typeResources.length} resource{typeResources.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resources Grid */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                    {typeResources.map(resource => (
                      <div key={resource.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                {resource.display_name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {resource.year}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Files</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {resource.file_count || 0}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => onUploadFile(resource.id)}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            Upload File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(filteredResourcesByType).length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No resources found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first resource
          </p>
          <button
            onClick={onCreateResource}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Resource
          </button>
        </div>
      )}
    </div>
  );
}
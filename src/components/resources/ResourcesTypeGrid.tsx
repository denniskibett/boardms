"use client";

import React from 'react';
import { Folder, File, Users, BookOpen } from 'lucide-react';

interface Resource {
  resource_type_name: string;
  file_count?: number;
  year: number;
}

interface Category {
  id: string | number;
  name: string;
}

interface ResourcesTypeGridProps {
  resources: Resource[];
  categories: Category[];
  onResourceTypeClick: (type: string) => void;
}

interface ResourcesByType {
  [key: string]: Resource[];
}

export default function ResourcesTypeGrid({ 
  resources, 
  categories, 
  onResourceTypeClick 
}: ResourcesTypeGridProps) {
  
  const resourcesByType = resources.reduce<ResourcesByType>((acc, resource) => {
    const type = resource.resource_type_name || 'UNCATEGORIZED';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {});

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    
    const iconMap: Record<string, React.ReactNode> = {
      'meetings': <Users className="w-8 h-8" />,
      'decision_letters': <File className="w-8 h-8" />,
      'cabinet_releases': <BookOpen className="w-8 h-8" />,
      'minutes': <File className="w-8 h-8" />
    };

    return iconMap[lowerType] || <Folder className="w-8 h-8" />;
  };

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    
    const colorMap: Record<string, string> = {
      'meetings': 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      'decision_letters': 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      'cabinet_releases': 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      'minutes': 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300'
    };

    return colorMap[lowerType] || 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatCategoryName = (name: string): string => {
    return name.replace(/_/g, ' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map(category => {
        const typeResources = resourcesByType[category.name] || [];
        const totalFiles = typeResources.reduce(
          (sum: number, resource) => sum + (resource.file_count || 0), 
          0
        );
        const years = [...new Set(typeResources.map(resource => resource.year))]
          .sort((a, b) => b - a);

        const displayYears = years.slice(0, 2).join(', ') + (years.length > 2 ? '...' : '');
        const formattedName = formatCategoryName(category.name);

        return (
          <div
            key={category.id}
            onClick={() => onResourceTypeClick(category.name)}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${getTypeColor(category.name)}`}>
                {getTypeIcon(category.name)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {formattedName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeResources.length} resources
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Files</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {totalFiles}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Years</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {displayYears}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Browse {formattedName}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
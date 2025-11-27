// src/components/resources/ResourceExplorer.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Eye, 
  Upload,
  Plus,
  Search,
  Loader2
} from 'lucide-react';
import { useResources } from '@/hooks/useResources';
import UploadFileModal from './UploadFileModal';

interface FolderItem {
  type: 'folder';
  name: string;
  path: string;
  items: FolderStructure;
  resource?: any;
}

interface FileItem {
  type: 'file';
  name: string;
  file: any;
}

type FolderStructure = (FolderItem | FileItem)[];

interface ResourceExplorerProps {
  onUploadFile: (resourceId: number) => void;
  onCreateResource: () => void;
}

export default function ResourceExplorer({ onUploadFile, onCreateResource }: ResourceExplorerProps) {
  const { 
    resources, 
    categories, 
    files, 
    loading, 
    fetchResourceFiles, 
    fetchCategories,
    uploadFile 
  } = useResources();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);

  // Build optimized folder structure with useMemo
  const folderStructure = useMemo(() => {
    const structure: FolderStructure = [];
    const resourcesByType: { [key: string]: any[] } = {};

    // Group resources by type
    resources.forEach(resource => {
      const resourceType = resource.resource_type_name || 'UNCATEGORIZED';
      if (!resourcesByType[resourceType]) {
        resourcesByType[resourceType] = [];
      }
      resourcesByType[resourceType].push(resource);
    });

    // Create resource type folders
    Object.entries(resourcesByType).forEach(([resourceType, typeResources]) => {
      const typeFolder: FolderItem = {
        type: 'folder',
        name: resourceType,
        path: resourceType,
        items: []
      };

      // Group by year within this resource type
      const resourcesByYear: { [key: string]: any[] } = {};
      
      typeResources.forEach(resource => {
        const year = resource.year.toString();
        if (!resourcesByYear[year]) {
          resourcesByYear[year] = [];
        }
        resourcesByYear[year].push(resource);
      });

      // Create year folders
      Object.entries(resourcesByYear).forEach(([year, yearResources]) => {
        const yearFolder: FolderItem = {
          type: 'folder',
          name: year,
          path: `${resourceType}/${year}`,
          items: []
        };

        // Create resource folders
        yearResources.forEach(resource => {
          const resourceFolder: FolderItem = {
            type: 'folder',
            name: resource.name,
            path: `${resourceType}/${year}/${resource.name}`,
            items: [],
            resource: resource
          };
          yearFolder.items.push(resourceFolder);
        });

        typeFolder.items.push(yearFolder);
      });

      structure.push(typeFolder);
    });

    return structure;
  }, [resources]);

  // Optimized toggle folder function
  const toggleFolder = useCallback(async (path: string) => {
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      
      // If this is a resource folder, load its files
      const pathParts = path.split('/');
      if (pathParts.length === 3) {
        const [resourceType, year, resourceName] = pathParts;
        
        // Find the resource
        const resource = resources.find(r => 
          r.resource_type_name === resourceType && 
          r.year.toString() === year && 
          r.name === resourceName
        );

        if (resource && !files[resource.id]) {
          setLoadingFiles(prev => new Set(prev).add(path));
          try {
            await fetchResourceFiles(resource.id);
          } catch (error) {
            console.error('Error loading files:', error);
          } finally {
            setLoadingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(path);
              return newSet;
            });
          }
        }
      }
    }
    
    setExpandedFolders(newExpanded);
  }, [expandedFolders, resources, files, fetchResourceFiles]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // In ResourceExplorer.tsx - UPDATE THE FILE HANDLING FUNCTIONS
  const handleDownload = async (file: any) => {
    try {
      // For Supabase storage, we can use the public URL directly
      // But we need to make sure the file is publicly accessible
      const response = await fetch(file.file_url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleViewFile = (file: any) => {
    // For Supabase storage, open the public URL directly
    window.open(file.file_url, '_blank');
  };


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    return '📎';
  };

  // Recursive function to render folder structure
  const renderFolderItem = (item: FolderItem | FileItem, level: number = 0) => {
    if (item.type === 'file') {
      return (
        <FileItem 
          key={`file-${item.file.id}`}
          file={item.file}
          level={level}
          onView={handleViewFile}
          onDownload={handleDownload}
          getFileIcon={getFileIcon}
          formatFileSize={formatFileSize}
        />
      );
    }

    // It's a folder
    const folder = item as FolderItem;
    const isExpanded = expandedFolders.has(folder.path);
    const isResourceFolder = folder.path.split('/').length === 3;
    const isLoading = loadingFiles.has(folder.path);
    const resourceFiles = folder.resource ? files[folder.resource.id] : [];

    return (
      <div key={folder.path} className="select-none">
        {/* Folder Header */}
        <div 
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
            level > 0 ? 'border-l-2 border-gray-200 dark:border-gray-600' : ''
          }`}
          onClick={() => toggleFolder(folder.path)}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <Folder className={`w-4 h-4 flex-shrink-0 ${
              level === 0 ? 'text-blue-500' : 
              level === 1 ? 'text-green-500' : 
              'text-orange-500'
            }`} />
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {folder.name}
            </span>
            {folder.resource && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full flex-shrink-0">
                {folder.resource.file_count || 0} files
              </span>
            )}
          </div>

          {/* Action buttons for resource folders */}
          {isResourceFolder && folder.resource && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResource(folder.resource.id);
                  setShowUploadModal(true);
                }}
                className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="Upload file"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Folder Contents */}
        {isExpanded && (
          <div>
            {/* Sub-folders */}
            {folder.items.map(subItem =>
              renderFolderItem(subItem, level + 1)
            )}

            {/* Files in resource folder */}
            {isResourceFolder && resourceFiles && resourceFiles.length > 0 && (
              <div>
                {resourceFiles.map((file: any) => (
                  <FileItem 
                    key={file.id} 
                    file={file} 
                    level={level + 1}
                    onView={handleViewFile}
                    onDownload={handleDownload}
                    getFileIcon={getFileIcon}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div 
                className="flex items-center gap-2 py-2 px-3 text-gray-500 dark:text-gray-400"
                style={{ marginLeft: `${(level + 1) * 16}px` }}
              >
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="text-sm">Loading files...</span>
              </div>
            )}

            {/* Empty state for resource folder */}
            {isResourceFolder && (!resourceFiles || resourceFiles.length === 0) && !isLoading && (
              <div 
                className="text-center py-4 text-gray-500 dark:text-gray-400"
                style={{ marginLeft: `${(level + 1) * 16}px` }}
              >
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files uploaded yet</p>
                <button
                  onClick={() => {
                    setSelectedResource(folder.resource.id);
                    setShowUploadModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
                >
                  Upload first file
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // File Item Component for better performance
  const FileItem = React.memo(({ 
    file, 
    level, 
    onView, 
    onDownload, 
    getFileIcon, 
    formatFileSize 
  }: any) => (
    <div
      className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 group"
      style={{ marginLeft: `${level * 16}px` }}
    >
      <span className="text-lg flex-shrink-0">
        {getFileIcon(file.file_type)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {file.display_name}
          </span>
          {file.ministry_name && (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full flex-shrink-0">
              {file.ministry_name}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="truncate">{file.name}</span>
          <span className="mx-2">•</span>
          <span>{formatFileSize(file.file_size)}</span>
          <span className="mx-2">•</span>
          <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onView(file)}
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="View file"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDownload(file)}
          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          title="Download file"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  ));

  FileItem.displayName = 'FileItem';

  // Filter folder structure based on search term
  const filteredFolderStructure = useMemo(() => {
    if (!searchTerm.trim()) return folderStructure;

    const filterItems = (items: FolderStructure): FolderStructure => {
      return items.filter(item => {
        if (item.type === 'file') {
          return item.file.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.file.name.toLowerCase().includes(searchTerm.toLowerCase());
        }

        // For folders, check if folder name matches or any child matches
        const folder = item as FolderItem;
        const nameMatches = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
        const childrenMatch = filterItems(folder.items).length > 0;
        
        return nameMatches || childrenMatch;
      }).map(item => {
        if (item.type === 'folder') {
          return {
            ...item,
            items: filterItems(item.items)
          };
        }
        return item;
      });
    };

    return filterItems(folderStructure);
  }, [folderStructure, searchTerm]);

  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false);
    setSelectedResource(null);
    
    // Refresh the file contents for the current folder
    if (selectedResource) {
      fetchResourceFiles(selectedResource);
      
      // Re-trigger the folder expansion to reload files
      const currentPath = Object.values(folderStructure).flatMap((typeFolder: any) =>
        typeFolder.items.flatMap((yearFolder: any) =>
          yearFolder.items
            .filter((resourceFolder: any) => resourceFolder.resource?.id === selectedResource)
            .map((resourceFolder: any) => resourceFolder.path)
        )
      )[0];
      
      if (currentPath) {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentPath);
          return newSet;
        });
        setTimeout(() => toggleFolder(currentPath), 100);
      }
    }
  }, [selectedResource, folderStructure, fetchResourceFiles, toggleFolder]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Resource Explorer
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Browse documents by folder structure
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateResource}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Resource
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Folder Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Folder className="w-4 h-4" />
            <span>public/uploads/resources/</span>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && resources.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredFolderStructure.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No matching results' : 'No resources found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first resource'}
              </p>
              {!searchTerm && (
                <button
                  onClick={onCreateResource}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Resource
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFolderStructure.map(item => renderFolderItem(item))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedResource && (
        <UploadFileModal
          resourceId={selectedResource}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedResource(null);
          }}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
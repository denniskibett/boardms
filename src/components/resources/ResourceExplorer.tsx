// components/resources/ResourceExplorer.tsx - FIXED
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Eye, 
  Upload,
  Plus,
  Search
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
  const { resources, fetchResourceFiles } = useResources();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderStructure, setFolderStructure] = useState<FolderStructure>([]);
  const [fileContents, setFileContents] = useState<{[key: string]: any[]}>({});
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);

  // Build folder structure from resources
  useEffect(() => {
    const buildStructure = () => {
      const structure: FolderStructure = [];

      // Group by resource type
      const resourcesByType: { [key: string]: any[] } = {};
      
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

      setFolderStructure(structure);
    };

    buildStructure();
  }, [resources]);

  const toggleFolder = async (path: string) => {
    
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      
      // If this is a resource folder, load its files
      const pathParts = path.split('/');
      if (pathParts.length === 3) { // resource_type/year/resource_name
        const [resourceType, year, resourceName] = pathParts;
        
        // Find the resource
        const resource = resources.find(r => 
          r.resource_type_name === resourceType && 
          r.year.toString() === year && 
          r.name === resourceName
        );

        if (resource && !fileContents[path]) {
          setLoadingFiles(prev => new Set(prev).add(path));
          try {
            const files = await fetchResourceFiles(resource.id);
            setFileContents(prev => ({
              ...prev,
              [path]: files
            }));
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
  };

  const findFolderByPath = (items: FolderStructure, targetPath: string): FolderItem | null => {
    for (const item of items) {
      if (item.type === 'folder') {
        if (item.path === targetPath) {
          return item;
        }
        const found = findFolderByPath(item.items, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDownload = async (file: any) => {
    try {
      const response = await fetch(file.file_url);
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
    switch (fileType) {
      case 'pdf': return '📄';
      case 'word': return '📝';
      case 'excel': return '📊';
      case 'powerpoint': return '📑';
      case 'image': return '🖼️';
      case 'archive': return '📦';
      default: return '📎';
    }
  };

  const renderFolderItem = (item: FolderItem | FileItem, level: number = 0) => {
    if (item.type === 'file') {
      return (
        <div
          key={`file-${item.file.id}`}
          className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700"
          style={{ marginLeft: `${level * 16}px` }}
        >
          <span className="text-lg flex-shrink-0">
            {getFileIcon(item.file.file_type)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {item.file.display_name}
              </span>
              {item.file.ministry_name && (
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full flex-shrink-0">
                  {item.file.ministry_name}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{item.file.name}</span>
              <span className="mx-2">•</span>
              <span>{formatFileSize(item.file.file_size)}</span>
              <span className="mx-2">•</span>
              <span>{new Date(item.file.uploaded_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handleViewFile(item.file)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="View file"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(item.file)}
              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // It's a folder
    const folder = item as FolderItem;
    const isExpanded = expandedFolders.has(folder.path);
    const isResourceFolder = folder.path.split('/').length === 3; // resource_type/year/resource_name
    const isLoading = loadingFiles.has(folder.path);

    return (
      <div key={folder.path} className="select-none">
        {/* Folder Header */}
        <div 
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
            level > 0 ? `ml-${level * 4}` : ''
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
            <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
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
            {folder.items.map(item =>
              renderFolderItem(item, level + 1)
            )}

            {/* Files in resource folder */}
            {isResourceFolder && fileContents[folder.path] && (
              <div>
                {fileContents[folder.path].map((file) => (
                  <FileItem 
                    key={file.id} 
                    file={file} 
                    level={level + 1}
                    onView={handleViewFile}
                    onDownload={handleDownload}
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Loading files...</span>
              </div>
            )}

            {/* Empty state for resource folder */}
            {isResourceFolder && !fileContents[folder.path] && !isLoading && (
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

  // Separate component for file items
  const FileItem = ({ file, level, onView, onDownload }: any) => (
    <div
      className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700"
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
          <span>{file.name}</span>
          <span className="mx-2">•</span>
          <span>{formatFileSize(file.file_size)}</span>
          <span className="mx-2">•</span>
          <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
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
  );

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
          {folderStructure.length === 0 ? (
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
          ) : (
            folderStructure.map(item => renderFolderItem(item))
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
          onSuccess={() => {
            setShowUploadModal(false);
            setSelectedResource(null);
            // Refresh the file contents for the current folder
            const currentPath = Object.values(folderStructure).flatMap((typeFolder: any) =>
              typeFolder.items.flatMap((yearFolder: any) =>
                yearFolder.items
                  .filter((resourceFolder: any) => resourceFolder.resource?.id === selectedResource)
                  .map((resourceFolder: any) => resourceFolder.path)
              )
            )[0];
            
            if (currentPath) {
              setFileContents(prev => ({ ...prev, [currentPath]: undefined }));
              // Re-trigger the folder expansion to reload files
              setExpandedFolders(prev => {
                const newSet = new Set(prev);
                newSet.delete(currentPath);
                return newSet;
              });
              setTimeout(() => toggleFolder(currentPath), 100);
            }
          }}
        />
      )}
    </div>
  );
}
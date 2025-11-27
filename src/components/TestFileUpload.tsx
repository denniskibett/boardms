// src/components/TestFileUpload.tsx - UPDATED WITH PROPER FOLDER STRUCTURE
'use client';

import { useState, useEffect } from 'react';
import { useResources } from '@/hooks/useResources';
import { useSession } from 'next-auth/react';
import { Folder, File, ChevronRight } from 'lucide-react';

export default function TestFileUpload() {
  const { resources, fetchResources, createResource, uploadFile, fetchResourceFiles, files } = useResources();
  const { data: session, status } = useSession();
  const [testStatus, setTestStatus] = useState<string>('Ready to test');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [testResource, setTestResource] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [folderStructure, setFolderStructure] = useState<string>('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchResources();
      if (testResource?.id) {
        fetchResourceFiles(testResource.id);
      }
    }
  }, [fetchResources, testResource, status]);

  const generateFolderStructure = (resource: any, file: any) => {
    if (!resource || !file) return '';
    
    return `documents/
├── ${resource.resource_type_name}/
│   ├── ${resource.year}/
│   │   ├── ${resource.name}/
│   │   │   └── ${file.name || 'your-file.txt'}`;
  };

  const runCompleteTest = async () => {
    if (status !== 'authenticated') {
      setTestStatus('❌ Please sign in first');
      return;
    }

    setTestStatus('Starting comprehensive test...');
    setUploadedFile(null);
    setFolderStructure('');
    
    try {
      // Step 1: Get available categories first
      setCurrentStep('Fetching categories...');
      const categoriesResponse = await fetch('/api/categories?type=resource_type');
      const categories = await categoriesResponse.json();
      
      if (!categories || categories.length === 0) {
        throw new Error('No resource categories found. Please create categories first.');
      }

      const firstCategory = categories[0];
      console.log('Using category:', firstCategory);

      // Step 2: Create a test resource
      setCurrentStep('Creating test resource...');
      const resourceData = {
        name: 'TEST-' + Date.now(),
        display_name: 'Test Resource ' + new Date().toLocaleTimeString(),
        resource_type_id: firstCategory.id,
        year: new Date().getFullYear(),
        description: 'Test resource for file upload verification'
      };

      console.log('Creating resource with data:', resourceData);

      const newResource = await createResource(resourceData);
      if (!newResource) {
        throw new Error('Failed to create test resource - check RLS policies');
      }
      
      setTestResource(newResource);
      setTestStatus(`✅ Resource created: ${newResource.display_name}`);
      setCurrentStep('Resource created successfully');

      // Update folder structure preview
      setFolderStructure(generateFolderStructure(newResource, { name: 'waiting-for-file...' }));

      // Wait a moment for resource to be available
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Upload a test file
      setCurrentStep('Creating test file...');
      const testContent = `Test File Content
Created: ${new Date().toISOString()}
Resource: ${newResource.display_name}
Type: ${newResource.resource_type_name}
Year: ${newResource.year}
Folder: ${newResource.name}

This file tests the Supabase storage folder structure:
- documents/${newResource.resource_type_name}/${newResource.year}/${newResource.name}/
`;
      
      const testFile = new File([testContent], `test-file-${Date.now()}.txt`, { 
        type: 'text/plain' 
      });

      setCurrentStep('Uploading file to Supabase...');
      const uploadedFileResult = await uploadFile(
        newResource.id,
        testFile,
        undefined, // No ministry
        'Test File - ' + new Date().toLocaleTimeString()
      );

      if (!uploadedFileResult) {
        throw new Error('Failed to upload test file - check storage policies');
      }

      setUploadedFile(uploadedFileResult);
      setTestStatus(`✅ File uploaded: ${uploadedFileResult.display_name}`);
      setCurrentStep('File uploaded successfully');

      // Update folder structure with actual file
      setFolderStructure(generateFolderStructure(newResource, uploadedFileResult));

      // Step 4: Verify file in database
      setCurrentStep('Verifying database record...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchResourceFiles(newResource.id);
      
      const resourceFiles = files[newResource.id] || [];
      const foundFile = resourceFiles.find((f: any) => f.id === uploadedFileResult.id);
      
      if (!foundFile) {
        throw new Error('File not found in database after upload');
      }

      setTestStatus(`✅ Database record verified: ${foundFile.name}`);
      setCurrentStep('Database verification complete');

      // Step 5: Test file download/access
      setCurrentStep('Testing file access...');
      try {
        const response = await fetch(foundFile.file_url);
        if (!response.ok) {
          throw new Error(`File access failed: ${response.status}`);
        }
        const content = await response.text();
        setTestStatus(`✅ File accessible! URL: ${foundFile.file_url}`);
        setCurrentStep('File access test complete');
        
        // Show file content preview
        console.log('File content:', content);
      } catch (error) {
        setTestStatus(`⚠️ File created but access test failed: ${error}`);
      }

      setTestStatus('✅ Complete! Check Supabase Dashboard for files.');

    } catch (error: any) {
      setTestStatus(`❌ Test failed: ${error.message}`);
      setCurrentStep('Test failed');
      console.error('Test error:', error);
    }
  };

  const checkDatabaseStatus = async () => {
    setCurrentStep('Checking database status...');
    try {
      const [resourcesRes, categoriesRes] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/categories?type=resource_type')
      ]);

      const resources = await resourcesRes.json();
      const categories = await categoriesRes.json();

      setTestStatus(`✅ Database check: ${resources.length} resources, ${categories.length} categories`);
      
      // Show available categories
      if (categories.length > 0) {
        console.log('Available categories:', categories);
      }
    } catch (error) {
      setTestStatus(`❌ Database check failed: ${error}`);
    }
  };

  const viewInSupabase = () => {
    if (testResource) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        window.open(`${supabaseUrl}/storage/buckets/documents`, '_blank');
      } else {
        alert('Supabase URL not configured');
      }
    }
  };

  if (status === 'loading') {
    return <div>Loading authentication...</div>;
  }

  if (status !== 'authenticated') {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
        <p className="text-yellow-800 dark:text-yellow-200">
          Please sign in to run the file upload test.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Supabase File Upload Test - Folder Structure
      </h2>
      
      <div className="space-y-4">
        {/* User and Status */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>User:</strong> {session?.user?.email}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Current Status:</strong> {testStatus}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            <strong>Step:</strong> {currentStep}
          </p>
        </div>

        {/* Folder Structure Preview */}
        {folderStructure && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Supabase Storage Folder Structure
              </h3>
            </div>
            <pre className="text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border text-purple-700 dark:text-purple-300 overflow-x-auto">
              {folderStructure}
            </pre>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              This shows how files are organized in Supabase Storage
            </p>
          </div>
        )}

        {/* Test Resource Info */}
        {testResource && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Test Resource Created
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-green-600 dark:text-green-400">Name:</span>
                <br />
                <span className="font-mono">{testResource.name}</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Display:</span>
                <br />
                <span>{testResource.display_name}</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Type:</span>
                <br />
                <span>{testResource.resource_type_name}</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Year:</span>
                <br />
                <span>{testResource.year}</span>
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Files: {files[testResource.id]?.length || 0}
            </p>
          </div>
        )}

        {/* Uploaded File Info */}
        {uploadedFile && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                File Uploaded to Supabase
              </p>
            </div>
            <div className="text-xs space-y-1">
              <p><span className="text-blue-600 dark:text-blue-400">Name:</span> {uploadedFile.name}</p>
              <p><span className="text-blue-600 dark:text-blue-400">Display:</span> {uploadedFile.display_name}</p>
              <p><span className="text-blue-600 dark:text-blue-400">Size:</span> {uploadedFile.file_size} bytes</p>
              <p><span className="text-blue-600 dark:text-blue-400">Type:</span> {uploadedFile.file_type}</p>
              <p className="break-all">
                <span className="text-blue-600 dark:text-blue-400">URL:</span> 
                <br />
                <a href={uploadedFile.file_url} target="_blank" rel="noopener noreferrer" className="underline">
                  {uploadedFile.file_url}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runCompleteTest}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run Complete Test
          </button>
          
          <button
            onClick={checkDatabaseStatus}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Check Database
          </button>

          {testResource && (
            <button
              onClick={viewInSupabase}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View in Supabase
            </button>
          )}

          <button
            onClick={() => {
              setTestStatus('Ready to test');
              setCurrentStep('');
              setTestResource(null);
              setUploadedFile(null);
              setFolderStructure('');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset Test
          </button>
        </div>

        {/* RLS Fix Section */}
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
            <strong>RLS Issue Detected:</strong> If tests fail due to RLS policies, try this:
          </p>
          <button
            onClick={async () => {
              setCurrentStep('Applying RLS fix...');
              try {
                const response = await fetch('/api/fix-rls', { method: 'POST' });
                const result = await response.json();
                setTestStatus(result.success ? '✅ RLS fix applied' : '❌ RLS fix failed');
              } catch (error) {
                setTestStatus('❌ RLS fix error');
              }
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            Apply RLS Fix
          </button>
        </div>

        {/* Available Resources */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Available Resources ({resources.length})
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {resources.map(resource => (
              <div key={resource.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {resource.display_name}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Type: {resource.resource_type_name} • Year: {resource.year}</p>
                  <p className="font-mono">Folder: {resource.name}</p>
                  <p>Files: {resource.file_count} • ID: {resource.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
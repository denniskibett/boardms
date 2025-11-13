'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx';
  file?: File;
  content?: string;
  agenda_id?: number;
}

interface BookViewerProps {
  documents: Document[];
  currentPage: number;
  onPageChange: (page: number) => void;
  isFullscreen?: boolean;
  onAgendaItemClick?: (documentIndex: number) => void;
}

export default function BookViewer({
  documents,
  currentPage,
  onPageChange,
  isFullscreen = false,
  onAgendaItemClick
}: BookViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const documentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [documentUrls, setDocumentUrls] = useState<{[key: string]: string}>({});
  const [docxContent, setDocxContent] = useState<{[key: string]: string}>({});
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  const currentDocument = documents[currentPage];

  // Convert Word document to HTML using Mammoth
  const convertWordToHTML = async (document: Document): Promise<string> => {
    return new Promise((resolve, reject) => {
      import('mammoth').then(mammoth => {
        // Use the document URL from the API
        const documentUrl = documentUrls[document.id] || document.url;
        
        fetch(documentUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch document: ${response.status}`);
            }
            return response.arrayBuffer();
          })
          .then(arrayBuffer => {
            mammoth.convertToHtml({ arrayBuffer })
              .then((result: any) => {
                const htmlContent = `
                  <div class="word-document">
                    <div class="word-content prose max-w-none">
                      ${result.value}
                    </div>
                  </div>
                `;
                resolve(htmlContent);
              })
              .catch(reject);
          })
          .catch(reject);
      }).catch(reject);
    });
  };

  // Process documents and create object URLs
  useEffect(() => {
    const newUrls: {[key: string]: string} = {};
    const processDocuments = async () => {
      for (const doc of documents) {
        if (doc.file && !documentUrls[doc.id]) {
          newUrls[doc.id] = URL.createObjectURL(doc.file);
          
          // Process DOCX files with Mammoth
          if ((doc.type === 'docx' || doc.type === 'doc') && doc.file) {
            try {
              setLoadingStates(prev => ({ ...prev, [doc.id]: true }));
              const arrayBuffer = await doc.file.arrayBuffer();
              const result = await import('mammoth').then(mammoth => 
                mammoth.convertToHtml({ arrayBuffer })
              );
              setDocxContent(prev => ({
                ...prev,
                [doc.id]: result.value
              }));
            } catch (error) {
              console.error('Error converting DOCX:', error);
              setDocxContent(prev => ({
                ...prev,
                [doc.id]: `<div class="error-message p-4 bg-red-50 border border-red-200 rounded">
                  <h3 class="text-red-800 font-semibold">Error Loading Document</h3>
                  <p class="text-red-600">Failed to load Word document: ${error.message}</p>
                </div>`
              }));
            } finally {
              setLoadingStates(prev => ({ ...prev, [doc.id]: false }));
            }
          }
        } else if (doc.url && !documentUrls[doc.id] && (doc.type === 'docx' || doc.type === 'doc')) {
          // Process DOCX files from server URLs
          try {
            setLoadingStates(prev => ({ ...prev, [doc.id]: true }));
            const htmlContent = await convertWordToHTML(doc);
            setDocxContent(prev => ({
              ...prev,
              [doc.id]: htmlContent
            }));
          } catch (error) {
            console.error('Error converting server DOCX:', error);
            setDocxContent(prev => ({
              ...prev,
              [doc.id]: `<div class="error-message p-4 bg-red-50 border border-red-200 rounded">
                <h3 class="text-red-800 font-semibold">Error Loading Document</h3>
                <p class="text-red-600">Failed to load Word document from server: ${error.message}</p>
              </div>`
            }));
          } finally {
            setLoadingStates(prev => ({ ...prev, [doc.id]: false }));
          }
        }
      }

      if (Object.keys(newUrls).length > 0) {
        setDocumentUrls(prev => ({ ...prev, ...newUrls }));
      }
    };

    processDocuments();

    return () => {
      Object.values(newUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [documents]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousDocument();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextDocument();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, documents.length]);

  const goToPreviousDocument = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      console.log('Going to previous document:', newPage);
      onPageChange(newPage);
      scrollToDocument(newPage);
    }
  };

  const goToNextDocument = () => {
    if (currentPage < documents.length - 1) {
      const newPage = currentPage + 1;
      console.log('Going to next document:', newPage);
      onPageChange(newPage);
      scrollToDocument(newPage);
    }
  };

  const scrollToDocument = useCallback((pageIndex: number) => {
    if (scrollContainerRef.current && documentRefs.current[pageIndex]) {
      const documentElement = documentRefs.current[pageIndex];
      if (documentElement) {
        console.log('Scrolling to document:', pageIndex);
        
        setTimeout(() => {
          documentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }, 100);
      } else {
        console.warn('Document element not found for index:', pageIndex);
      }
    } else {
      console.warn('Scroll container or document refs not ready');
    }
  }, []);

  // Enhanced scroll handler for proper document highlighting
  const handleScroll = useCallback(() => {
    if (documents.length === 0 || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const viewportHeight = container.clientHeight;
    
    let closestDocumentIndex = 0;
    let smallestDistance = Infinity;
    
    // Find the document that's closest to the center of the viewport
    documentRefs.current.forEach((docElement, index) => {
      if (docElement) {
        const rect = docElement.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = containerRect.top + viewportHeight / 2;
        const distance = Math.abs(elementCenter - viewportCenter);
        
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestDocumentIndex = index;
        }
      }
    });
    
    if (closestDocumentIndex !== currentPage) {
      console.log('Scroll detected new page:', closestDocumentIndex);
      onPageChange(closestDocumentIndex);
    }
  }, [documents.length, currentPage, onPageChange]);

  // Scroll to current document when it changes (from agenda click)
  useEffect(() => {
    if (currentPage >= 0 && currentPage < documents.length) {
      console.log('Current page changed to:', currentPage, 'Scrolling...');
      scrollToDocument(currentPage);
    }
  }, [currentPage, documents.length, scrollToDocument]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Initialize document refs
  useEffect(() => {
    documentRefs.current = documentRefs.current.slice(0, documents.length);
  }, [documents.length]);

  // Render document content based on type
  const renderDocumentContent = (document: Document, documentIndex: number) => {
    const documentUrl = documentUrls[document.id] || document.url;
    const isLoading = loadingStates[document.id];

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      );
    }

    // PDF files
    if (document.type === 'pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={`${documentUrl}#toolbar=0&navpanes=0`}
            className="w-full h-[800px] border-0 rounded-lg"
            title={document.name}
          />
        </div>
      );
    }

    // Word documents (DOCX, DOC)
    if (document.type === 'docx' || document.type === 'doc') {
      if (docxContent[document.id]) {
        return (
          <div className="w-full h-full p-6">
            <div 
              className="word-document-container bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-w-4xl mx-auto"
              dangerouslySetInnerHTML={{ __html: docxContent[document.id] }}
            />
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg font-semibold text-gray-800">{document.name}</p>
              <p className="text-gray-600 mt-2">Word Document</p>
              <p className="text-sm text-gray-500 mt-2">Loading content...</p>
            </div>
          </div>
        );
      }
    }

    // PowerPoint files (PPT, PPTX)
    if (document.type === 'ppt' || document.type === 'pptx') {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-semibold text-gray-800">{document.name}</p>
            <p className="text-gray-600 mt-2">PowerPoint Presentation</p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                PowerPoint files are not directly viewable in the browser.
              </p>
              <a 
                href={documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download PowerPoint
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Image files
    if (document.type === 'image') {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={documentUrl} 
            alt={document.name}
            className="max-w-full max-h-[800px] object-contain rounded-lg"
          />
        </div>
      );
    }

    // Text files
    if (document.type === 'text' && document.content) {
      return (
        <div className="w-full h-full p-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{document.name}</h3>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-gray-50 p-4 rounded border">
              {document.content}
            </pre>
          </div>
        </div>
      );
    }

    // Excel files (XLS, XLSX)
    if (document.type === 'xls' || document.type === 'xlsx') {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📈</div>
            <p className="text-lg font-semibold text-gray-800">{document.name}</p>
            <p className="text-gray-600 mt-2">Excel Spreadsheet</p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Excel files are not directly viewable in the browser.
              </p>
              <a 
                href={documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download Excel
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Unknown file types
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">📁</div>
          <p className="text-lg font-semibold text-gray-800">{document.name}</p>
          <p className="text-gray-600 mt-2">Type: {document.type.toUpperCase()}</p>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-800 text-sm">
              This file type cannot be previewed in the browser.
            </p>
            <a 
              href={documentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Add CSS for Word document styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .word-document-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
      }
      .word-content {
        color: #374151;
      }
      .word-content h1 {
        font-size: 1.875rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: #111827;
      }
      .word-content h2 {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 0.75rem;
        color: #111827;
      }
      .word-content h3 {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 0.75rem;
        color: #111827;
      }
      .word-content p {
        margin-bottom: 1rem;
      }
      .word-content ul, .word-content ol {
        margin-bottom: 1rem;
        padding-left: 2rem;
      }
      .word-content li {
        margin-bottom: 0.5rem;
      }
      .word-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      .word-content table, .word-content th, .word-content td {
        border: 1px solid #d1d5db;
      }
      .word-content th, .word-content td {
        padding: 0.5rem;
        text-align: left;
      }
      .word-content th {
        background-color: #f9fafb;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-500 mb-4">No documents uploaded</p>
          <p className="text-sm text-gray-400">Upload a document to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Static Header */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={goToPreviousDocument}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            ← Previous
          </button>
          
          <div className="text-center">
            <span className="text-gray-600 font-medium">
              {currentPage + 1} of {documents.length}
            </span>
            <p className="text-sm text-gray-400">{currentDocument?.name}</p>
          </div>
          
          <button
            onClick={goToNextDocument}
            disabled={currentPage >= documents.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Scrollable Document Area */}
      <div className="flex-1 bg-gray-100 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overflow-x-hidden"
        >
          <div className="py-8 px-8 space-y-8">
            {documents.map((document, index) => (
              <div 
                key={document.id}
                ref={el => {
                  documentRefs.current[index] = el;
                }}
                data-document-index={index}
                className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px] transition-all duration-300"
              >
                <div className="p-6">
                  {renderDocumentContent(document, index)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
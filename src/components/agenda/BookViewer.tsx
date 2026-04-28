'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FileText, File, Image, FileSpreadsheet, Presentation, FileType, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface Document {
  id: string;
  name: string;
  url: string;
  pages: number;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'csv';
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
  const [csvContent, setCsvContent] = useState<{[key: string]: string}>({});
  const [excelContent, setExcelContent] = useState<{[key: string]: string}>({});
  const [pptContent, setPptContent] = useState<{[key: string]: string}>({});
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const currentDocument = documents[currentPage];

  // Convert PowerPoint to viewable format
  const convertPowerPointToViewable = async (document: Document): Promise<string> => {
    try {
      const documentUrl = documentUrls[document.id] || document.url;
      
      // For local files (with file object)
      if (document.file) {
        // Create a blob URL for the file
        const blob = new Blob([await document.file.arrayBuffer()], { type: document.file.type });
        const blobUrl = URL.createObjectURL(blob);
        
        // Show download option for local files
        return `
          <div class="pptx-viewer">
            <div class="mb-4 p-4 bg-gray-50 border-b flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(document.name)}</h3>
              <span class="text-sm text-gray-600">PowerPoint Presentation</span>
            </div>
            <div class="flex flex-col items-center justify-center min-h-[500px] p-8">
              <Presentation className="h-24 w-24 text-orange-500 mb-6" />
              <p class="text-lg text-gray-700 mb-4 text-center">${escapeHTML(document.name)}</p>
              <p class="text-gray-500 mb-6 text-center max-w-md">
                This PowerPoint file is stored locally. To view it, please download the file and open it in Microsoft PowerPoint or Google Slides.
              </p>
              <div class="flex gap-4">
                <a 
                  href="${blobUrl}" 
                  download="${document.name}"
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Download PowerPoint
                </a>
                <button
                  onClick={() => window.open('https://docs.google.com/presentation', '_blank')}
                  class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Presentation className="h-5 w-5" />
                  Open in Google Slides
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-6">
                You can upload this file to Google Drive and open it with Google Slides for online viewing.
              </p>
            </div>
          </div>
        `;
      } 
      // For server-hosted files (with URL)
      else {
        // Use Google Docs Viewer for server-hosted PowerPoint files
        const encodedUrl = encodeURIComponent(documentUrl);
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
        
        return `
          <div class="pptx-viewer">
            <div class="mb-4 p-4 bg-gray-50 border-b flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Presentation className="h-5 w-5 text-orange-500" />
                <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(document.name)}</h3>
              </div>
              <a 
                href="${documentUrl}" 
                download="${document.name}"
                class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Download Original
              </a>
            </div>
            <div class="w-full h-[700px] bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src="${googleViewerUrl}"
                class="w-full h-full border-0"
                title="${escapeHTML(document.name)}"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"
              />
            </div>
            <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>Preview provided by Google Docs Viewer. If the preview doesn't load, </span>
              <a href="${documentUrl}" download="${document.name}" class="text-blue-800 hover:underline font-medium">
                download the file
              </a>
              <span>to view it in PowerPoint.</span>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error creating PowerPoint view:', error);
      
      // Ultimate fallback - just show download option
      const documentUrl = documentUrls[document.id] || document.url;
      return `
        <div class="pptx-viewer">
          <div class="mb-4 p-4 bg-gray-50 border-b">
            <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(document.name)}</h3>
          </div>
          <div class="flex flex-col items-center justify-center min-h-[400px] p-8">
            <Presentation className="h-20 w-20 text-orange-500 mb-4" />
            <p class="text-gray-600 mb-6 text-center">Unable to preview this PowerPoint file</p>
            <a 
              href="${documentUrl}" 
              download="${document.name}"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download PowerPoint
            </a>
          </div>
        </div>
      `;
    }
  };

  // Convert Excel to HTML table
  const convertExcelToHTML = async (document: Document): Promise<string> => {
    return new Promise((resolve, reject) => {
      const documentUrl = documentUrls[document.id] || document.url;
      
      fetch(documentUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch Excel file: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => {
          // Parse Excel file
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          // Generate HTML for all sheets
          let html = `
            <div class="excel-viewer">
              <div class="mb-4 p-4 bg-gray-50 border-b flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(document.name)}</h3>
                </div>
                <span class="text-sm text-gray-600">Sheets: ${workbook.SheetNames.length}</span>
              </div>
              <div class="excel-tabs mb-4 flex flex-wrap gap-2 border-b px-4">
          `;
          
          // Create tabs for each sheet
          workbook.SheetNames.forEach((sheetName, index) => {
            const safeSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '_');
            html += `
              <button 
                class="excel-tab px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${index === 0 ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}" 
                data-sheet="${escapeHTML(sheetName)}"
                onclick="(function() {
                  const tabs = this.parentElement.querySelectorAll('.excel-tab');
                  tabs.forEach(t => {
                    t.classList.remove('bg-blue-50', 'text-blue-600', 'border-b-2', 'border-blue-600');
                    t.classList.add('text-gray-600');
                  });
                  this.classList.add('bg-blue-50', 'text-blue-600', 'border-b-2', 'border-blue-600');
                  document.querySelectorAll('.excel-sheet').forEach(s => s.style.display = 'none');
                  document.getElementById('excel-sheet-${safeSheetName}').style.display = 'block';
                }).bind(this)"
              >
                ${escapeHTML(sheetName)}
              </button>
            `;
          });
          
          html += '</div><div class="excel-sheets px-4 pb-4">';
          
          // Create content for each sheet
          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            const safeSheetId = `excel-sheet-${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            // Convert sheet to HTML
            let sheetHtml = XLSX.utils.sheet_to_html(worksheet, {
              id: safeSheetId,
              editable: false,
              header: '',
              footer: ''
            });
            
            // Clean up the generated HTML and add styling
            sheetHtml = sheetHtml
              .replace(/<table/, '<table class="min-w-full divide-y divide-gray-200 border border-gray-200"')
              .replace(/<tr>/g, '<tr class="hover:bg-gray-50">')
              .replace(/<td /g, '<td class="px-6 py-4 text-sm text-gray-500 border-b" ')
              .replace(/<th /g, '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-50" ');
            
            html += `
              <div id="${safeSheetId}" class="excel-sheet overflow-x-auto" ${index !== 0 ? 'style="display: none;"' : ''}>
                ${sheetHtml}
              </div>
            `;
          });
          
          html += '</div></div>';
          resolve(html);
        })
        .catch(reject);
    });
  };

  // Convert CSV to HTML table
  const convertCSVToHTML = async (document: Document): Promise<string> => {
    return new Promise((resolve, reject) => {
      const documentUrl = documentUrls[document.id] || document.url;
      
      fetch(documentUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
          }
          return response.text();
        })
        .then(csvString => {
          Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const html = generateCSVHTML(results.data, results.meta.fields, document.name);
              resolve(html);
            },
            error: (error) => {
              reject(error);
            }
          });
        })
        .catch(reject);
    });
  };

  const generateCSVHTML = (data: any[], fields: string[] | undefined, fileName: string): string => {
    if (!data || data.length === 0) {
      return '<p class="text-gray-500 p-8 text-center">No data available in CSV</p>';
    }

    const headers = fields || (data.length > 0 ? Object.keys(data[0]) : []);
    const totalRows = data.length;
    const displayRows = data.slice(0, 1000);

    let html = `
      <div class="csv-viewer">
        <div class="mb-4 p-4 bg-gray-50 border-b flex items-center justify-between">
          <div class="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-yellow-600" />
            <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(fileName)}</h3>
          </div>
          <span class="text-sm text-gray-600">Total rows: ${totalRows}</span>
        </div>
        <div class="overflow-x-auto px-4 pb-4">
          <table class="min-w-full divide-y divide-gray-200 border border-gray-200">
    `;
    
    // Table Header
    html += '<thead class="bg-gray-50">';
    html += '<tr>';
    headers.forEach(header => {
      html += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">${escapeHTML(header)}</th>`;
    });
    html += '</tr>';
    html += '</thead>';
    
    // Table Body
    html += '<tbody class="bg-white divide-y divide-gray-200">';
    displayRows.forEach((row) => {
      html += '<tr class="hover:bg-gray-50">';
      headers.forEach(header => {
        const value = row[header] || '';
        html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">${escapeHTML(String(value))}</td>`;
      });
      html += '</tr>';
    });
    
    if (totalRows > 1000) {
      html += `<tr><td colspan="${headers.length}" class="px-6 py-4 text-sm text-gray-500 italic bg-gray-50">
        Showing first 1000 of ${totalRows} rows. Download the file to see all data.
      </td></tr>`;
    }
    
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    html += '</div>';
    
    return html;
  };

  // Convert Word document to HTML using Mammoth
  const convertWordToHTML = async (document: Document): Promise<string> => {
    return new Promise((resolve, reject) => {
      import('mammoth').then(mammoth => {
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
                    <div class="mb-4 p-4 bg-gray-50 border-b flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(document.name)}</h3>
                    </div>
                    <div class="word-content prose max-w-none p-6">
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
    const processedIds = new Set<string>();
    
    const processDocuments = async () => {
      for (const doc of documents) {
        // Skip if already processed
        if (processedIds.has(doc.id)) continue;
        processedIds.add(doc.id);
        
        // Create object URL if file exists
        if (doc.file && !documentUrls[doc.id]) {
          newUrls[doc.id] = URL.createObjectURL(doc.file);
        }
        
        // Set loading state
        setLoadingStates(prev => ({ ...prev, [doc.id]: true }));
        
        try {
          // Word documents
          if (doc.type === 'docx' || doc.type === 'doc') {
            console.log('Processing Word document:', doc.name);
            const htmlContent = await convertWordToHTML(doc);
            setDocxContent(prev => ({
              ...prev,
              [doc.id]: htmlContent
            }));
          }
          
          // CSV files
          else if (doc.type === 'csv') {
            console.log('Processing CSV file:', doc.name);
            const htmlContent = await convertCSVToHTML(doc);
            setCsvContent(prev => ({
              ...prev,
              [doc.id]: htmlContent
            }));
          }
          
          // Excel files
          else if (doc.type === 'xls' || doc.type === 'xlsx') {
            console.log('Processing Excel file:', doc.name);
            const htmlContent = await convertExcelToHTML(doc);
            setExcelContent(prev => ({
              ...prev,
              [doc.id]: htmlContent
            }));
          }
          
          // PowerPoint files
          else if (doc.type === 'ppt' || doc.type === 'pptx') {
            console.log('Processing PowerPoint file:', doc.name);
            const htmlContent = await convertPowerPointToViewable(doc);
            setPptContent(prev => ({
              ...prev,
              [doc.id]: htmlContent
            }));
          }
          
        } catch (error) {
          console.error(`Error processing ${doc.type} document:`, error);
          
          // Handle errors gracefully
          if (doc.type === 'ppt' || doc.type === 'pptx') {
            const documentUrl = documentUrls[doc.id] || doc.url;
            const errorHtml = `
              <div class="pptx-viewer">
                <div class="mb-4 p-4 bg-red-50 border-b border-red-200">
                  <h3 class="text-lg font-semibold text-red-800">${escapeHTML(doc.name)}</h3>
                </div>
                <div class="flex flex-col items-center justify-center min-h-[400px] p-8">
                  <Presentation className="h-20 w-20 text-red-400 mb-4" />
                  <p class="text-red-600 mb-4">Error loading PowerPoint preview</p>
                  <a 
                    href="${documentUrl}" 
                    download="${doc.name}"
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download PowerPoint
                  </a>
                </div>
              </div>
            `;
            setPptContent(prev => ({ ...prev, [doc.id]: errorHtml }));
          }
        } finally {
          setLoadingStates(prev => ({ ...prev, [doc.id]: false }));
        }
      }

      // Update URLs after processing all documents
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

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, documents.length]);

  const goToPreviousDocument = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      isProgrammaticScroll.current = true;
      onPageChange(newPage);
      scrollToDocument(newPage);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  };

  const goToNextDocument = () => {
    if (currentPage < documents.length - 1) {
      const newPage = currentPage + 1;
      isProgrammaticScroll.current = true;
      onPageChange(newPage);
      scrollToDocument(newPage);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  };

  const scrollToDocument = useCallback((pageIndex: number) => {
    if (scrollContainerRef.current && documentRefs.current[pageIndex]) {
      const documentElement = documentRefs.current[pageIndex];
      if (documentElement) {
        setTimeout(() => {
          documentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }, 100);
      }
    }
  }, []);

  // Handle scroll events with debounce
  const handleScroll = useCallback(() => {
    if (documents.length === 0 || !scrollContainerRef.current || isProgrammaticScroll.current) return;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const viewportHeight = container.clientHeight;
      
      let closestDocumentIndex = 0;
      let smallestDistance = Infinity;
      
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
      
      if (closestDocumentIndex !== currentPage && !isProgrammaticScroll.current) {
        onPageChange(closestDocumentIndex);
      }
    }, 150);
  }, [documents.length, currentPage, onPageChange]);

  // Scroll to current document when it changes
  useEffect(() => {
    if (currentPage >= 0 && currentPage < documents.length) {
      isProgrammaticScroll.current = true;
      scrollToDocument(currentPage);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  }, [currentPage, documents.length, scrollToDocument]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  // Initialize document refs
  useEffect(() => {
    documentRefs.current = documentRefs.current.slice(0, documents.length);
  }, [documents.length]);

  // Get file icon based on type
  const getFileIcon = (type: string, className: string = "h-5 w-5") => {
    const fileType = type.toLowerCase();
    if (fileType.includes('pdf')) return <FileText className={`${className} text-red-500`} />;
    if (fileType.includes('doc')) return <FileText className={`${className} text-blue-500`} />;
    if (fileType.includes('image')) return <Image className={`${className} text-green-500`} />;
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) return <FileSpreadsheet className={`${className} text-green-600`} />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return <Presentation className={`${className} text-orange-500`} />;
    if (fileType.includes('csv')) return <FileSpreadsheet className={`${className} text-yellow-600`} />;
    if (fileType.includes('text') || fileType.includes('txt')) return <FileType className={`${className} text-gray-500`} />;
    return <File className={`${className} text-gray-500`} />;
  };

  // Render document content based on type
  const renderDocumentContent = (document: Document, documentIndex: number) => {
    const isLoading = loadingStates[document.id];

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      );
    }

    // PDF files
    if (document.type === 'pdf') {
      const documentUrl = documentUrls[document.id] || document.url;
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

    // PowerPoint files
    if (document.type === 'ppt' || document.type === 'pptx') {
      if (pptContent[document.id]) {
        return (
          <div 
            className="pptx-container bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            dangerouslySetInnerHTML={{ __html: pptContent[document.id] }}
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading PowerPoint preview...</p>
        </div>
      );
    }

    // Word documents
    if (document.type === 'docx' || document.type === 'doc') {
      if (docxContent[document.id]) {
        return (
          <div 
            className="word-document-container bg-white rounded-lg border border-gray-200 shadow-sm max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: docxContent[document.id] }}
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading Word document...</p>
        </div>
      );
    }

    // CSV files
    if (document.type === 'csv') {
      if (csvContent[document.id]) {
        return (
          <div 
            className="csv-container bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            dangerouslySetInnerHTML={{ __html: csvContent[document.id] }}
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading CSV data...</p>
        </div>
      );
    }

    // Excel files
    if (document.type === 'xls' || document.type === 'xlsx') {
      if (excelContent[document.id]) {
        return (
          <div 
            className="excel-container bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            dangerouslySetInnerHTML={{ __html: excelContent[document.id] }}
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading Excel data...</p>
        </div>
      );
    }

    // Image files
    if (document.type === 'image') {
      const documentUrl = documentUrls[document.id] || document.url;
      return (
        <div className="flex items-center justify-center h-full p-6">
          <img 
            src={documentUrl} 
            alt={document.name}
            className="max-w-full max-h-[800px] object-contain rounded-lg shadow-lg"
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
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-gray-50 p-4 rounded border overflow-auto max-h-[700px]">
              {document.content}
            </pre>
          </div>
        </div>
      );
    }

    // Unknown file types
    const documentUrl = documentUrls[document.id] || document.url;
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-6">
        <div className="text-center mb-6">
          {getFileIcon('unknown', "h-16 w-16 mx-auto mb-4")}
          <p className="text-lg font-semibold text-gray-800">{document.name}</p>
          <p className="text-gray-600 mt-2">Type: {document.type.toUpperCase()}</p>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-800 text-sm mb-4">
              This file type cannot be previewed in the browser.
            </p>
            <a 
              href={documentUrl} 
              download={document.name}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Add CSS for document styling
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
      .csv-viewer, .excel-viewer, .pptx-viewer {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .csv-viewer table, .excel-viewer table {
        border-collapse: collapse;
        width: 100%;
      }
      .csv-viewer th, .excel-viewer th {
        position: sticky;
        top: 0;
        background-color: #f9fafb;
        z-index: 10;
      }
      .excel-tabs {
        border-bottom: 1px solid #e5e7eb;
      }
      .excel-tab {
        transition: all 0.2s;
        cursor: pointer;
      }
      .excel-tab:hover {
        background-color: #f3f4f6;
      }
      .excel-sheet {
        overflow-x: auto;
      }
      .pptx-viewer iframe {
        min-height: 600px;
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
          <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">No documents uploaded</p>
          <p className="text-sm text-gray-400">Upload a document to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Static Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={goToPreviousDocument}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>←</span> Previous
          </button>
          
          <div className="text-center">
            <span className="text-gray-600 font-medium">
              Document {currentPage + 1} of {documents.length}
            </span>
            <p className="text-sm text-gray-500 mt-1 max-w-md truncate">
              {currentDocument?.name}
            </p>
          </div>
          
          <button
            onClick={goToNextDocument}
            disabled={currentPage >= documents.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Next <span>→</span>
          </button>
        </div>
      </div>

      {/* Scrollable Document Area */}
      <div className="flex-1 bg-gray-100 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <div className="py-8 px-8 space-y-8">
            {documents.map((document, index) => (
              <div 
                key={document.id}
                ref={el => {
                  documentRefs.current[index] = el;
                }}
                data-document-index={index}
                className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px] transition-all duration-300 hover:shadow-xl"
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

const escapeHTML = (str: string): string => {
  return String(str).replace(/[&<>"]/g, function(match) {
    if (match === '&') return '&amp;';
    if (match === '<') return '&lt;';
    if (match === '>') return '&gt;';
    if (match === '"') return '&quot;';
    return match;
  });
};
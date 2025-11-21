"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  Eye,
  Table,
  Presentation
} from 'lucide-react';

interface AgendaDocument {
  id: string;
  agenda_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  metadata: any;
}

interface Agenda {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  documents?: AgendaDocument[];
  presenter?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AgendaDocumentViewerProps {
  agenda: Agenda[];
  selectedAgenda: Agenda | null;
  onAgendaChange: (agenda: Agenda) => void;
}

const AgendaDocumentViewer: React.FC<AgendaDocumentViewerProps> = ({
  agenda,
  selectedAgenda,
  onAgendaChange
}) => {
  const [combinedContent, setCombinedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Get all documents from all agenda items, sorted by agenda order
  const allDocuments = agenda.flatMap(agendaItem => 
    (agendaItem.documents || []).map(doc => ({
      ...doc,
      agenda_name: agendaItem.name,
      agenda_sort_order: agendaItem.sort_order,
      presenter: agendaItem.presenter
    }))
  ).sort((a, b) => {
    // Sort by agenda order first, then by document upload time
    if (a.agenda_sort_order !== b.agenda_sort_order) {
      return a.agenda_sort_order - b.agenda_sort_order;
    }
    return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
  });

  // Convert all documents to HTML and combine them
  const processAllDocuments = useCallback(async () => {
    if (allDocuments.length === 0) {
      setCombinedContent('');
      setTotalPages(0);
      setCurrentPage(0);
      return;
    }

    setIsLoading(true);
    try {
      let fullHTML = '';
      let pageCount = 0;

      for (const doc of allDocuments) {
        try {
          const htmlContent = await convertToHTML(doc);
          
          // Add agenda header for the first document of each agenda
          const isFirstDocInAgenda = allDocuments.findIndex(d => d.agenda_id === doc.agenda_id) === allDocuments.indexOf(doc);
          if (isFirstDocInAgenda) {
            fullHTML += `
              <div class="agenda-header" style="page-break-before: always; margin-bottom: 2rem;">
                <h2 class="agenda-title" style="color: #1f2937; font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                  ${doc.agenda_name}
                </h2>
                ${doc.presenter ? `
                  <div class="presenter-info" style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
                    Presented by: <strong>${doc.presenter.name}</strong>
                    ${doc.presenter.role ? ` • ${doc.presenter.role}` : ''}
                  </div>
                ` : ''}
                <hr style="border-color: #e5e7eb; margin: 1rem 0;" />
              </div>
            `;
          }

          fullHTML += `
            <div class="document-content" data-document-id="${doc.id}">
              ${htmlContent}
            </div>
            <div style="page-break-after: always;"></div>
          `;

          pageCount += await estimatePageCount(htmlContent);
        } catch (error) {
          console.error(`Failed to process document ${doc.name}:`, error);
          fullHTML += `
            <div class="document-error" style="padding: 2rem; text-align: center; color: #6b7280;">
              <div style="margin-bottom: 1rem;">⚠️</div>
              <p>Unable to display: ${doc.name}</p>
              <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                <a href="${doc.file_url}" download class="download-link" style="color: #3b82f6; text-decoration: underline;">
                  Download original file
                </a>
              </p>
            </div>
            <div style="page-break-after: always;"></div>
          `;
          pageCount += 1;
        }
      }

      setCombinedContent(fullHTML);
      setTotalPages(Math.max(1, pageCount));
      setCurrentPage(0);
    } catch (error) {
      console.error('Error processing documents:', error);
      setCombinedContent(`
        <div style="padding: 3rem; text-align: center; color: #6b7280;">
          <div style="margin-bottom: 1rem;">❌</div>
          <p>Failed to load documents</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Please try again later</p>
        </div>
      `);
    } finally {
      setIsLoading(false);
    }
  }, [allDocuments]);

  useEffect(() => {
    processAllDocuments();
  }, [processAllDocuments]);

  const estimatePageCount = async (htmlContent: string): Promise<number> => {
    // Simple estimation based on content length
    const wordCount = htmlContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 500)); // ~500 words per page
  };

  const convertToHTML = async (doc: AgendaDocument & { agenda_name: string; presenter?: any }): Promise<string> => {
    const fileExtension = doc.name.split('.').pop()?.toLowerCase() || '';
    
    // For images - display directly
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
      return `
        <div class="image-container" style="text-align: center; margin: 2rem 0;">
          <img 
            src="${doc.file_url}" 
            alt="${doc.name}" 
            style="max-width: 100%; height: auto; max-height: 70vh; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
            loading="lazy"
          />
          <div style="margin-top: 0.5rem; color: #6b7280; font-size: 0.875rem;">
            ${doc.name}
          </div>
        </div>
      `;
    }

    // For PDF files - use PDF.js for better rendering
    if (fileExtension === 'pdf') {
      return await convertPDFToHTML(doc);
    }

    // For Word documents - use Mammoth.js
    if (['doc', 'docx'].includes(fileExtension)) {
      return await convertWordToHTML(doc);
    }

    // For Excel files - use SheetJS
    if (['xls', 'xlsx', 'csv'].includes(fileExtension)) {
      return await convertExcelToHTML(doc);
    }

    // For PowerPoint files - use preview approach
    if (['ppt', 'pptx'].includes(fileExtension)) {
      return await convertPowerPointToHTML(doc);
    }

    // For text files
    if (['txt', 'md'].includes(fileExtension)) {
      try {
        const response = await fetch(doc.file_url);
        const text = await response.text();
        return `
          <div class="text-document" style="font-family: 'Courier New', monospace; white-space: pre-wrap; background: #f8f9fa; padding: 2rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <h4 style="margin-top: 0; color: #374151;">${doc.name}</h4>
            <hr style="margin: 1rem 0; border-color: #e5e7eb;">
            ${text}
          </div>
        `;
      } catch (error) {
        throw new Error('Failed to read text file');
      }
    }

    // For unsupported formats, show download link
    return `
      <div class="unsupported-format" style="text-align: center; padding: 3rem; color: #6b7280;">
        <div style="margin-bottom: 1rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        </div>
        <h4 style="margin-bottom: 0.5rem; color: #374151;">${doc.name}</h4>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Format: ${fileExtension.toUpperCase()}</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem; color: #9ca3af;">
          This file format cannot be previewed in the browser
        </p>
        <a 
          href="${doc.file_url}" 
          download 
          class="download-button"
          style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='#2563eb'"
          onmouseout="this.style.backgroundColor='#3b82f6'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download File
        </a>
      </div>
    `;
  };

  // Convert PDF to HTML using PDF.js
  const convertPDFToHTML = async (doc: AgendaDocument): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Dynamically import PDF.js
      import('pdfjs-dist').then(pdfjsLib => {
        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument(doc.file_url);
        loadingTask.promise.then((pdf: any) => {
          let htmlContent = `
            <div class="pdf-document" style="text-align: center;">
              <h4 style="color: #374151; margin-bottom: 1rem;">${doc.name}</h4>
              <div class="pdf-pages" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          `;

          // Only render first 5 pages for performance
          const pageCount = Math.min(pdf.numPages, 5);
          const pagePromises = [];

          for (let i = 1; i <= pageCount; i++) {
            pagePromises.push(
              pdf.getPage(i).then((page: any) => {
                const viewport = page.getViewport({ scale: 1.0 });
                // Use the browser's document object here
                const canvas = global.document?.createElement('canvas');
                if (!canvas) {
                  return `<div>Canvas not available</div>`;
                }
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };

                return page.render(renderContext).promise.then(() => {
                  return `
                    <div class="pdf-page" style="margin-bottom: 2rem;">
                      <div class="page-number" style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">
                        Page ${i} of ${pdf.numPages}
                      </div>
                      <img 
                        src="${canvas.toDataURL()}" 
                        alt="Page ${i}" 
                        style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
                      />
                    </div>
                  `;
                });
              })
            );
          }

          Promise.all(pagePromises).then(pages => {
            htmlContent += pages.join('');
            htmlContent += `
                </div>
                ${pageCount < pdf.numPages ? `
                  <div style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; color: #6b7280;">
                    <p style="margin: 0; font-size: 0.875rem;">
                      Showing first ${pageCount} pages. 
                      <a href="${doc.file_url}" download style="color: #3b82f6; text-decoration: underline;">
                        Download full PDF
                      </a>
                      to view all ${pdf.numPages} pages.
                    </p>
                  </div>
                ` : ''}
              </div>
            `;
            resolve(htmlContent);
          });
        }).catch(reject);
      }).catch(reject);
    });
  };

  // Convert Word documents to HTML using Mammoth.js
  const convertWordToHTML = async (doc: AgendaDocument): Promise<string> => {
    return new Promise((resolve, reject) => {
      import('mammoth').then(mammoth => {
        fetch(doc.file_url)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            mammoth.convertToHtml({ arrayBuffer })
              .then((result: any) => {
                const styledContent = `
                  <div class="word-document" style="font-family: 'Times New Roman', serif; line-height: 1.6; color: #374151; max-width: 100%;">
                    <h4 style="color: #1f2937; margin-bottom: 1rem;">${doc.name}</h4>
                    <hr style="margin: 1rem 0; border-color: #e5e7eb;">
                    ${result.value}
                  </div>
                `;
                resolve(styledContent);
              })
              .catch(reject);
          })
          .catch(reject);
      }).catch(reject);
    });
  };

  // Convert Excel files to HTML using SheetJS
  const convertExcelToHTML = async (doc: AgendaDocument): Promise<string> => {
    return new Promise((resolve, reject) => {
      import('xlsx').then(XLSX => {
        fetch(doc.file_url)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            try {
              const workbook = XLSX.read(arrayBuffer, { type: 'array' });
              let htmlContent = `
                <div class="excel-document" style="max-width: 100%; overflow-x: auto;">
                  <h4 style="color: #1f2937; margin-bottom: 1rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 0.5rem;">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    ${doc.name}
                  </h4>
                  <div style="margin-bottom: 1rem; color: #6b7280; font-size: 0.875rem;">
                    Workbook: ${workbook.SheetNames.length} sheet(s)
                  </div>
              `;

              // Process first 3 sheets for performance
              workbook.SheetNames.slice(0, 3).forEach((sheetName, index) => {
                const worksheet = workbook.Sheets[sheetName];
                const html = XLSX.utils.sheet_to_html(worksheet, {
                  id: `sheet-${index}`,
                  editable: false,
                  header: ''
                });

                htmlContent += `
                  <div class="excel-sheet" style="margin-bottom: 2rem;">
                    <h5 style="color: #374151; margin-bottom: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem;">
                      Sheet: ${sheetName}
                    </h5>
                    <div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; overflow: hidden;">
                      ${html}
                    </div>
                  </div>
                `;
              });

              if (workbook.SheetNames.length > 3) {
                htmlContent += `
                  <div style="padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; color: #6b7280; text-align: center;">
                    <p style="margin: 0; font-size: 0.875rem;">
                      Showing first 3 sheets. 
                      <a href="${doc.file_url}" download style="color: #3b82f6; text-decoration: underline;">
                        Download full Excel file
                      </a>
                      to view all ${workbook.SheetNames.length} sheets.
                    </p>
                  </div>
                `;
              }

              htmlContent += `</div>`;
              resolve(htmlContent);
            } catch (error) {
              reject(error);
            }
          })
          .catch(reject);
      }).catch(reject);
    });
  };

  // Convert PowerPoint files to HTML using preview approach
  const convertPowerPointToHTML = async (doc: AgendaDocument): Promise<string> => {
    return `
      <div class="powerpoint-document" style="text-align: center; padding: 2rem;">
        <div style="margin-bottom: 1rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#6b7280">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="8" y1="3" x2="8" y2="21" />
            <line x1="16" y1="3" x2="16" y2="21" />
            <line x1="3" y1="8" x2="21" y2="8" />
            <line x1="3" y1="16" x2="21" y2="16" />
          </svg>
        </div>
        <h4 style="color: #1f2937; margin-bottom: 0.5rem;">${doc.name}</h4>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          PowerPoint Presentation
        </p>
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
          <p style="margin: 0; color: #374151; font-size: 0.875rem;">
            For the best viewing experience, please download and open this presentation in Microsoft PowerPoint or use the online Office 365 viewer.
          </p>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a 
            href="${doc.file_url}" 
            download 
            style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#2563eb'"
            onmouseout="this.style.backgroundColor='#3b82f6'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PowerPoint
          </a>
          <a 
            href="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc.file_url)}" 
            target="_blank"
            rel="noopener noreferrer"
            style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#059669'"
            onmouseout="this.style.backgroundColor='#10b981'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View Online
          </a>
        </div>
      </div>
    `;
  };

  const handleDownloadAll = () => {
    // Create a zip of all documents or download individually
    allDocuments.forEach(doc => {
      const link = global.document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.name;
      global.document.body.appendChild(link);
      link.click();
      global.document.body.removeChild(link);
    });
  };

  const navigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (!agenda || agenda.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No agenda items</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add agenda items to see documents here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Meeting Documents
        </h3>
        {allDocuments.length > 0 && (
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
        )}
      </div>

      {/* Document Stats */}
      {allDocuments.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{allDocuments.length}</strong> documents across <strong>{agenda.length}</strong> agenda items
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Page {currentPage + 1} of {totalPages}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Processing documents...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This may take a moment for large files
              </p>
            </div>
          </div>
        ) : combinedContent ? (
          <>
            {/* Navigation Arrows */}
            {totalPages > 1 && (
              <>
                <button
                  onClick={() => navigatePage('prev')}
                  disabled={currentPage === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed z-10 transition-colors"
                >
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => navigatePage('next')}
                  disabled={currentPage === totalPages - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed z-10 transition-colors"
                >
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}

            {/* Document Content */}
            <div 
              className="h-full overflow-y-auto p-6 document-viewer"
              dangerouslySetInnerHTML={{ __html: combinedContent }}
              style={{
                transform: `translateY(-${currentPage * 100}vh)`,
                transition: 'transform 0.3s ease'
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No documents available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Documents will appear here once added to agenda items
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <button
            onClick={() => navigatePage('prev')}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            Previous
          </button>
          
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button
            onClick={() => navigatePage('next')}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Next
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <style jsx global>{`
        .document-viewer {
          height: 100vh;
          scroll-snap-type: y mandatory;
        }
        
        .document-viewer > * {
          scroll-snap-align: start;
          min-height: 100vh;
          padding: 2rem;
        }
        
        .agenda-header {
          padding-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .agenda-title {
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .presenter-info {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        /* Word Document Styles */
        .word-document {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #374151;
        }
        
        .word-document h1, 
        .word-document h2, 
        .word-document h3 {
          margin: 1.5rem 0 1rem 0;
          color: #111827;
        }
        
        .word-document p {
          margin: 1rem 0;
        }
        
        .word-document table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        .word-document table, 
        .word-document th, 
        .word-document td {
          border: 1px solid #d1d5db;
        }
        
        .word-document th, 
        .word-document td {
          padding: 0.5rem;
          text-align: left;
        }
        
        /* Excel Document Styles */
        .excel-document table {
          border-collapse: collapse;
          width: 100%;
          font-size: 0.875rem;
        }
        
        .excel-document td {
          border: 1px solid #d1d5db;
          padding: 0.25rem 0.5rem;
          min-width: 80px;
        }
        
        .excel-document tr:first-child {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        
        .excel-document tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        /* Dark mode styles */
        .dark .word-document {
          color: #d1d5db;
        }
        
        .dark .word-document h1,
        .dark .word-document h2,
        .dark .word-document h3 {
          color: #f9fafb;
        }
        
        .dark .excel-document td {
          border-color: #4b5563;
          color: #d1d5db;
        }
        
        .dark .excel-document tr:first-child {
          background-color: #374151;
        }
        
        .dark .excel-document tr:nth-child(even) {
          background-color: #1f2937;
        }
        
        .download-link {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .download-link:hover {
          color: #2563eb;
        }
        
        .dark .download-link {
          color: #60a5fa;
        }
        
        .dark .download-link:hover {
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default AgendaDocumentViewer;
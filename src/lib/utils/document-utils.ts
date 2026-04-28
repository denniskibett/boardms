// src/lib/utils/document-utils.ts
export async function convertDocumentToHTML(file: File, type: string): Promise<string> {
  if (type === 'docx' || type === 'doc') {
    return await convertWordToHTML(file);
  } else if (type === 'csv') {
    return await convertCSVToHTML(file);
  } else if (type === 'xls' || type === 'xlsx') {
    return await convertExcelToHTML(file);
  } else if (type === 'ppt' || type === 'pptx') {
    return await convertPowerPointToHTML(file);
  }
  return '';
}

async function convertWordToHTML(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return `
    <div class="word-document">
      <div class="mb-4 p-4 bg-gray-50 border-b">
        <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(file.name)}</h3>
      </div>
      <div class="word-content prose max-w-none p-6">
        ${result.value}
      </div>
    </div>
  `;
}

async function convertCSVToHTML(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvString = e.target?.result as string;
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const html = generateCSVHTML(results.data, results.meta.fields, file.name);
          resolve(html);
        },
        error: reject
      });
    };
    reader.readAsText(file);
  });
}

// ... similar functions for Excel and PowerPoint
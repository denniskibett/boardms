import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let inputPath = '';
  let outputPath = '';
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create temporary file paths
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const inputPath = join(tempDir, `input_${timestamp}_${file.name}`);
    const outputPath = join(tempDir, `output_${timestamp}.pdf`);
    
    // Write file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(inputPath, buffer);
    
    // Convert using LibreOffice (headless)
    // You need to have LibreOffice installed on your server
    await execAsync(`soffice --headless --convert-to pdf --outdir ${tempDir} ${inputPath}`);
    
    // Read the converted PDF
    const pdfBuffer = await require('fs').promises.readFile(outputPath);
    
    // Clean up temp files
    await unlink(inputPath).catch(console.error);
    await unlink(outputPath).catch(console.error);
    
    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up temp files if they exist
    if (inputPath) await unlink(inputPath).catch(console.error);
    if (outputPath) await unlink(outputPath).catch(console.error);
    
    return NextResponse.json(
      { error: 'Failed to convert PowerPoint to PDF' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
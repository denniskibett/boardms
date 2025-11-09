import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agendaId = formData.get('agendaId') as string;
    const name = formData.get('name') as string;

    if (!file || !agendaId) {
      return NextResponse.json(
        { error: 'File and agenda ID are required' },
        { status: 400 }
      );
    }

    // Verify agenda exists
    const agenda = await query(
      'SELECT id FROM agenda WHERE id = $1',
      [agendaId]
    );

    if (agenda.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agenda not found' },
        { status: 404 }
      );
    }

    // Get file extension and type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${safeFileName}`;
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'agenda_documents');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log('Directory already exists or cannot be created');
    }

    const filePath = join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database - FIXED: name is stored as string
    const document = await query(
      `
      INSERT INTO agenda_documents (
        agenda_id,
        name,
        file_type,
        file_url,
        file_size,
        uploaded_by,
        uploaded_at,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING *
      `,
      [
        agendaId,
        name || file.name, // Store as string
        fileType,
        `/uploads/agenda_documents/${filename}`,
        buffer.length,
        'system', // TODO: Replace with actual user ID from auth
        { originalName: file.name, uploadedAt: new Date().toISOString() }
      ]
    );

    return NextResponse.json(document.rows[0]);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agendaId = searchParams.get('agendaId');

    if (!agendaId) {
      return NextResponse.json(
        { error: 'Agenda ID is required' },
        { status: 400 }
      );
    }

    const documents = await query(
      `
      SELECT 
        id,
        agenda_id,
        name,
        file_type,
        file_url,
        file_size,
        uploaded_by,
        uploaded_at,
        metadata
      FROM agenda_documents 
      WHERE agenda_id = $1
      ORDER BY uploaded_at DESC
      `,
      [agendaId]
    );

    return NextResponse.json(documents.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document first to delete the file
    const document = await query(
      'SELECT * FROM agenda_documents WHERE id = $1',
      [documentId]
    );

    if (document.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete the physical file
    try {
      const filePath = join(process.cwd(), 'public', document.rows[0].file_url);
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await query(
      'DELETE FROM agenda_documents WHERE id = $1',
      [documentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

function getFileType(extension: string | undefined): string {
  const typeMap: { [key: string]: string } = {
    'pdf': 'pdf',
    'doc': 'word',
    'docx': 'word',
    'ppt': 'powerpoint',
    'pptx': 'powerpoint',
    'xls': 'excel',
    'xlsx': 'excel',
    'txt': 'text',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
  };
  return typeMap[extension || ''] || 'other';
}
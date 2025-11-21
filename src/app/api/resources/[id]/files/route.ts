// app/api/resources/[id]/files/route.ts - UPDATED FOR NEXT.JS 14
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define session and user types
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Session {
  user: User;
} 

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ministryId = formData.get('ministryId') as string;
    const displayName = formData.get('displayName') as string;

    console.log('📁 Upload request for resource:', {
      resourceId,
      fileName: file?.name,
      fileSize: file?.size,
      ministryId,
      displayName
    });

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify resource exists and get its details
    const resource = await query(
      `SELECT r.*, c.name as resource_type 
       FROM resources r 
       LEFT JOIN categories c ON r.resource_type_id = c.id 
       WHERE r.id = $1`,
      [resourceId]
    );

    if (resource.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const resourceData = resource.rows[0];
    
    // Get ministry name if ministryId provided
    let ministryName = null;
    if (ministryId) {
      const ministry = await query(
        'SELECT name FROM ministries WHERE id = $1',
        [parseInt(ministryId)]
      );
      ministryName = ministry.rows[0]?.name;
    }

    // Generate filename according to convention
    const fileName = generateResourceFileName(
      file.name, 
      ministryName, 
      resourceData.year,
      resourceData.resource_type
    );

    // Create upload directory structure: resources/[resource_type]/[year]/[resource_name]/
    const uploadDir = join(
      process.cwd(), 
      'public', 
      'uploads',
      'resources',
      resourceData.resource_type,  // MEETINGS, DECISION_LETTERS, etc.
      resourceData.year.toString(), // 2025, 2024, etc.
      resourceData.name             // CABINET-MEETING-JANUARY-2025
    );

    console.log('📁 Creating upload directory:', uploadDir);
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = join(uploadDir, uniqueFileName);
    
    // Public URL follows the same structure
    const publicUrl = `/uploads/resources/${resourceData.resource_type}/${resourceData.year}/${resourceData.name}/${uniqueFileName}`;

    console.log('💾 Saving file:', {
      originalName: file.name,
      savedAs: uniqueFileName,
      fileName: fileName,
      filePath,
      publicUrl,
      folderStructure: `resources/${resourceData.resource_type}/${resourceData.year}/${resourceData.name}/`
    });

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to resource_files table
    const result = await query(
      `INSERT INTO resource_files 
       (resource_id, name, display_name, file_type, file_url, file_size, ministry_id, uploaded_by, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        resourceId,
        fileName, // "MINISTRY_OF_FINANCE_BUDGET_PROPOSAL.pdf"
        displayName || file.name, // "Budget Proposal"
        getFileType(fileExtension),
        publicUrl,
        file.size,
        ministryId ? parseInt(ministryId) : null,
        session.user.id,
        JSON.stringify({
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          mimeType: file.type,
          ministryName: ministryName,
          resourceType: resourceData.resource_type,
          year: resourceData.year,
          resourceName: resourceData.name,
          folderStructure: `resources/${resourceData.resource_type}/${resourceData.year}/${resourceData.name}/`,
          uniqueFileName: uniqueFileName
        })
      ]
    );

    const savedFile = result.rows[0];
    console.log('✅ File uploaded successfully:', {
      id: savedFile.id,
      name: savedFile.name,
      url: savedFile.file_url,
      folder: `resources/${resourceData.resource_type}/${resourceData.year}/${resourceData.name}/`
    });

    return NextResponse.json(savedFile);

  } catch (error: any) {
    console.error('❌ Error uploading resource file:', error);
    return NextResponse.json(
      { error: 'Failed to upload resource file', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);
    
    // Verify resource exists
    const resource = await query(
      'SELECT id, name FROM resources WHERE id = $1',
      [resourceId]
    );

    if (resource.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const files = await query(
      `SELECT 
        rf.*,
        m.name as ministry_name,
        u.name as uploaded_by_name,
        u.email as uploaded_by_email
       FROM resource_files rf
       LEFT JOIN ministries m ON rf.ministry_id = m.id
       LEFT JOIN users u ON rf.uploaded_by = u.id
       WHERE rf.resource_id = $1
       ORDER BY rf.uploaded_at DESC`,
      [resourceId]
    );

    console.log(`✅ Found ${files.rows.length} files for resource ${resourceId}`);
    return NextResponse.json(files.rows);
  } catch (error: any) {
    console.error('❌ Error fetching resource files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource files' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[id]/files - Update file metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);
    const body = await request.json();
    
    const { fileId, displayName, ministryId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify file exists and belongs to this resource
    const existingFile = await query(
      'SELECT id FROM resource_files WHERE id = $1 AND resource_id = $2',
      [fileId, resourceId]
    );

    if (existingFile.rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Update file metadata
    const result = await query(
      `UPDATE resource_files 
       SET display_name = $1, ministry_id = $2, updated_at = NOW()
       WHERE id = $3 AND resource_id = $4
       RETURNING *`,
      [
        displayName || null,
        ministryId ? parseInt(ministryId) : null,
        fileId,
        resourceId
      ]
    );

    const updatedFile = result.rows[0];
    console.log('✅ File metadata updated:', updatedFile.id);

    return NextResponse.json(updatedFile);

  } catch (error: any) {
    console.error('❌ Error updating file metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update file metadata', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id]/files - Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify file exists and belongs to this resource
    const existingFile = await query(
      'SELECT id, file_url FROM resource_files WHERE id = $1 AND resource_id = $2',
      [fileId, resourceId]
    );

    if (existingFile.rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileToDelete = existingFile.rows[0];

    // Delete file record from database
    await query(
      'DELETE FROM resource_files WHERE id = $1 AND resource_id = $2',
      [fileId, resourceId]
    );

    // TODO: Optionally delete the physical file from disk
    // This would require additional logic to handle file deletion

    console.log('🗑️ File deleted successfully:', fileId);
    return NextResponse.json({ success: true, deletedFileId: fileId });

  } catch (error: any) {
    console.error('❌ Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate standardized filenames
function generateResourceFileName(
  originalName: string, 
  ministryName: string | null, 
  year: number,
  resourceType: string
): string {
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(`.${extension}`, '');
  
  let fileName = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  
  if (ministryName) {
    const ministryPart = ministryName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    fileName = `${ministryPart}_${fileName}`;
  }
  
  return `${fileName}.${extension}`;
}

function getFileType(extension: string | undefined): string {
  const typeMap: { [key: string]: string } = {
    'pdf': 'pdf', 'doc': 'word', 'docx': 'word', 'ppt': 'powerpoint', 
    'pptx': 'powerpoint', 'xls': 'excel', 'xlsx': 'excel', 'txt': 'text',
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
    'zip': 'archive', 'rar': 'archive', '7z': 'archive'
  };
  return typeMap[extension?.toLowerCase() || ''] || 'other';
}
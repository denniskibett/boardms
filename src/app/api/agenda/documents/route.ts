import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { supabaseDb } from '@/lib/supabase-db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Helper function to get current user from session
async function getCurrentUser(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agendaId = formData.get('agendaId') as string;
    const name = formData.get('name') as string;

    console.log('📁 Upload request received:', { 
      agendaId, 
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      hasFile: !!file
    });

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!agendaId) {
      console.error('❌ No agenda ID provided');
      return NextResponse.json(
        { error: 'Agenda ID is required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const currentUser = await getCurrentUser(request);
    if (!currentUser?.id) {
      console.error('❌ No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('👤 Current user:', { id: currentUser.id, email: currentUser.email, name: currentUser.name });

    // Verify agenda exists using supabaseDb
    console.log('🔍 Verifying agenda exists:', agendaId);
    const agendaResult = await supabaseDb.select('agenda', {
      select: 'id',
      eq: {
        field: 'id',
        value: parseInt(agendaId)
      }
    });

    if (agendaResult.rows.length === 0) {
      console.error('❌ Agenda not found:', agendaId);
      return NextResponse.json(
        { error: 'Agenda not found' },
        { status: 404 }
      );
    }

    console.log('✅ Agenda verified');

    // Get file information
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const fileType = getFileType(fileExtension);
    const fileSize = file.size;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${randomString}-${safeFileName}`;
    
    // Create upload directory in public folder
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'agenda_documents');
    
    console.log('📁 Creating upload directory:', uploadDir);
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ Upload directory created');
    } catch (error: any) {
      console.log('📁 Directory already exists or creation failed:', error.message);
    }

    const filePath = join(uploadDir, filename);
    const publicUrl = `/uploads/agenda_documents/${filename}`;

    console.log('💾 Saving file:', {
      originalName: file.name,
      savedAs: filename,
      filePath,
      publicUrl,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)} MB`
    });

    // Convert file to buffer and save
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log('📦 File buffer created, size:', buffer.length);
      
      await writeFile(filePath, buffer);
      console.log('✅ File saved to disk successfully');
    } catch (fileError: any) {
      console.error('❌ Error saving file to disk:', fileError);
      return NextResponse.json(
        { 
          error: 'Failed to save file to disk',
          details: fileError.message 
        },
        { status: 500 }
      );
    }

    // Save to database using supabaseDb
    console.log('💾 Saving document to database...');
    try {
      // FIX: Handle UUID vs integer user ID
      // First, let's check the user ID type by trying to find the user
      let userId = currentUser.id;
      
      // If user ID is UUID, we need to get the numeric ID from users table
      const userResult = await supabaseDb.select('users', {
        select: 'id',
        eq: {
          field: 'email',
          value: currentUser.email || ''
        }
      });

      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        console.log('✅ Found user with numeric ID:', userId);
      } else {
        // Try using the UUID directly if your database supports it
        console.log('⚠️ Using UUID as user ID:', userId);
      }

      const insertData = {
        agenda_id: parseInt(agendaId),
        name: name || file.name,
        file_type: fileType,
        file_url: publicUrl,
        file_size: fileSize,
        uploaded_by: userId, // Use the resolved user ID
        uploaded_at: new Date().toISOString(),
        metadata: JSON.stringify({
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          mimeType: file.type,
          fileExtension: fileExtension,
          uploadedBy: currentUser.name || currentUser.email,
          uploadedById: currentUser.id
        }),
        created_at: new Date().toISOString()
      };

      console.log('📤 Inserting document data:', insertData);

      const result = await supabaseDb.insert('agenda_documents', insertData);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to insert document - no rows returned');
      }

      const savedDocument = result.rows[0];
      console.log('✅ Document saved to database:', {
        id: savedDocument.id,
        name: savedDocument.name,
        file_url: savedDocument.file_url,
        uploaded_by: savedDocument.uploaded_by
      });

      return NextResponse.json(savedDocument);

    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      
      // Try to delete the uploaded file if database insert failed
      try {
        await unlink(filePath);
        console.log('🗑️ Deleted file after database error');
      } catch (deleteError) {
        console.error('⚠️ Could not delete file after database error');
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to save document to database',
          details: dbError.message,
          // Include more context for debugging
          userInfo: {
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.name
          }
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agendaId = searchParams.get('agendaId');

    console.log('📁 Fetching documents for agenda:', agendaId);

    if (!agendaId) {
      return NextResponse.json(
        { error: 'Agenda ID is required' },
        { status: 400 }
      );
    }

    // Use supabaseDb to fetch documents
    const result = await supabaseDb.select('agenda_documents', {
      select: '*',
      eq: {
        field: 'agenda_id',
        value: parseInt(agendaId)
      },
      order: {
        field: 'uploaded_at',
        ascending: false
      }
    });

    console.log(`✅ Found ${result.rows?.length || 0} documents for agenda ${agendaId}`);
    
    // Transform data to include user names if needed
    const documents = result.rows || [];
    
    return NextResponse.json(documents);

  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch documents',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    console.log('🗑️ Deleting document:', documentId);

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get current user for authorization check
    const currentUser = await getCurrentUser(request);
    if (!currentUser?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get document first to delete the file using supabaseDb
    const document = await supabaseDb.select('agenda_documents', {
      select: '*',
      eq: {
        field: 'id',
        value: parseInt(documentId)
      }
    });

    if (document.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const doc = document.rows[0];
    console.log('📁 Document to delete:', doc);

    // Delete the physical file
    try {
      const filePath = join(process.cwd(), 'public', doc.file_url);
      console.log('🗑️ Deleting physical file:', filePath);
      await unlink(filePath);
      console.log('✅ Physical file deleted');
    } catch (error) {
      console.error('⚠️ Error deleting file (continuing with DB deletion):', error);
    }

    // Delete from database using supabaseDb
    await supabaseDb.delete('agenda_documents', {
      field: 'id',
      value: parseInt(documentId)
    });

    console.log('✅ Document deleted from database');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error deleting document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function getFileType(extension: string): string {
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
    'zip': 'archive',
    'rar': 'archive',
  };
  return typeMap[extension] || 'other';
}
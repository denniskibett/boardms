// src/app/api/resources/[id]/files/route.ts - UPDATED FOR SUPABASE STORAGE
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const supabase = supabaseServer();

    // Verify resource exists and get its details
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select(`
        *,
        categories(name),
        users(name)
      `)
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      console.error('❌ Resource not found:', resourceError);
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Get ministry name if ministryId provided
    let ministryName = null;
    if (ministryId) {
      const { data: ministry } = await supabase
        .from('ministries')
        .select('name')
        .eq('id', parseInt(ministryId))
        .single();
      ministryName = ministry?.name;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Create folder structure in Supabase Storage
    const folderPath = `resources/${resource.categories.name}/${resource.year}/${resource.name}`;
    const filePath = `${folderPath}/${uniqueFileName}`;

    console.log('💾 Uploading to Supabase Storage:', {
      folderPath,
      filePath,
      fileSize: file.size
    });

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Generate display filename
    const fileName = generateResourceFileName(
      file.name, 
      ministryName, 
      resource.year,
      resource.categories.name
    );

    // Save file record to database
    const { data: savedFile, error: dbError } = await supabase
      .from('resource_files')
      .insert([{
        resource_id: resourceId,
        name: fileName,
        display_name: displayName || file.name,
        file_type: getFileType(fileExt),
        file_url: publicUrl,
        file_size: file.size,
        ministry_id: ministryId ? parseInt(ministryId) : null,
        uploaded_by: session.user.id,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          mimeType: file.type,
          ministryName: ministryName,
          resourceType: resource.categories.name,
          year: resource.year,
          resourceName: resource.name,
          folderStructure: folderPath,
          uniqueFileName: uniqueFileName,
          storagePath: filePath
        }
      }])
      .select(`
        *,
        ministries(name),
        users(name)
      `)
      .single();

    if (dbError) {
      console.error('❌ Database error saving file record:', dbError);
      
      // Try to delete the uploaded file from storage if database save fails
      await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to save file record: ' + dbError.message },
        { status: 500 }
      );
    }

    console.log('✅ File uploaded successfully:', {
      id: savedFile.id,
      name: savedFile.name,
      url: savedFile.file_url,
      folder: folderPath
    });

    const formattedFile = {
      ...savedFile,
      ministry_name: savedFile.ministries?.name,
      uploaded_by_name: savedFile.users?.name
    };

    return NextResponse.json(formattedFile);

  } catch (error: any) {
    console.error('❌ Error uploading resource file:', error);
    return NextResponse.json(
      { error: 'Failed to upload resource file: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id);
    
    const supabase = supabaseServer();

    // Verify resource exists
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, name')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Get files for this resource
    const { data: files, error } = await supabase
      .from('resource_files')
      .select(`
        *,
        ministries(name),
        users(name)
      `)
      .eq('resource_id', resourceId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching files:', error);
      return NextResponse.json(
        { error: 'Failed to fetch files: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${files?.length || 0} files for resource ${resourceId}`);
    
    const formattedFiles = files?.map(file => ({
      ...file,
      ministry_name: file.ministries?.name,
      uploaded_by_name: file.users?.name
    })) || [];

    return NextResponse.json(formattedFiles);
  } catch (error: any) {
    console.error('❌ Error fetching resource files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource files: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id]/files - Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();

    // Verify file exists and belongs to this resource
    const { data: existingFile, error: fetchError } = await supabase
      .from('resource_files')
      .select('*')
      .eq('id', parseInt(fileId))
      .eq('resource_id', resourceId)
      .single();

    if (fetchError || !existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete file from Supabase Storage
    if (existingFile.metadata?.storagePath) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([existingFile.metadata.storagePath]);

      if (storageError) {
        console.error('❌ Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete file record from database
    const { error: deleteError } = await supabase
      .from('resource_files')
      .delete()
      .eq('id', parseInt(fileId))
      .eq('resource_id', resourceId);

    if (deleteError) {
      console.error('❌ Error deleting file record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file record: ' + deleteError.message },
        { status: 500 }
      );
    }

    console.log('🗑️ File deleted successfully:', fileId);
    return NextResponse.json({ success: true, deletedFileId: fileId });

  } catch (error: any) {
    console.error('❌ Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file: ' + error.message },
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
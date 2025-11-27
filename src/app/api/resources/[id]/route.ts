// src/app/api/resources/[id]/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Define the parameter type
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Await the params before using them
    const { id } = await params;
    
    const supabase = supabaseServer();

    const { data: resource, error } = await supabase
      .from('resources')
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name)
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      console.error('Supabase error fetching resource:', error);
      return NextResponse.json(
        { error: 'Failed to fetch resource' },
        { status: 500 }
      );
    }

    const formattedResource = {
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name
    };

    return NextResponse.json(formattedResource);
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Await the params before using them
    const { id } = await params;
    
    const { name, display_name, resource_type_id, year, description, metadata } = await request.json();

    const supabase = supabaseServer();

    // Generate folder name in uppercase
    const folderName = name.toUpperCase().replace(/ /g, '-').replace(/[^A-Z0-9-]/g, '');

    const { data: resource, error } = await supabase
      .from('resources')
      .update({
        name: folderName,
        display_name,
        resource_type_id,
        year,
        description,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      console.error('Supabase error updating resource:', error);
      return NextResponse.json(
        { error: 'Failed to update resource' },
        { status: 500 }
      );
    }

    const formattedResource = {
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name
    };

    return NextResponse.json(formattedResource);
  } catch (error: any) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Await the params before using them
    const { id } = await params;
    
    const supabase = supabaseServer();

    // First, delete all files associated with this resource from storage
    const { data: files, error: filesError } = await supabase
      .from('resource_files')
      .select('*')
      .eq('resource_id', parseInt(id));

    if (filesError) {
      console.error('Supabase error fetching files:', filesError);
      return NextResponse.json(
        { error: 'Failed to fetch resource files' },
        { status: 500 }
      );
    }

    // Delete files from storage
    if (files && files.length > 0) {
      const filePaths = files.map(file => {
        // Extract the file path from the URL
        const url = new URL(file.file_url);
        return url.pathname.replace('/storage/v1/object/public/documents/', '');
      });
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove(filePaths);

      if (storageError) {
        console.error('Error deleting files from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete file records from database
    const { error: deleteFilesError } = await supabase
      .from('resource_files')
      .delete()
      .eq('resource_id', parseInt(id));

    if (deleteFilesError) {
      console.error('Supabase error deleting files:', deleteFilesError);
      return NextResponse.json(
        { error: 'Failed to delete resource files' },
        { status: 500 }
      );
    }

    // Then delete the resource
    const { error: deleteResourceError } = await supabase
      .from('resources')
      .delete()
      .eq('id', parseInt(id));

    if (deleteResourceError) {
      console.error('Supabase error deleting resource:', deleteResourceError);
      return NextResponse.json(
        { error: 'Failed to delete resource' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
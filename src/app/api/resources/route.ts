// src/app/api/resources/route.ts - UPDATED FOR SUPABASE
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    console.log('🔍 Fetching resources with filters:', { year, type });

    const supabase = supabaseServer();

    // Get resources with categories and file counts
    let query = supabase
      .from('resources')
      .select(`
        *,
        categories!inner(name),
        users!inner(name),
        resource_files(count)
      `);

    if (year) {
      query = query.eq('year', parseInt(year));
    }
    if (type) {
      query = query.eq('categories.name', type);
    }

    const { data: resources, error } = await query
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching resources:', error);
      return NextResponse.json(
        { error: 'Failed to fetch resources: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${resources?.length || 0} resources`);

    // Format the response
    const formattedResources = resources?.map(resource => ({
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name,
      file_count: resource.resource_files?.[0]?.count || 0
    })) || [];

    return NextResponse.json(formattedResources);
  } catch (error: any) {
    console.error('🚨 Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, display_name, resource_type_id, year, description, metadata } = await request.json();

    console.log('📝 Creating resource:', { name, display_name, resource_type_id, year });

    // Validate required fields
    if (!name || !display_name || !resource_type_id || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name, resource_type_id, year are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Generate folder name in uppercase
    const folderName = name.toUpperCase().replace(/ /g, '-').replace(/[^A-Z0-9-]/g, '');

    const { data: resource, error } = await supabase
      .from('resources')
      .insert([{
        name: folderName,
        display_name,
        resource_type_id,
        year,
        description,
        metadata,
        created_by: session.user.id
      }])
      .select(`
        *,
        categories(name),
        users(name)
      `)
      .single();

    if (error) {
      console.error('❌ Supabase error creating resource:', error);
      return NextResponse.json(
        { error: 'Failed to create resource: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ Resource created successfully:', resource.id);

    const formattedResource = {
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name,
      file_count: 0
    };

    return NextResponse.json(formattedResource);
  } catch (error: any) {
    console.error('🚨 Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource: ' + error.message },
      { status: 500 }
    );
  }
}
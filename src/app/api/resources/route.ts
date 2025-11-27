// src/app/api/resources/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    const supabase = supabaseServer();

    let query = supabase
      .from('resources')
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name),
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
      console.error('Supabase error fetching resources:', error);
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      );
    }

    const formattedResources = resources.map(resource => ({
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name,
      file_count: resource.resource_files?.[0]?.count || 0
    }));

    return NextResponse.json(formattedResources);
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, display_name, resource_type_id, year, description, metadata } = await request.json();

    // Validate required fields
    if (!name || !display_name || !resource_type_id || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        // Note: Since we're using service role key, we don't need auth check
        // created_by will need to be provided in the request or set via trigger
      }])
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name)
      `)
      .single();

    if (error) {
      console.error('Supabase error creating resource:', error);
      return NextResponse.json(
        { error: 'Failed to create resource' },
        { status: 500 }
      );
    }

    const formattedResource = {
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name,
      file_count: 0
    };

    return NextResponse.json(formattedResource);
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
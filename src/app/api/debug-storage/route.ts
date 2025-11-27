// src/app/api/debug-storage/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = supabaseServer();
    
    // List files in storage
    const { data: files, error } = await supabase.storage
      .from('documents')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Failed to list storage files'
      });
    }

    // Get bucket info
    const { data: buckets, error: bucketError } = await supabase.storage
      .listBuckets();

    return NextResponse.json({
      success: true,
      buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
      files: files || [],
      totalFiles: files?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Storage debug failed'
    });
  }
}
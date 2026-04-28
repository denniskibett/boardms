// src/app/api/roles/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleKey = searchParams.get('roleKey');
    
    if (!roleKey) {
      return NextResponse.json({ error: 'Role key is required' }, { status: 400 });
    }
    
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('system_roles')
      .select('permissions, name, description, hierarchy_level')
      .eq('role_key', roleKey)
      .single();
    
    if (error) {
      console.error('Error fetching role permissions:', error);
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/roles/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
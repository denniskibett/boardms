// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const roles = searchParams.get('roles');
    
    const supabase = supabaseServer();
    
    console.log('🔍 Fetching users with parameters:', { roles, role });

    let query = supabase
      .from('users')
      .select(`
        id,
        auth_id,
        name,
        email,
        role,
        image,
        created_at
      `)
      .order('name', { ascending: true });

    // Apply role filtering
    if (role && role !== 'all') {
      console.log(`🎯 Filtering by single role: ${role}`);
      query = query.eq('role', role);
    } else if (roles) {
      const roleList = roles.split(',');
      console.log(`🎯 Filtering by multiple roles:`, roleList);
      query = query.in('role', roleList);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    console.log(`✅ Found ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      console.log('👥 No users found with the specified filters');
      return NextResponse.json([]);
    }

    return NextResponse.json(users);
    
  } catch (error) {
    console.error('❌ Error in users API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, image, email, password, role, status, phone, ministry_id } = body;

    console.log('👤 Creating user:', { name, email, role });

    // 1. First create user in Supabase Auth
    const supabase = supabaseServer();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) {
      console.error('❌ Auth creation failed:', authError);
      return NextResponse.json(
        { error: `Auth creation failed: ${authError.message}` },
        { status: 400 }
      );
    }

    // 2. Then create profile in your users table using Supabase client
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        name: name,
        image: image || null,
        email: email.toLowerCase(),
        role: role,
        status: status || 'active',
        phone: phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, name, email, role, status, phone, created_at')
      .single();

    if (userError) {
      console.error('❌ User profile creation failed:', userError);
      
      // Clean up: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: `User profile creation failed: ${userError.message}` },
        { status: 400 }
      );
    }

    // 3. Handle ministry assignment if needed
    if (ministry_id && userData) {
      const { error: ministryError } = await supabase
        .from('ministries')
        .update({ cabinet_secretary: userData.id })
        .eq('id', ministry_id);

      if (ministryError) {
        console.error('❌ Ministry assignment failed:', ministryError);
        // Continue anyway - this is not critical
      }
    }

    console.log('✅ User created successfully:', userData.id);
    return NextResponse.json(userData, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
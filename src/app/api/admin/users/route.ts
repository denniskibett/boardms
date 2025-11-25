import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// GET - List all auth users with their custom user data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const supabase = supabaseServer();
    
    // Get auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Get custom user data
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (customError) {
      return NextResponse.json({ error: customError.message }, { status: 400 });
    }

    // Combine auth users with custom user data
    const combinedUsers = users.map(authUser => {
      const customUser = customUsers?.find(u => u.email === authUser.email) || {};
      return {
        id: authUser.id,
        email: authUser.email,
        email_confirmed: authUser.email_confirmed_at !== null,
        last_sign_in: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        ...customUser
      };
    });

    // Paginate results
    const paginatedUsers = combinedUsers.slice(offset, offset + limit);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: combinedUsers.length,
        pages: Math.ceil(combinedUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new auth user and custom user record
export async function POST(request: Request) {
  try {
    const { email, password, name, role, status, phone, image } = await request.json();
    const supabase = supabaseServer();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name || '',
        role: role || 'user'
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create user in custom users table
    const { data: customUser, error: customError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        name: name || '',
        password: '$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW', // Default hashed password
        role: role || 'user',
        status: status || 'active',
        phone: phone || null,
        image: image || null,
        auth_user_id: authData.user.id
      })
      .select()
      .single();

    if (customError) {
      // If custom user creation fails, delete the auth user to maintain consistency
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: customError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        auth: authData.user,
        custom: customUser
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT - Bulk sync users from custom table to Supabase Auth
export async function PUT(request: Request) {
  try {
    const supabase = supabaseServer();
    
    console.log('🔄 Starting bulk user sync...');

    // Get all active users from custom table
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active');

    if (customError) {
      return NextResponse.json({ error: customError.message }, { status: 400 });
    }

    console.log(`📊 Found ${customUsers?.length || 0} users to sync`);

    const results = [];
    const defaultPassword = 'TempPassword123!';

    // Sync each user to Supabase Auth
    for (const user of customUsers || []) {
      try {
        console.log(`🔄 Syncing user: ${user.email}`);
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role,
            custom_user_id: user.id
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`✅ User already exists in Auth: ${user.email}`);
            results.push({ 
              email: user.email, 
              status: 'exists', 
              error: null,
              message: 'User already exists in Supabase Auth'
            });
          } else {
            console.error(`❌ Failed to sync ${user.email}:`, authError.message);
            results.push({ 
              email: user.email, 
              status: 'failed', 
              error: authError.message 
            });
          }
        } else {
          console.log(`✅ Successfully created auth user: ${user.email}`);
          
          // Update custom table with auth user ID
          await supabase
            .from('users')
            .update({ auth_user_id: authData.user.id })
            .eq('id', user.id);
          
          results.push({ 
            email: user.email, 
            status: 'created', 
            error: null,
            message: 'Successfully created in Supabase Auth',
            auth_user_id: authData.user.id
          });
        }
      } catch (error) {
        console.error(`💥 Error syncing ${user.email}:`, error);
        results.push({ 
          email: user.email, 
          status: 'error', 
          error: String(error) 
        });
      }
    }

    const successful = results.filter(r => r.status === 'created' || r.status === 'exists').length;
    console.log(`🎉 Sync completed: ${successful}/${customUsers?.length} users successful`);

    return NextResponse.json({
      success: true,
      message: `Bulk sync completed: ${successful}/${customUsers?.length} users processed`,
      total: customUsers?.length || 0,
      successful,
      failed: results.filter(r => r.status === 'failed' || r.status === 'error').length,
      results,
      default_password: defaultPassword,
      note: 'Users should reset their passwords on first login'
    });

  } catch (error) {
    console.error('Error in bulk sync:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync users',
        details: error 
      },
      { status: 500 }
    );
  }
}
import { supabase } from '@/lib/supabase/client';

export async function debugAuth(email: string, password: string) {
  console.log('🔍 DEBUG AUTH START ======================');
  console.log('Input:', { email, password });
  
  try {
    // 1. Check if user exists in custom table
    console.log('1. Checking custom users table...');
    const { data: customUser, error: customError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    console.log('Custom user result:', { 
      exists: !!customUser, 
      error: customError,
      user: customUser ? {
        id: customUser.id,
        email: customUser.email,
        status: customUser.status,
        auth_id: customUser.auth_id,
        role: customUser.role
      } : null
    });

    // 2. Try to sign in with Supabase Auth
    console.log('2. Trying Supabase Auth signin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password.trim(),
    });

    console.log('Auth result:', {
      success: !authError,
      error: authError,
      user: authData?.user ? {
        id: authData.user.id,
        email: authData.user.email
      } : null
    });

    // 3. If auth fails, check if we can find the user in Auth
    if (authError) {
      console.log('3. Auth failed, checking Auth users...');
      
      // This requires admin privileges, so we'll try a different approach
      console.log('Auth error details:', {
        message: authError.message,
        code: authError.code,
        status: authError.status
      });
    }

    // 4. Check if auth_id matches
    if (customUser && authData?.user) {
      console.log('4. Checking auth_id match...');
      console.log('Custom auth_id:', customUser.auth_id);
      console.log('Auth user id:', authData.user.id);
      console.log('Match:', customUser.auth_id === authData.user.id);
    }

    console.log('🔍 DEBUG AUTH END ======================');
    
    return {
      customUser,
      authData,
      authError,
      customError
    };

  } catch (error) {
    console.error('Debug error:', error);
    return { error };
  }
}
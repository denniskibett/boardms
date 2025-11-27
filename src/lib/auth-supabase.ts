// src/lib/auth-supabase.ts - UPDATED for API routes
import { supabaseServer } from '@/lib/supabase/server';

// For API routes using service role key
export const getApiUser = async (request: Request) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token using Supabase
    const supabase = supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      ...user,
      profile: profile || null
    };
  } catch (error) {
    console.error('Error getting API user:', error);
    return null;
  }
};

// Alternative: If you want to use the service role key directly without token verification
export const requireApiAuth = async (request: Request) => {
  const user = await getApiUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
};
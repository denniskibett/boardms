// lib/sync-users.ts - ADD THIS FUNCTION
import { supabaseServer } from './supabase/server';

export async function syncUserToCustomTable(authUserId: string) {
  try {
    const supabase = supabaseServer();
    
    // Get the auth user details
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(authUserId);
    
    if (authError || !authUser.user) {
      console.error('Error fetching auth user:', authError);
      return { success: false, error: authError?.message };
    }

    // Check if user already exists in custom table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.user.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingUser) {
      // Update existing user with auth_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          auth_id: authUser.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return { success: false, error: updateError.message };
      }

      return { 
        success: true, 
        message: 'User updated with auth_id',
        user: { ...existingUser, auth_id: authUser.user.id }
      };
    } else {
      // Create new user in custom table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            auth_id: authUser.user.id,
            email: authUser.user.email,
            name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
            role: authUser.user.user_metadata?.role || 'user',
            status: 'active',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user in custom table:', insertError);
        return { success: false, error: insertError.message };
      }

      return { 
        success: true, 
        message: 'User created in custom table',
        user: newUser 
      };
    }
  } catch (error) {
    console.error('Unexpected error in syncUserToCustomTable:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}
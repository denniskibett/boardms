import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function debugAuthUsers() {
  console.log('🔍 Debugging Supabase Auth Users...\n');

  try {
    // Get all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching auth users:', error.message);
      return;
    }

    console.log(`📊 Found ${users.length} users in Supabase Auth\n`);

    // Display user details
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   UUID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   User Metadata:`, user.user_metadata);
      console.log(`   Raw User:`, JSON.stringify(user, null, 2));
      console.log('---');
    });

    // Test login with first user
    if (users.length > 0) {
      console.log('\n🧪 Testing login with first user...');
      await testLogin(users[0].email, 'admin123');
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

async function testLogin(email: string, password: string) {
  try {
    console.log(`\n🔐 Testing login for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log(`❌ Login failed: ${error.message}`);
      
      // Check if it's a password issue
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 Possible issues:');
        console.log('   - Wrong password');
        console.log('   - Password not set during migration');
        console.log('   - User email not confirmed');
      }
    } else {
      console.log(`✅ Login successful!`);
      console.log(`   User: ${data.user.email}`);
      console.log(`   Session: ${data.session ? 'Active' : 'No session'}`);
      console.log(`   Access Token: ${data.session?.access_token?.substring(0, 20)}...`);
    }
  } catch (error) {
    console.error('💥 Login test error:', error);
  }
}

debugAuthUsers();
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  phone: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  image: string | null;
}

interface MigrationResult {
  email: string;
  status: 'created' | 'exists' | 'failed' | 'error';
  auth_user_id?: string;
  error?: string;
}

async function migrateUsers() {
  console.log('🔄 Starting user migration to Supabase Auth...');

  try {
    // Get all active users from your database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active') as { data: User[] | null; error: any };

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No active users found');
      return;
    }

    console.log(`📊 Found ${users.length} active users to migrate`);

    const results: MigrationResult[] = [];
    const defaultPassword = 'admin123';

    for (const user of users) {
      try {
        console.log(`🔄 Migrating: ${user.email}`);

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: defaultPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: user.name,
            role: user.role,
            custom_user_id: user.id
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`✅ Already exists: ${user.email}`);
            results.push({ email: user.email, status: 'exists' });
          } else {
            console.error(`❌ Failed: ${user.email} - ${authError.message}`);
            results.push({ 
              email: user.email, 
              status: 'failed', 
              error: authError.message 
            });
          }
        } else {
          // Update custom table with auth user ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_user_id: authData.user.id })
            .eq('id', user.id);

          if (updateError) {
            console.warn(`⚠️ Could not update auth_user_id for ${user.email}:`, updateError.message);
          }

          console.log(`✅ Created: ${user.email} (ID: ${authData.user.id})`);
          results.push({ 
            email: user.email, 
            status: 'created', 
            auth_user_id: authData.user.id 
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`💥 Error: ${user.email} - ${errorMessage}`);
        results.push({ 
          email: user.email, 
          status: 'error', 
          error: errorMessage 
        });
      }
    }

    // Print summary
    const successful = results.filter(r => r.status === 'created').length;
    const exists = results.filter(r => r.status === 'exists').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Created: ${successful}`);
    console.log(`⚠️  Already existed: ${exists}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);

    // Save results to file
    const summary = {
      summary: {
        total: users.length,
        created: successful,
        exists: exists,
        failed: failed,
        errors: errors,
        default_password: defaultPassword
      },
      results: results
    };

    fs.writeFileSync('migration-results.json', JSON.stringify(summary, null, 2));
    console.log('📄 Detailed results saved to migration-results.json');

    // Print first few users for testing
    console.log('\n🧪 Test these logins:');
    results.slice(0, 5).forEach(result => {
      if (result.status === 'created' || result.status === 'exists') {
        console.log(`   Email: ${result.email} | Password: ${defaultPassword}`);
      }
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the migration
migrateUsers();
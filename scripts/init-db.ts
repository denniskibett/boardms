// scripts/seedDatabase.ts
import 'dotenv/config';
import { query, initDB, testConnection } from '@/lib/db';

async function seedDatabase() {
  try {
    console.log('🚀 Starting database initialization...');

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Cannot connect to database. Please check your PostgreSQL installation.');
      process.exit(1);
    }

    // Initialize database tables
    await initDB();

    // Check if we already have data
    const existingUsers = await query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('✅ Database already has data. Skipping additional seeding.');
      return;
    }

    console.log('📊 Database structure created successfully!');
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
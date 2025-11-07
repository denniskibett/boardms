// scripts/seed.ts
import { initDB } from '@/lib/db';

async function main() {
  try {
    await initDB();
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  }
}

main();
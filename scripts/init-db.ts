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
      console.log('✅ Database already has data. Skipping seeding.');
      return;
    }

    console.log('📥 Seeding sample data...');

    // Insert sample users
    const usersResult = await query(`
      INSERT INTO users (email, name, role, ministry) VALUES
      ('president@president.go.ke', 'H.E. Dr. William Samoei Ruto', 'President', 'Office of the President'),
      ('deputy.president@president.go.ke', 'H.E. Rigathi Gachagua', 'Deputy President', 'Office of the Deputy President'),
      ('mudavadi@primecabinet.go.ke', 'Hon. Musalia Mudavadi', 'Prime Cabinet Secretary', 'Prime Cabinet Secretary Office'),
      ('kindiki@interior.go.ke', 'Hon. Prof. Kithure Kindiki', 'Cabinet Secretary', 'Ministry of Interior & National Administration'),
      ('murkomen@transport.go.ke', 'Hon. Kipchumba Murkomen', 'Cabinet Secretary', 'Ministry of Roads & Transport'),
      ('nakhumicha@health.go.ke', 'Hon. Susan Nakhumicha', 'Cabinet Secretary', 'Ministry of Health'),
      ('secretariat@cabinet.go.ke', 'Cabinet Secretariat', 'Secretariat', 'Cabinet Office')
      RETURNING id
    `);

    // Insert sample committees
    await query(`
      INSERT INTO committees (name, cluster, chair_id) VALUES
      ('Infrastructure & Energy Committee', 'Infrastructure', 2),
      ('Budget & Finance Committee', 'Finance', 2),
      ('Social Services Committee', 'Social Services', 6),
      ('Security & Administration Committee', 'Security', 4),
      ('Full Cabinet Meeting', 'Cabinet', 1)
    `);

    // Insert sample memos
    await query(`
      INSERT INTO gov_memos (title, summary, body, submitted_by, assigned_committee, priority, status) VALUES
      ('Infrastructure Development Proposal for Northern Corridor', 'Comprehensive infrastructure development plan covering transport, energy, and digital infrastructure', 'Detailed proposal content including budget, timeline, and implementation strategy...', 5, 'Infrastructure & Energy Committee', 'high', 'under_review'),
      ('Healthcare Funding Allocation Q1 2024', 'Healthcare budget allocation proposal for county hospitals', 'Budget details and allocation plan for medical equipment and infrastructure upgrades...', 6, 'Social Services Committee', 'medium', 'approved'),
      ('Education Policy Reform Framework', 'Implementation of new competency-based curriculum', 'Policy framework details including teacher training and resource allocation...', 6, 'Social Services Committee', 'medium', 'draft'),
      ('Digital Transformation Strategy', 'National digital transformation and e-government implementation', 'Strategy for digital infrastructure and online service delivery...', 5, 'Infrastructure & Energy Committee', 'high', 'submitted')
    `);

    console.log('✅ Database seeded successfully!');
    console.log('📊 Sample data inserted:');
    console.log('   - 7 users (President, DP, Cabinet Secretaries)');
    console.log('   - 5 committees');
    console.log('   - 4 government memos');
    
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
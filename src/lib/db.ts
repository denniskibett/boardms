// lib/db.ts - UPDATED FOR LOCAL SETUP
import { Pool } from 'pg';

// For local development without Docker
const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'boardms',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Add connection timeout to avoid hanging
  connectionTimeoutMillis: 5000,
  // Allow self-signed certificates in development
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Initialize database tables
export const initDB = async () => {
  try {
    console.log('🔄 Initializing database tables...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        ministry VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Government Memos table
    await query(`
      CREATE TABLE IF NOT EXISTS gov_memos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        summary TEXT,
        body TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        submitted_by INTEGER REFERENCES users(id),
        assigned_committee VARCHAR(255),
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Committees table
    await query(`
      CREATE TABLE IF NOT EXISTS committees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        cluster VARCHAR(100),
        chair_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meetings table
    await query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        committee_id INTEGER REFERENCES committees(id),
        type VARCHAR(50),
        scheduled_at TIMESTAMP,
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agenda Items table
    await query(`
      CREATE TABLE IF NOT EXISTS agenda_items (
        id SERIAL PRIMARY KEY,
        meeting_id INTEGER REFERENCES meetings(id),
        memo_id INTEGER REFERENCES gov_memos(id),
        title VARCHAR(500) NOT NULL,
        presenter VARCHAR(255),
        duration INTEGER DEFAULT 15,
        sort_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Decisions table
    await query(`
      CREATE TABLE IF NOT EXISTS decisions (
        id SERIAL PRIMARY KEY,
        agenda_item_id INTEGER REFERENCES agenda_items(id),
        decision_text TEXT NOT NULL,
        decision_type VARCHAR(50),
        signed_by INTEGER REFERENCES users(id),
        signed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Action Letters table
    await query(`
      CREATE TABLE IF NOT EXISTS action_letters (
        id SERIAL PRIMARY KEY,
        decision_id INTEGER REFERENCES decisions(id),
        to_ministry VARCHAR(255) NOT NULL,
        content TEXT,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit Logs table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(100),
        target_id INTEGER,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};
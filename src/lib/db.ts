// lib/db.ts
import { Pool } from 'pg';
import { seedInitialData } from './seedData';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'boardms',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

export const initDB = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection first
    await testConnection();
    
    // Read and execute schema
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL.split(';').filter(statement => statement.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          console.warn(`⚠️ Warning executing statement: ${error}`);
        }
      }
    }
    
    console.log('✅ Database schema created');
    
    // Seed initial data
    await seedInitialData();
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

export default pool;
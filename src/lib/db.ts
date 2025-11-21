// lib/db.ts - Updated with proper typing
import { supabaseServer } from './supabase/server'
import { supabaseDb } from './supabase-db'

// Test database connection
export const testConnection = async () => {
  try {
    const supabase = supabaseServer()
    const { data, error } = await supabase.from('users').select('id').limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
    
    console.log('✅ Supabase connected successfully')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}

// For backward compatibility - wraps the new typed system
export const query = async (sql: string, params?: any[]) => {
  try {
    // Simple SQL parser for basic operations
    const trimmedSql = sql.trim().toUpperCase()
    
    if (trimmedSql.startsWith('SELECT')) {
      // Extract table name from SELECT query
      const tableMatch = sql.match(/FROM\s+(\w+)/i)
      if (tableMatch) {
        const tableName = tableMatch[1]
        return await supabaseDb.select(tableName, { limit: 10 })
      }
    }
    
    if (trimmedSql.startsWith('INSERT')) {
      // This is more complex - you should use supabaseDb.insert directly
      console.warn('⚠️ Raw INSERT not supported. Use supabaseDb.insert() instead.')
    }
    
    // For other queries, use the new typed system
    console.warn('⚠️ Raw SQL query not fully supported:', sql)
    throw new Error('Raw SQL queries not supported. Use supabaseDb methods.')
    
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Initialize database
export const initDB = async () => {
  try {
    console.log('🔄 Checking Supabase connection...')
    const isConnected = await testConnection()
    
    if (isConnected) {
      console.log('✅ Supabase initialization completed')
    } else {
      throw new Error('Failed to connect to Supabase')
    }
  } catch (error) {
    console.error('❌ Error initializing Supabase:', error)
    throw error
  }
}

// Export for direct use
export { supabaseServer, supabaseDb }
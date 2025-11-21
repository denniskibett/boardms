// lib/seedData.ts
import { supabaseServer } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function seedInitialData() {
  try {
    const supabase = supabaseServer()
    
    // Check if users already exist
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Users already exist, skipping seed')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Insert default users
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'president@president.go.ke',
          name: 'President',
          password: hashedPassword,
          role: 'president',
          status: 'active'
        },
        {
          email: 'clerk@government.go.ke',
          name: 'System Clerk',
          password: hashedPassword,
          role: 'clerk', 
          status: 'active'
        }
      ])
      .select()

    if (error) {
      console.error('❌ Seed failed:', error)
      throw error
    }

    console.log('✅ Database seeded with users:', data)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}
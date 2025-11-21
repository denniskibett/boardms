// lib/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { query, testConnection } from '@/lib/db'
import { supabaseServer } from '@/lib/supabase/server'  
import bcrypt from 'bcryptjs'

// Custom error types for granular error handling
class AuthError extends Error {
  constructor(
    message: string,
    public type: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'ACCOUNT_INACTIVE' | 'DATABASE_ERROR' | 'VALIDATION_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// Enhanced database health check with user listing
async function checkDatabaseHealth() {
  try {
    const isConnected = await testConnection()
    if (!isConnected) {
      throw new Error('Database connection failed')
    }

    // Test if users table exists and is accessible
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `)
    
    if (!tableCheck.rows[0]?.exists) {
      throw new Error('Users table does not exist')
    }

    // Get all users for debugging
    let allUsers = []
    try {
      const usersResult = await query(`
        SELECT email, name, role, status, id 
        FROM users 
        ORDER BY email
      `)
      allUsers = usersResult.rows
    } catch (error) {
      console.error('Error fetching users for debug:', error)
      allUsers = [{ error: 'Failed to fetch users' }]
    }

    return { 
      healthy: true,
      users: allUsers
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown database error',
      users: []
    }
  }
}

// Enhanced user verification with detailed error reporting
async function verifyUserCredentials(email: string, password: string) {
  console.log('🔐 Authentication attempt for:', email)
  
  try {
    const supabase = supabaseServer()
    
    // Query user from Supabase
    console.log('📊 Querying Supabase for user:', email)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (error) {
      throw new AuthError(
        'Database error during authentication.',
        'DATABASE_ERROR',
        { supabaseError: error.message }
      )
    }

    console.log('📈 Supabase query result:', {
      rowsFound: users?.length || 0,
      userExists: (users?.length || 0) > 0
    })

    // Check if user exists
    if (!users || users.length === 0) {
      // Get all users for debugging
      const { data: allUsers } = await supabase
        .from('users')
        .select('email, name, role, status')
        .order('email')
      
      throw new AuthError(
        'No account found with this email address.',
        'USER_NOT_FOUND',
        { 
          emailAttempted: email,
          totalUsersInSystem: allUsers?.length || 0,
          availableUsers: allUsers?.map(u => u.email) || [],
          suggestion: (allUsers?.length || 0) === 0 ? 
            'No users in database. Run seed script.' : 
            `Available users: ${allUsers?.map(u => u.email).join(', ')}`
        }
      )
    }

    const user = users[0]
    console.log('👤 User found:', { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: user.role, 
      status: user.status 
    })

    // Check if user is active
    if (user.status !== 'active') {
      throw new AuthError(
        `Your account is ${user.status}. Please contact administrator.`,
        'ACCOUNT_INACTIVE',
        { 
          userId: user.id,
          currentStatus: user.status,
          email: user.email 
        }
      )
    }

    // Verify password
    console.log('🔑 Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    console.log('📝 Password validation result:', {
      isValid: isPasswordValid,
      passwordLength: password.length,
      storedHashLength: user.password.length
    })

    if (!isPasswordValid) {
      throw new AuthError(
        'Invalid password. Please check your password and try again.',
        'INVALID_PASSWORD',
        { 
          userId: user.id,
          email: user.email,
          suggestion: 'Try: admin123 (default seed password)'
        }
      )
    }

    // Update last login
    console.log('🕒 Updating last login timestamp...')
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    console.log('✅ Authentication successful for user:', user.email)
    
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    
    console.error('💥 Unexpected Supabase error:', error)
    throw new AuthError(
      'Database error during authentication. Please try again.',
      'DATABASE_ERROR',
      { 
        originalError: error instanceof Error ? error.message : 'Unknown error'
      }
    )
  }
}

// For NextAuth v4, we don't need to explicitly type authOptions
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your.email@gov.go.ke'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        }
      },
      async authorize(credentials) {
        console.log('🚀 Authorization process started')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          throw new AuthError(
            'Email and password are required.',
            'VALIDATION_ERROR',
            { 
              emailProvided: !!credentials?.email,
              passwordProvided: !!credentials?.password
            }
          )
        }

        try {
          const user = await verifyUserCredentials(credentials.email, credentials.password)
          return user
        } catch (error) {
          if (error instanceof AuthError) {
            console.log('🔴 AuthError caught:', {
              type: error.type,
              message: error.message,
              details: error.details
            })
            // Convert to format that NextAuth can handle
            throw new Error(JSON.stringify({
              type: error.type,
              message: error.message,
              details: error.details
            }))
          }
          
          // Re-throw unknown errors
          console.error('💥 Unknown error in authorize:', error)
          throw new Error(JSON.stringify({
            type: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred',
            details: { error: String(error) }
          }))
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
}

// Utility function to check system status
export async function getAuthSystemStatus() {
  const dbHealth = await checkDatabaseHealth()
  
  return {
    database: dbHealth,
    users: {
      total: dbHealth.users?.length || 0,
      hasUsers: (dbHealth.users?.length || 0) > 0,
      list: dbHealth.users?.map((u: any) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status
      })) || []
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    },
    timestamp: new Date().toISOString()
  }
}

// Don't export GET/POST from here - let the API route handle that
// Remove this line: export { GET, POST } from '@/app/api/auth/[...nextauth]/route'
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { query, testConnection } from './db'
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
  
  // First, check database health
  const dbHealth = await checkDatabaseHealth()
  if (!dbHealth.healthy) {
    throw new AuthError(
      'Database connection issue. Please try again later.',
      'DATABASE_ERROR',
      { 
        dbError: dbHealth.error,
        availableUsers: dbHealth.users
      }
    )
  }

  try {
    // Query user from database with detailed logging
    console.log('📊 Querying database for user:', email)
    const result = await query(
      'SELECT id, name, email, password, role, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    console.log('📈 Database query result:', {
      rowsFound: result.rows.length,
      userExists: result.rows.length > 0,
      availableUsers: dbHealth.users.map((u: any) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status
      }))
    })

    // Check if user exists
    if (result.rows.length === 0) {
      throw new AuthError(
        'No account found with this email address.',
        'USER_NOT_FOUND',
        { 
          emailAttempted: email,
          totalUsersInSystem: dbHealth.users.length,
          availableUsers: dbHealth.users.map((u: any) => u.email),
          suggestion: dbHealth.users.length === 0 ? 
            'No users in database. Run seed script.' : 
            `Available users: ${dbHealth.users.map((u: any) => u.email).join(', ')}`
        }
      )
    }

    const user = result.rows[0]
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

    // Verify password with detailed comparison
    console.log('🔑 Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    console.log('📝 Password validation result:', {
      isValid: isPasswordValid,
      passwordLength: password.length,
      storedHashLength: user.password.length,
      passwordProvided: password
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
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    console.log('✅ Authentication successful for user:', user.email)
    
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error // Re-throw our custom errors
    }
    
    // Handle unexpected database errors
    console.error('💥 Unexpected database error:', error)
    throw new AuthError(
      'Database error during authentication. Please try again.',
      'DATABASE_ERROR',
      { 
        originalError: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    )
  }
}

export const authOptions: NextAuthOptions = {
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
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

// Export auth configuration for API routes
export default authOptions
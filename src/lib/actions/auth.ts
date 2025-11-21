// lib/actions/auth.ts
'use server'

import { supabaseServer } from '@/lib/supabase/server'

// Define the function that was missing
async function getAuthSystemStatus() {
  try {
    console.log('🔍 Checking system status...')
    
    // Check database connection and get users
    let users: any[] = []
    let databaseHealthy = false
    let databaseError = ''

    try {
      const supabase = supabaseServer()
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .limit(10)

      if (error) {
        throw error
      }

      users = data || []
      databaseHealthy = true
      console.log(`✅ Supabase connected, found ${users.length} users`)
    } catch (dbError: any) {
      databaseHealthy = false
      databaseError = dbError.message
      console.error('❌ Supabase connection failed:', dbError.message)
    }

    // Check environment variables
    const hasAuthSecret = !!process.env.NEXTAUTH_SECRET
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const nodeEnv = process.env.NODE_ENV || 'development'

    const systemStatus = {
      database: {
        healthy: databaseHealthy,
        error: databaseError || undefined,
        users: users
      },
      users: {
        total: users.length,
        hasUsers: users.length > 0,
        list: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }))
      },
      environment: {
        nodeEnv,
        hasAuthSecret,
        hasSupabaseUrl,
        hasSupabaseKey,
      }
    }

    console.log('📊 System status check completed:', {
      database: systemStatus.database.healthy,
      users: systemStatus.users.total,
      hasAuthSecret: systemStatus.environment.hasAuthSecret,
      hasSupabaseUrl: systemStatus.environment.hasSupabaseUrl
    })

    return systemStatus

  } catch (error) {
    console.error('💥 System status check failed:', error)
    return {
      database: {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      users: {
        total: 0,
        hasUsers: false,
        list: []
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasAuthSecret: false,
        hasSupabaseUrl: false,
        hasSupabaseKey: false,
      }
    }
  }
}

export async function getSystemStatus() {
  return await getAuthSystemStatus()
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('🔐 Authentication attempt:', { 
    email, 
    passwordLength: password?.length,
    timestamp: new Date().toISOString()
  })

  try {
    // Import signIn dynamically since it's a client function
    const { signIn } = await import('next-auth/react')
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    console.log('📨 SignIn response:', result)

    if (result?.error) {
      // Parse the detailed error from our enhanced auth system
      try {
        const errorData = JSON.parse(result.error)
        console.log('🔴 Parsed error details:', errorData)
        
        // Format user-friendly message with details
        let userMessage = errorData.message
        
        if (errorData.details?.availableUsers) {
          userMessage += `\n\nAvailable users:\n${errorData.details.availableUsers.join('\n')}`
        }
        
        if (errorData.details?.suggestion) {
          userMessage += `\n\n💡 ${errorData.details.suggestion}`
        }
        
        return userMessage
      } catch (parseError) {
        // If it's not our formatted error, return as is
        console.log('⚠️ Could not parse error, returning raw:', result.error)
        return result.error || 'Authentication failed'
      }
    }

    if (result?.ok) {
      console.log('✅ SignIn successful, redirecting to dashboard')
      return 'success'
    }

    return 'Unknown authentication error - no response from auth system'
  } catch (error) {
    console.error('💥 Auth action error:', error)
    
    if (error instanceof Error) {
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }

    // Check for Supabase connection issues
    if (error instanceof Error) {
      if (error.message.includes('supabase') || error.message.includes('connection') || error.message.includes('fetch')) {
        return 'Supabase connection failed. Please check your Supabase configuration.'
      }
    }

    return `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
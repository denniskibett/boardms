'use server'

import { signIn } from 'next-auth/react'

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

    // Check for database connection issues
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        return 'Database connection failed. Please check if PostgreSQL is running on localhost:5432.'
      }
    }

    return `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

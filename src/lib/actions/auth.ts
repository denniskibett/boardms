// src/lib/actions/auth.ts
'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

// Define the system status function
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

// Get current user's role and permissions
export async function getCurrentUserRole() {
  try {
    const supabase = supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.email) {
      return null
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('role, permissions, ministry_id')
      .eq('email', session.user.email)
      .single()

    if (error || !user) {
      console.error('Error fetching user role:', error)
      return null
    }

    return {
      role: user.role,
      permissions: user.permissions || [],
      ministryId: user.ministry_id
    }
  } catch (error) {
    console.error('Error in getCurrentUserRole:', error)
    return null
  }
}

// Check if user has specific permission
export async function userHasPermission(permissionId: string) {
  const userRole = await getCurrentUserRole()
  if (!userRole) return false
  
  return userRole.permissions.includes(permissionId)
}

// Check if user has any of the specified permissions
export async function userHasAnyPermission(permissionIds: string[]) {
  const userRole = await getCurrentUserRole()
  if (!userRole) return false
  
  return permissionIds.some(permissionId => userRole.permissions.includes(permissionId))
}

// Check if user has all specified permissions
export async function userHasAllPermissions(permissionIds: string[]) {
  const userRole = await getCurrentUserRole()
  if (!userRole) return false
  
  return permissionIds.every(permissionId => userRole.permissions.includes(permissionId))
}

// Get user's role hierarchy level
export async function getUserRoleLevel() {
  const userRole = await getCurrentUserRole()
  if (!userRole) return null
  
  const roleHierarchy: { [key: string]: number } = {
    president: 1,
    deputy_president: 2,
    prime_cabinet_secretary: 3,
    cabinet_secretariat: 4,
    attorney_general: 5,
    cabinet_secretary: 6,
    principal_secretary: 7,
    director: 8,
    assistant_director: 9,
    co_officer: 10,
    sysadmin: 11,
    admin: 12,
  }
  
  return roleHierarchy[userRole.role.toLowerCase().replace(/\s+/g, '_')] || 99
}

// Check if user's role is at least the specified level
export async function isUserRoleAtLeast(minRole: string) {
  const currentLevel = await getUserRoleLevel()
  const requiredLevel = getUserRoleLevelFromName(minRole)
  
  if (!currentLevel || !requiredLevel) return false
  
  return currentLevel <= requiredLevel
}

function getUserRoleLevelFromName(roleName: string): number | null {
  const roleHierarchy: { [key: string]: number } = {
    president: 1,
    deputy_president: 2,
    prime_cabinet_secretary: 3,
    cabinet_secretariat: 4,
    attorney_general: 5,
    cabinet_secretary: 6,
    principal_secretary: 7,
    director: 8,
    assistant_director: 9,
    co_officer: 10,
    sysadmin: 11,
    admin: 12,
  }
  
  return roleHierarchy[roleName.toLowerCase().replace(/\s+/g, '_')] || null
}

// Authenticate user with credentials
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
    // First, verify if the user exists in our users table
    const supabase = supabaseServer()
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, status')
      .eq('email', email)
      .single()

    if (userError || !existingUser) {
      console.log('❌ User not found in database:', email)
      return 'User not found. Please contact your administrator.'
    }

    // Check if user account is active
    if (existingUser.status !== 'active') {
      console.log('❌ User account is inactive:', email, 'Status:', existingUser.status)
      return 'Your account is inactive. Please contact your administrator.'
    }

    // Attempt authentication with NextAuth
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    console.log('📨 SignIn response:', result)

    if (result?.error) {
      // Handle different auth error types
      if (result.error instanceof AuthError) {
        switch (result.error.type) {
          case 'CredentialsSignin':
            return 'Invalid email or password. Please try again.'
          case 'AccessDenied':
            return 'Access denied. Please contact your administrator.'
          default:
            return `Authentication failed: ${result.error.message}`
        }
      }
      
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
      console.log('✅ SignIn successful for user:', email, 'Role:', existingUser.role)
      
      // Log successful login
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
      
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
      
      if (error.message.includes('NEXTAUTH_SECRET')) {
        return 'Authentication configuration error. Please contact system administrator.'
      }
    }

    return `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Get user permissions mapping for client-side use
export async function getUserPermissionsMap() {
  const userRole = await getCurrentUserRole()
  if (!userRole) return null
  
  // Define role-specific permission mappings
  const rolePermissionMap: { [key: string]: string[] } = {
    president: [
      'memos_create', 'memos_read', 'memos_update', 'memos_delete', 'memos_approve', 'memos_sign',
      'committees_create', 'committees_read', 'committees_update', 'committees_delete', 'committees_manage', 'committees_chair',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_delete', 'meetings_chair', 'meetings_manage',
      'decisions_create', 'decisions_read', 'decisions_update', 'decisions_delete', 'decisions_sign', 'decisions_approve',
      'actionLetters_create', 'actionLetters_read', 'actionLetters_update', 'actionLetters_delete', 'actionLetters_approve', 'actionLetters_sign',
      'users_create', 'users_read', 'users_update', 'users_delete', 'users_manage',
      'reports_create', 'reports_read', 'reports_update', 'reports_delete', 'reports_export', 'reports_generate',
      'settings_read', 'settings_update', 'settings_manage'
    ],
    deputy_president: [
      'memos_create', 'memos_read', 'memos_update', 'memos_review', 'memos_approve',
      'committees_create', 'committees_read', 'committees_update', 'committees_manage', 'committees_chair',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_chair', 'meetings_manage',
      'decisions_create', 'decisions_read', 'decisions_update', 'decisions_recommend', 'decisions_approve',
      'actionLetters_create', 'actionLetters_read', 'actionLetters_update', 'actionLetters_approve',
      'users_read',
      'reports_read', 'reports_export',
      'settings_read'
    ],
    prime_cabinet_secretary: [
      'memos_create', 'memos_read', 'memos_update', 'memos_review', 'memos_coordinate', 'memos_approve',
      'committees_create', 'committees_read', 'committees_update', 'committees_manage', 'committees_chair',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_chair', 'meetings_manage',
      'decisions_create', 'decisions_read', 'decisions_update', 'decisions_recommend', 'decisions_coordinate',
      'actionLetters_create', 'actionLetters_read', 'actionLetters_update', 'actionLetters_coordinate', 'actionLetters_approve',
      'users_read',
      'reports_read', 'reports_export', 'reports_generate',
      'settings_read'
    ],
    cabinet_secretariat: [
      'memos_create', 'memos_read', 'memos_update', 'memos_assign', 'memos_manage',
      'committees_create', 'committees_read', 'committees_update', 'committees_manage',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_manage', 'meetings_schedule',
      'decisions_create', 'decisions_read', 'decisions_update', 'decisions_manage',
      'actionLetters_create', 'actionLetters_read', 'actionLetters_update', 'actionLetters_manage', 'actionLetters_track',
      'users_create', 'users_read', 'users_update', 'users_manage',
      'reports_read', 'reports_export', 'reports_generate',
      'settings_read', 'settings_update'
    ],
    attorney_general: [
      'memos_read', 'memos_review', 'memos_legal_review', 'memos_comment',
      'committees_read', 'committees_participate', 'committees_legal_advisor',
      'meetings_read', 'meetings_participate', 'meetings_legal_advisor',
      'decisions_read', 'decisions_legal_review', 'decisions_certify',
      'actionLetters_read', 'actionLetters_legal_review',
      'users_read',
      'reports_read',
      'settings_read'
    ],
    cabinet_secretary: [
      'memos_create', 'memos_read', 'memos_update', 'memos_submit', 'memos_review',
      'committees_read', 'committees_participate', 'committees_present',
      'meetings_read', 'meetings_participate', 'meetings_present',
      'decisions_read', 'decisions_implement',
      'actionLetters_read', 'actionLetters_implement', 'actionLetters_assign',
      'users_read',
      'reports_read', 'reports_export',
      'settings_read'
    ],
    principal_secretary: [
      'memos_create', 'memos_read', 'memos_update', 'memos_review',
      'committees_read', 'committees_participate', 'committees_technical_advisor',
      'meetings_read', 'meetings_participate',
      'decisions_read', 'decisions_implement', 'decisions_report',
      'actionLetters_read', 'actionLetters_implement', 'actionLetters_monitor',
      'users_read',
      'reports_read', 'reports_export', 'reports_generate',
      'settings_read'
    ],
    director: [
      'memos_create', 'memos_read', 'memos_update', 'memos_prepare',
      'committees_read', 'committees_support',
      'meetings_read', 'meetings_support',
      'decisions_read',
      'actionLetters_read', 'actionLetters_prepare',
      'users_read',
      'reports_read', 'reports_generate',
      'settings_read'
    ],
    assistant_director: [
      'memos_create', 'memos_read', 'memos_update', 'memos_draft',
      'committees_read', 'committees_support', 'committees_minute',
      'meetings_read', 'meetings_support', 'meetings_minute',
      'decisions_read',
      'actionLetters_read', 'actionLetters_draft',
      'users_read',
      'reports_read', 'reports_generate',
      'settings_read'
    ],
    co_officer: [
      'memos_create', 'memos_read', 'memos_update', 'memos_process',
      'committees_read', 'committees_coordinate', 'committees_support',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_coordinate',
      'decisions_create', 'decisions_read', 'decisions_update',
      'actionLetters_create', 'actionLetters_read', 'actionLetters_update', 'actionLetters_track',
      'users_read',
      'reports_read', 'reports_generate',
      'settings_read'
    ],
    sysadmin: [
      'memos_read',
      'committees_read',
      'meetings_read',
      'decisions_read',
      'actionLetters_read',
      'users_create', 'users_read', 'users_update', 'users_delete', 'users_manage', 'users_reset',
      'reports_read', 'reports_export', 'reports_generate', 'reports_system_logs',
      'settings_read', 'settings_update', 'settings_manage', 'settings_system_config'
    ],
    admin: [
      'memos_create', 'memos_read', 'memos_update', 'memos_delete', 'memos_manage',
      'committees_create', 'committees_read', 'committees_update', 'committees_delete', 'committees_manage',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_delete', 'meetings_manage',
      'decisions_create', 'decisions_read', 'decisions_update', 'decisions_delete', 'decisions_manage',
      'actionLetters_create', 'actionLetters_read', 'actionLetters_update', 'actionLetters_delete', 'actionLetters_manage',
      'users_create', 'users_read', 'users_update', 'users_delete', 'users_manage', 'users_assign_roles',
      'reports_create', 'reports_read', 'reports_update', 'reports_delete', 'reports_export', 'reports_generate',
      'settings_read', 'settings_update', 'settings_manage'
    ]
  }
  
  const roleKey = userRole.role.toLowerCase().replace(/\s+/g, '_')
  return rolePermissionMap[roleKey] || []
}

// Get role-based dashboard components
export async function getRoleDashboardConfig() {
  const userRole = await getCurrentUserRole()
  if (!userRole) return null
  
  const roleKey = userRole.role.toLowerCase().replace(/\s+/g, '_')
  
  const dashboardConfigs: { [key: string]: any } = {
    president: {
      showExecutiveDashboard: true,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'approvals']
    },
    deputy_president: {
      showExecutiveDashboard: true,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems']
    },
    prime_cabinet_secretary: {
      showExecutiveDashboard: true,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'coordination']
    },
    cabinet_secretariat: {
      showExecutiveDashboard: false,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: true,
      maxRecentItems: 15,
      widgets: ['upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'queue']
    },
    attorney_general: {
      showExecutiveDashboard: false,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['upcomingMeetings', 'recentMemos', 'legalReviews']
    },
    cabinet_secretary: {
      showExecutiveDashboard: false,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'ministryMetrics']
    },
    principal_secretary: {
      showExecutiveDashboard: false,
      showWorkflowChart: true,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['upcomingMeetings', 'recentMemos', 'actionItems', 'departmentMetrics']
    },
    director: {
      showExecutiveDashboard: false,
      showWorkflowChart: false,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['upcomingMeetings', 'recentMemos', 'actionItems']
    },
    assistant_director: {
      showExecutiveDashboard: false,
      showWorkflowChart: false,
      showAdminPanel: false,
      showSecretariatPanel: false,
      maxRecentItems: 10,
      widgets: ['upcomingMeetings', 'recentMemos']
    },
    co_officer: {
      showExecutiveDashboard: false,
      showWorkflowChart: false,
      showAdminPanel: false,
      showSecretariatPanel: true,
      maxRecentItems: 10,
      widgets: ['upcomingMeetings', 'recentMemos', 'actionItems', 'coordination']
    },
    sysadmin: {
      showExecutiveDashboard: false,
      showWorkflowChart: false,
      showAdminPanel: true,
      showSecretariatPanel: false,
      maxRecentItems: 20,
      widgets: ['systemMetrics', 'upcomingMeetings', 'recentMemos', 'auditLogs']
    },
    admin: {
      showExecutiveDashboard: false,
      showWorkflowChart: true,
      showAdminPanel: true,
      showSecretariatPanel: false,
      maxRecentItems: 20,
      widgets: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'userManagement']
    }
  }
  
  return dashboardConfigs[roleKey] || dashboardConfigs.director
}
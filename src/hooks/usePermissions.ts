// src/lib/hooks/usePermissions.ts
import { useAppSelector } from '@/lib/store/hooks';
import { useSession } from 'next-auth/react';
import { useMemo, useEffect, useState } from 'react';

// Role hierarchy for seniority-based checks
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
};

// Module labels for UI display
export const moduleLabels: { [key: string]: string } = {
  memos: 'Cabinet Memos',
  committees: 'Committees',
  meetings: 'Meetings',
  decisions: 'Decisions',
  actionLetters: 'Action Letters',
  users: 'User Management',
  reports: 'Reports & Analytics',
  settings: 'System Settings',
};

// Permission labels for UI display
export const permissionLabels: { [key: string]: string } = {
  create: 'Create',
  read: 'View',
  update: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  manage: 'Manage',
  chair: 'Chair',
  review: 'Review',
  recommend: 'Recommend',
  submit: 'Submit',
  participate: 'Participate',
  implement: 'Implement',
  assign: 'Assign',
  export: 'Export',
  generate: 'Generate',
  coordinate: 'Coordinate',
  sign: 'Sign',
  legal_review: 'Legal Review',
  comment: 'Comment',
  legal_advisor: 'Legal Advisor',
  certify: 'Certify',
  present: 'Present',
  technical_advisor: 'Technical Advisor',
  report: 'Report',
  monitor: 'Monitor',
  prepare: 'Prepare',
  support: 'Support',
  draft: 'Draft',
  minute: 'Take Minutes',
  process: 'Process',
  track: 'Track',
  schedule: 'Schedule',
  reset: 'Reset Passwords',
  system_logs: 'System Logs',
  system_config: 'System Configuration',
  assign_roles: 'Assign Roles',
};

// Fetch role permissions from API
async function fetchRolePermissions(roleKey: string): Promise<any> {
  try {
    const response = await fetch(`/api/roles/permissions?roleKey=${roleKey}`);
    if (response.ok) {
      const data = await response.json();
      return data.permissions;
    }
  } catch (error) {
    console.error('Error fetching role permissions:', error);
  }
  return null;
}

export const usePermissions = () => {
  const { data: session } = useSession();
  const { currentUserRole, permissions } = useAppSelector((state) => state.roles);
  const [dbPermissions, setDbPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get role from session or Redux store
  const userRole = useMemo(() => {
    const role = currentUserRole?.name || session?.user?.role;
    if (!role) return null;
    return role.toLowerCase().replace(/\s+/g, '_');
  }, [currentUserRole, session?.user?.role]);

  // Fetch permissions from database when role changes
  useEffect(() => {
    if (userRole) {
      setLoading(true);
      fetchRolePermissions(userRole).then(perms => {
        setDbPermissions(perms);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [userRole]);

  // Get permissions for the current role (prefer DB, fallback to Redux)
  const userPermissions = useMemo(() => {
    if (dbPermissions) {
      // Convert JSONB permissions to array of strings
      const perms: string[] = [];
      Object.entries(dbPermissions).forEach(([module, actions]: [string, any]) => {
        actions.forEach((action: string) => {
          perms.push(`${module}_${action}`);
        });
      });
      return perms;
    }
    
    if (currentUserRole?.permissions && currentUserRole.permissions.length > 0) {
      return currentUserRole.permissions;
    }
    
    return [];
  }, [dbPermissions, currentUserRole]);

  // Check if user has a specific permission
  const hasPermission = (permissionId: string): boolean => {
    if (loading) return false;
    if (!userPermissions.length) return false;
    
    // Admin and sysadmin have all permissions
    if (userRole === 'admin' || userRole === 'sysadmin') {
      return true;
    }
    
    return userPermissions.includes(permissionId);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionIds: string[]): boolean => {
    if (loading) return false;
    if (!userPermissions.length) return false;
    
    if (userRole === 'admin' || userRole === 'sysadmin') {
      return true;
    }
    
    return permissionIds.some(permissionId => userPermissions.includes(permissionId));
  };

  // Check if user has all specified permissions
  const hasAllPermissions = (permissionIds: string[]): boolean => {
    if (loading) return false;
    if (!userPermissions.length) return false;
    
    if (userRole === 'admin' || userRole === 'sysadmin') {
      return true;
    }
    
    return permissionIds.every(permissionId => userPermissions.includes(permissionId));
  };

  // Check module-level permission
  const can = (module: string, action: string): boolean => {
    const permissionId = `${module}_${action}`;
    return hasPermission(permissionId);
  };

  // Check if user can access a specific module
  const canAccessModule = (module: string): boolean => {
    const modulePermissions = userPermissions.filter(perm => perm.startsWith(`${module}_`));
    return modulePermissions.length > 0;
  };

  // Get all permissions for a specific module
  const getModulePermissions = (module: string): string[] => {
    return userPermissions
      .filter(perm => perm.startsWith(`${module}_`))
      .map(perm => perm.replace(`${module}_`, ''));
  };

  // Get permissions grouped by module
  const getGroupedPermissions = () => {
    const grouped: { [key: string]: string[] } = {};
    
    userPermissions.forEach(permission => {
      const [module, action] = permission.split('_');
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(action);
    });
    
    return grouped;
  };

  // Check role hierarchy
  const isRoleAtLeast = (minRole: string): boolean => {
    if (!userRole) return false;
    
    const normalizedMinRole = minRole.toLowerCase().replace(/\s+/g, '_');
    const currentLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[normalizedMinRole];
    
    if (!currentLevel || !requiredLevel) return false;
    
    return currentLevel <= requiredLevel;
  };

  // Check if user has a specific role
  const hasRole = (roleName: string): boolean => {
    if (!userRole) return false;
    const normalizedRoleName = roleName.toLowerCase().replace(/\s+/g, '_');
    return userRole === normalizedRoleName;
  };

  // Check if user is a high-level executive
  const isExecutive = (): boolean => {
    return ['president', 'deputy_president', 'prime_cabinet_secretary'].includes(userRole || '');
  };

  // Check if user is a cabinet member
  const isCabinetMember = (): boolean => {
    return ['cabinet_secretary', 'attorney_general'].includes(userRole || '');
  };

  // Check if user is an administrator
  const isAdmin = (): boolean => {
    return userRole === 'admin' || userRole === 'sysadmin';
  };

  // Get user's role level
  const getRoleLevel = (): number | null => {
    if (!userRole) return null;
    return roleHierarchy[userRole] || null;
  };

  // Get formatted role name for display
  const getFormattedRoleName = (): string => {
    if (!userRole) return 'User';
    
    const roleNames: { [key: string]: string } = {
      president: 'President',
      deputy_president: 'Deputy President',
      prime_cabinet_secretary: 'Prime Cabinet Secretary',
      cabinet_secretariat: 'Cabinet Secretariat',
      attorney_general: 'Attorney General',
      cabinet_secretary: 'Cabinet Secretary',
      principal_secretary: 'Principal Secretary',
      director: 'Director',
      assistant_director: 'Assistant Director',
      co_officer: 'Cabinet Office Officer',
      sysadmin: 'System Administrator',
      admin: 'Business Administrator',
    };
    
    return roleNames[userRole] || userRole.charAt(0).toUpperCase() + userRole.slice(1);
  };

  // Get user's role color for UI badges
  const getRoleColor = (): string => {
    const roleColors: { [key: string]: string } = {
      president: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      deputy_president: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      prime_cabinet_secretary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      cabinet_secretariat: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      attorney_general: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      cabinet_secretary: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      principal_secretary: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      director: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      assistant_director: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      co_officer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      sysadmin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      admin: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    };
    
    return roleColors[userRole || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  // Get permissions by module (from Redux store)
  const getPermissionsByModule = (module: string) => {
    return permissions.filter(permission => permission.module === module);
  };

  // Get all user permissions (from Redux store)
  const getUserPermissionsList = () => {
    if (!currentUserRole) return [];
    return permissions.filter(permission => 
      currentUserRole.permissions.includes(permission.id)
    );
  };

  // Get visible dashboard widgets based on role
  const getDashboardWidgets = () => {
    const widgetsConfig: { [key: string]: string[] } = {
      president: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'approvals'],
      deputy_president: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems'],
      prime_cabinet_secretary: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'coordination'],
      cabinet_secretariat: ['upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'queue'],
      attorney_general: ['upcomingMeetings', 'recentMemos', 'legalReviews'],
      cabinet_secretary: ['upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'ministryMetrics'],
      principal_secretary: ['upcomingMeetings', 'recentMemos', 'actionItems', 'departmentMetrics'],
      director: ['upcomingMeetings', 'recentMemos', 'actionItems'],
      assistant_director: ['upcomingMeetings', 'recentMemos'],
      co_officer: ['upcomingMeetings', 'recentMemos', 'actionItems', 'coordination'],
      sysadmin: ['systemMetrics', 'upcomingMeetings', 'recentMemos', 'auditLogs'],
      admin: ['metrics', 'upcomingMeetings', 'workflow', 'recentMemos', 'actionItems', 'userManagement'],
    };
    
    return widgetsConfig[userRole || 'director'] || widgetsConfig.director;
  };

  // Check if user can view a specific dashboard widget
  const canViewWidget = (widgetName: string): boolean => {
    const widgets = getDashboardWidgets();
    return widgets.includes(widgetName);
  };

  return {
    loading,
    // Core permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canAccessModule,
    getModulePermissions,
    getGroupedPermissions,
    
    // Role checks
    hasRole,
    isRoleAtLeast,
    isExecutive,
    isCabinetMember,
    isAdmin,
    getRoleLevel,
    getFormattedRoleName,
    getRoleColor,
    
    // UI helpers
    getPermissionsByModule,
    getUserPermissions: getUserPermissionsList,
    getDashboardWidgets,
    canViewWidget,
    
    // Data
    currentRole: currentUserRole,
    userRole,
    userPermissions,
    allPermissions: permissions,
    
    // Constants for UI
    moduleLabels,
    permissionLabels,
  };
};
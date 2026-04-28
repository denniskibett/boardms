// src/lib/auth/permissions.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

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

// Fetch role permissions from database
async function getRolePermissionsFromDB(roleKey: string): Promise<any> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('system_roles')
    .select('permissions')
    .eq('role_key', roleKey)
    .single();
  
  if (error || !data) {
    console.error('Error fetching role permissions:', error);
    return null;
  }
  
  return data.permissions;
}

export async function getUserRole() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) return null;
  return session.user.role.toLowerCase().replace(/\s+/g, '_');
}

export async function hasServerPermission(module: string, permission: string) {
  const role = await getUserRole();
  if (!role) return false;
  
  // Admin and sysadmin have all permissions
  if (role === 'admin' || role === 'sysadmin') {
    return true;
  }
  
  // Fetch permissions from database
  const rolePermissions = await getRolePermissionsFromDB(role);
  if (!rolePermissions) return false;
  
  const modulePerms = rolePermissions[module];
  if (!modulePerms) return false;
  
  return modulePerms.includes(permission);
}

// Direct permission check using permission key (e.g., 'memos_create')
export async function hasServerPermissionKey(permissionKey: string) {
  const [module, action] = permissionKey.split('_');
  return hasServerPermission(module, action);
}

export async function isRoleAtLeast(minRole: string) {
  const currentRole = await getUserRole();
  if (!currentRole) return false;
  
  const currentLevel = roleHierarchy[currentRole];
  const requiredLevel = roleHierarchy[minRole];
  
  if (!currentLevel || !requiredLevel) return false;
  
  return currentLevel <= requiredLevel;
}

export async function canAccessResource(resourceType: string, resourceCreatorRole?: string) {
  const currentRole = await getUserRole();
  if (!currentRole) return false;
  
  // Administrators can access everything
  if (currentRole === 'admin' || currentRole === 'sysadmin') return true;
  
  // Executives can access all resources
  if (['president', 'deputy_president', 'prime_cabinet_secretary'].includes(currentRole)) {
    return true;
  }
  
  // For other roles, implement specific logic based on resource type
  switch (resourceType) {
    case 'memo':
      if (currentRole === 'cabinet_secretary' && resourceCreatorRole === 'principal_secretary') {
        return true;
      }
      break;
    case 'committee':
      break;
    default:
      return false;
  }
  
  return false;
}
// lib/hooks/usePermissions.ts
import { useAppSelector } from '@/lib/store/hooks';

export const usePermissions = () => {
  const { currentUserRole, permissions } = useAppSelector((state) => state.roles);
  
  const hasPermission = (permissionId: string): boolean => {
    if (!currentUserRole) return false;
    return currentUserRole.permissions.includes(permissionId);
  };

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    if (!currentUserRole) return false;
    return permissionIds.some(permissionId => currentUserRole.permissions.includes(permissionId));
  };

  const hasAllPermissions = (permissionIds: string[]): boolean => {
    if (!currentUserRole) return false;
    return permissionIds.every(permissionId => currentUserRole.permissions.includes(permissionId));
  };

  const getPermissionsByModule = (module: string) => {
    return permissions.filter(permission => permission.module === module);
  };

  const getUserPermissions = () => {
    if (!currentUserRole) return [];
    return permissions.filter(permission => 
      currentUserRole.permissions.includes(permission.id)
    );
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByModule,
    getUserPermissions,
    currentRole: currentUserRole,
    allPermissions: permissions,
  };
};
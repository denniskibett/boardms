// src/lib/auth/roleGuard.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { hasServerPermissionKey, isRoleAtLeast } from './permissions';

export async function requirePermission(permissionKey: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const hasPermission = await hasServerPermissionKey(permissionKey);
  
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }
  
  return null;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = session.user?.role?.toLowerCase().replace(/\s+/g, '_');
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient role' }, { status: 403 });
  }
  
  return null;
}

export async function requireRoleAtLeast(minRole: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const hasSufficientRole = await isRoleAtLeast(minRole);
  
  if (!hasSufficientRole) {
    return NextResponse.json({ error: 'Forbidden: Insufficient role level' }, { status: 403 });
  }
  
  return null;
}

// Higher-order function for API route protection
export function withPermission(permissionKey: string) {
  return async function handler(req: Request, context: any, next: Function) {
    const permissionCheck = await requirePermission(permissionKey);
    if (permissionCheck) return permissionCheck;
    return next();
  };
}

// Higher-order function for role-based protection
export function withRole(allowedRoles: string[]) {
  return async function handler(req: Request, context: any, next: Function) {
    const roleCheck = await requireRole(allowedRoles);
    if (roleCheck) return roleCheck;
    return next();
  };
}
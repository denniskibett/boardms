// src/components/auth/RoleGuard.tsx
"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requiredPermission,
  fallback, 
  redirectTo = "/dashboard" 
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission, hasRole, isRoleAtLeast } = usePermissions();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    let hasAccess = true;

    // Check role-based access
    if (allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        hasAccess = false;
      }
    }

    // Check permission-based access
    if (requiredPermission && hasAccess) {
      if (!hasPermission(requiredPermission)) {
        hasAccess = false;
      }
    }

    if (!hasAccess) {
      if (fallback) {
        return;
      }
      router.push(redirectTo);
    }
  }, [session, status, allowedRoles, requiredPermission, redirectTo, fallback, router, hasPermission, hasRole]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  let hasAccess = true;

  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => hasRole(role));
    if (!hasRequiredRole) hasAccess = false;
  }

  if (requiredPermission && hasAccess) {
    if (!hasPermission(requiredPermission)) hasAccess = false;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

// Permission-specific guard
export function PermissionGuard({ 
  children, 
  permission,
  fallback 
}: {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
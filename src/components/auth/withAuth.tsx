// src/components/auth/withAuth.tsx
"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from 'next-auth/react';
import { useAppSelector } from '@/lib/store/hooks';

export const withAuth = (WrappedComponent: React.ComponentType, requiredPermissions?: string[]) => {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    const { hasAnyPermission, currentRole } = usePermissions();
    const { data: session, status } = useSession();
    
    // Get sync status from Redux to know when user data is loaded
    const { isSyncing, lastSynced } = useAppSelector((state) => state.user);
    
    const [authChecked, setAuthChecked] = useState(false);

    console.log('withAuth Debug:', {
      session: session ? 'exists' : 'none',
      sessionStatus: status,
      currentRole: currentRole ? currentRole.name : 'none',
      isSyncing,
      lastSynced,
      requiredPermissions
    });

    useEffect(() => {
      // Don't do anything while session is loading
      if (status === 'loading') {
        console.log('Session loading...');
        return;
      }

      // If no session after loading is complete, redirect to signin
      if (status === 'unauthenticated' || !session) {
        console.log('No session found, redirecting to signin');
        router.push('/auth/signin');
        return;
      }

      // If we have a session but user data is still syncing, wait
      if (session && isSyncing) {
        console.log('User data still syncing, waiting...');
        return;
      }

      // If we have a session but no role after sync completed
      if (session && !isSyncing && !currentRole) {
        console.log('Session exists but no role after sync, this might indicate a problem');
        // You might want to handle this case differently
        // For now, let's wait a bit more or show an error
        return;
      }

      // Check permissions if required
      if (requiredPermissions && currentRole) {
        const hasPermissions = hasAnyPermission(requiredPermissions);
        console.log('Permission check:', { requiredPermissions, hasPermissions });
        
        if (!hasPermissions) {
          console.log('Permission check failed, redirecting to unauthorized');
          router.push('/unauthorized');
          return;
        }
      }

      // All checks passed
      console.log('All auth checks passed, rendering component');
      setAuthChecked(true);
    }, [session, status, currentRole, requiredPermissions, router, hasAnyPermission, isSyncing]);

    // Show loading state while checking auth
    if (status === 'loading' || (session && isSyncing) || !authChecked) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {status === 'loading' 
                ? 'Checking authentication...' 
                : isSyncing 
                  ? 'Loading user data...' 
                  : 'Verifying permissions...'
              }
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Session: {status} | Role: {currentRole?.name || 'loading...'} | Sync: {isSyncing ? 'in progress' : 'complete'}
            </p>
          </div>
        </div>
      );
    }

    console.log('Rendering wrapped component');
    return <WrappedComponent {...props} />;
  };
};
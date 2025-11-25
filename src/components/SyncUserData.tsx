// components/SyncUserData.tsx
'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { syncUserData } from '@/lib/store/slices/userSlice';
import { checkAuth } from '@/lib/store/slices/authSlice';

export default function SyncUserData() {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { currentUser } = useAppSelector((state) => state.user);

  useEffect(() => {
    // Check auth on mount
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    // Sync user data when auth user changes
    if (authUser?.id) {
      console.log('🔄 Auth user detected, syncing data...', authUser.id);
      dispatch(syncUserData(authUser.id));
    }
  }, [authUser, dispatch]);

  // Log current state for debugging
  useEffect(() => {
    console.log('📊 Current Redux State:', {
      authUser: authUser,
      currentUser: currentUser,
      hasAuthUser: !!authUser?.id,
      hasCurrentUser: !!currentUser?.id
    });
  }, [authUser, currentUser]);

  return null;
}
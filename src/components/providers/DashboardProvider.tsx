// src/components/providers/DashboardProvider.tsx
'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';
import { setDashboardData } from '@/lib/store/slices/dashboardSlice';

interface DashboardProviderProps {
  children: React.ReactNode;
  initialData: any;
}

// Create client-side store instance
const clientStore = makeStore();

export default function DashboardProvider({ children, initialData }: DashboardProviderProps) {
  // Initialize Redux store with server data
  React.useEffect(() => {
    clientStore.dispatch(setDashboardData(initialData));
  }, [initialData]);

  return <Provider store={clientStore}>{children}</Provider>;
}
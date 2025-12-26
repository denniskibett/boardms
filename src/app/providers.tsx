// app/providers.tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import StoreProvider from "@/components/providers/StoreProvider";
import React, { useEffect } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize system settings from server-side data
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__INITIAL_SYSTEM_SETTINGS__) {
      // Initialize theme colors based on system settings
      const settings = window.__INITIAL_SYSTEM_SETTINGS__;
      if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
        document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
      }
    }
  }, []);

  return (
    <StoreProvider>
      <SessionProvider 
        refetchInterval={5 * 60} // Refetch session every 5 minutes
        refetchOnWindowFocus={true}
      >
        <ThemeProvider>
          <SystemSettingsProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </SystemSettingsProvider>
        </ThemeProvider>
      </SessionProvider>
    </StoreProvider>
  );
}
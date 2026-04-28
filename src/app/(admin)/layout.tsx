// src/app/(admin)/layout.tsx - FIXED VERSION
"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { 
    getPrimaryColor, 
    getSecondaryColor, 
    getSystemName,
    getSystemDescription,
    getLogo,
    getTimezone,
    settings,
    loading: settingsLoading 
  } = useSystemSettings(); // 👈 Get all needed functions here
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading" || settingsLoading) return;
    
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router, settingsLoading]);

  // Set CSS variables for dynamic theming
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--primary-color', getPrimaryColor());
      document.documentElement.style.setProperty('--secondary-color', getSecondaryColor());
      
      // Also set Tailwind-compatible CSS variables for components
      document.documentElement.style.setProperty('--brand-500', getPrimaryColor());
      document.documentElement.style.setProperty('--sidebar-active', getPrimaryColor());
      document.documentElement.style.setProperty('--sidebar-hover', getSecondaryColor());
      
      // Generate lighter/darker variants for the color palette
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      const primaryRgb = hexToRgb(getPrimaryColor());
      if (primaryRgb) {
        // Set RGB values for rgba() usage
        document.documentElement.style.setProperty(
          '--primary-color-rgb', 
          `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
        );
        
        // Set lighter variant (10% opacity for backgrounds)
        document.documentElement.style.setProperty(
          '--primary-color-light', 
          `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`
        );
        
        // Set medium light variant (20% opacity for hover states)
        document.documentElement.style.setProperty(
          '--primary-color-medium', 
          `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`
        );
      }

      // Set favicon dynamically
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = getLogo('icon') || '/favicon.ico';
      }

      // Set document title with system name - but only on client
      document.title = `${getSystemName()} | Admin Dashboard`;
    }
  }, [mounted, getPrimaryColor, getSecondaryColor, getSystemName, getLogo]);

  // Handle hydration mismatch by not rendering dynamic content until mounted
  const systemDescription = mounted ? getSystemDescription() : '';
  const primaryColor = mounted ? getPrimaryColor() : '#3b82f6'; // Fallback color
  const systemName = mounted ? getSystemName() : 'Loading...';
  const timezone = mounted ? getTimezone() : '';

  // Show loading state while checking session or settings
  if (status === "loading" || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderBottomColor: primaryColor }}
          ></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading {systemName}...
          </p>
          {systemDescription && mounted && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              {systemDescription}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Don't render layout if no session
  if (!session) {
    return null;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <Backdrop />
      
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>

      {/* Floating Action Button with dynamic colors - only show when mounted */}
      {mounted && (
        <button
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg text-white hidden lg:flex items-center justify-center transition-transform hover:scale-110"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 10px 15px -3px ${primaryColor}40`
          }}
          onClick={() => {
            // Quick action - could open create modal
            console.log('Quick action clicked');
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = getSecondaryColor();
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}

      {/* Optional: System info footer - only show when mounted to prevent hydration mismatch */}
      {mounted && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 left-6 z-40 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
          {systemName} v{settings.version} | {timezone}
        </div>
      )}
    </div>
  );
}
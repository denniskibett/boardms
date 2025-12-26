// context/SystemSettingsContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SystemSettings {
  id: number;
  name: string;
  version: string;
  timezone: string;
  date_format: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  meeting_reminders: boolean;
  deadline_alerts: boolean;
  weekly_reports: boolean;
  session_timeout: number;
  password_policy: string;
  two_factor_auth: boolean;
  ip_whitelist: string[];
  audit_log_retention: number;
  smtp_enabled: boolean;
  smtp_server: string;
  smtp_port: number;
  file_storage: string;
  max_file_size: number;
  logo_auth: string;
  logo_dark: string;
  logo_icon: string;
  logo_primary: string;
  primary_color: string;
  secondary_color: string;
  favicon: string;
  system_email: string;
  system_email_name: string;
  copyright_text: string;
  description?: string;
  timezones?: Array<{ name: string; abbrev: string; utc_offset: string }>;
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;

  getLogo: (type?: 'auth' | 'dark' | 'icon' | 'primary') => string;
  getSystemName: () => string;
  getSystemEmail: () => string;
  getSystemEmailName: () => string;
  getCopyrightText: () => string;
  getPrimaryColor: () => string;
  getSecondaryColor: () => string;
  getTimezone: () => string;
  getDateFormat: () => string;
  isTwoFactorEnabled: () => boolean;
  getPasswordPolicy: () => string;
  getSessionTimeout: () => number;
  getPasswordRequirements: () => string;
  validatePassword: (password: string) => boolean;
  getIPWhitelist: () => string[];
  isNotificationEnabled: (type: string) => boolean;
  getSystemDescription: () => string;
}

const defaultSettings: SystemSettings = {
  id: 1,
  name: 'boardms',
  version: '1.0.0',
  timezone: 'Africa/Nairobi',
  date_format: 'DD/MM/YYYY',
  language: 'en',
  email_notifications: true,
  push_notifications: true,
  meeting_reminders: true,
  deadline_alerts: true,
  weekly_reports: false,
  session_timeout: 30,
  password_policy: 'strong',
  two_factor_auth: true,
  ip_whitelist: ['192.168.1.0/24'],
  audit_log_retention: 365,
  smtp_enabled: true,
  smtp_server: 'smtp.gov.go.ke',
  smtp_port: 587,
  file_storage: 'local',
  max_file_size: 10,
  logo_auth: '/images/logo/auth-logo.svg',
  logo_dark: '/images/logo/logo-dark.svg',
  logo_icon: '/images/logo/logo-icon.svg',
  logo_primary: '/images/logo/logo.svg',
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  favicon: '/favicon.ico',
  system_email: 'noreply@cabinet.go.ke',
  system_email_name: 'boardms',
  copyright_text: `© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`,
  description: 'Government Meeting Management Platform for boardms',
};

// Declare global window type for initial settings
declare global {
  interface Window {
    __INITIAL_SYSTEM_SETTINGS__?: SystemSettings;
  }
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(
  undefined
);

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    // Initialize with server-side data if available
    if (typeof window !== 'undefined' && window.__INITIAL_SYSTEM_SETTINGS__) {
      const serverSettings = window.__INITIAL_SYSTEM_SETTINGS__;
      console.log('📥 Using server-side system settings:', {
        name: serverSettings.name,
        logo: serverSettings.logo_primary,
        color: serverSettings.primary_color
      });
      
      // Apply CSS variables for colors
      if (serverSettings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', serverSettings.primary_color);
      }
      if (serverSettings.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', serverSettings.secondary_color);
      }
      
      return { ...defaultSettings, ...serverSettings };
    }
    return defaultSettings;
  });
  
  const [loading, setLoading] = useState(() => {
    // If we have server-side data, we're not loading
    return !(typeof window !== 'undefined' && window.__INITIAL_SYSTEM_SETTINGS__);
  });
  
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching system settings from API...');
      const response = await fetch('/api/system-settings');

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      const mergedSettings = { ...defaultSettings, ...data };
      
      // Update CSS variables
      document.documentElement.style.setProperty('--primary-color', mergedSettings.primary_color);
      document.documentElement.style.setProperty('--secondary-color', mergedSettings.secondary_color);
      
      setSettings(mergedSettings);
      
      console.log('✅ System settings loaded from API:', {
        name: mergedSettings.name,
        timezone: mergedSettings.timezone,
        logo: mergedSettings.logo_primary,
        color: mergedSettings.primary_color
      });
      
    } catch (err) {
      console.error('❌ Failed to fetch system settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Keep existing settings (either default or server-side)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch from API if we don't have server-side data
    if (!window.__INITIAL_SYSTEM_SETTINGS__) {
      fetchSettings();
    } else {
      // We already have server-side data, just set loading to false
      setLoading(false);
    }
  }, []);

  /* =======================
     Helper Methods
  ======================== */

  const getLogo = (
    type: 'auth' | 'dark' | 'icon' | 'primary' = 'primary'
  ): string => {
    const logo = {
      'auth': settings.logo_auth,
      'dark': settings.logo_dark,
      'icon': settings.logo_icon,
      'primary': settings.logo_primary
    }[type];
    
    return logo || settings.logo_primary;
  };

  const getSystemName = () => settings.name;
  const getSystemDescription = () => settings.description || '';
  const getSystemEmail = () => settings.system_email;
  const getSystemEmailName = () => settings.system_email_name;
  const getPrimaryColor = () => settings.primary_color;
  const getSecondaryColor = () => settings.secondary_color;
  const getTimezone = () => settings.timezone;
  const getDateFormat = () => settings.date_format;
  const isTwoFactorEnabled = () => settings.two_factor_auth;
  const getPasswordPolicy = () => settings.password_policy;
  const getSessionTimeout = () => settings.session_timeout;

  const getCopyrightText = () => {
    const currentYear = new Date().getFullYear().toString();
    return settings.copyright_text.replace(/\{year\}/g, currentYear);
  };

  const getPasswordRequirements = (): string => {
    switch (settings.password_policy) {
      case 'basic':
        return 'At least 6 characters';
      case 'medium':
        return 'At least 8 characters with letters and numbers';
      case 'strong':
        return 'At least 12 characters with uppercase, lowercase, numbers, and special characters';
      default:
        return 'Minimum 8 characters required';
    }
  };

  const validatePassword = (password: string): boolean => {
    const policy = settings.password_policy;

    if (policy === 'basic') return password.length >= 6;

    if (policy === 'medium') {
      return (
        password.length >= 8 &&
        /[a-zA-Z]/.test(password) &&
        /[0-9]/.test(password)
      );
    }

    if (policy === 'strong') {
      return (
        password.length >= 12 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password)
      );
    }

    return true;
  };

  const isNotificationEnabled = (type: string): boolean => {
    const map: Record<string, boolean> = {
      email: settings.email_notifications,
      push: settings.push_notifications,
      meeting: settings.meeting_reminders,
      deadline: settings.deadline_alerts,
      weekly: settings.weekly_reports,
    };

    return map[type] ?? true;
  };

  const value: SystemSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
    getLogo,
    getSystemName,
    getSystemDescription,
    getSystemEmail,
    getSystemEmailName,
    getCopyrightText,
    getPrimaryColor,
    getSecondaryColor,
    getTimezone,
    getDateFormat,
    isTwoFactorEnabled,
    getPasswordPolicy,
    getSessionTimeout,
    getPasswordRequirements,
    validatePassword,
    getIPWhitelist: () => settings.ip_whitelist || [],
    isNotificationEnabled,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error(
      'useSystemSettings must be used within a SystemSettingsProvider'
    );
  }
  return context;
};
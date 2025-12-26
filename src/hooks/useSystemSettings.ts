// hooks/useSystemSettings.ts
import { useState, useEffect } from 'react';

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
  
  // Logo fields
  logo_auth: string;
  logo_dark: string;
  logo_icon: string;
  logo_primary: string;
  
  // Branding fields
  primary_color: string;
  secondary_color: string;
  favicon: string;
  system_email: string;
  system_email_name: string;
  copyright_text: string;
  
  // For dropdowns
  timezones: { name: string; abbrev: string; utc_offset: string }[];
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
  timezones: [],
  
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
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
        
      } catch (err) {
        console.error('Failed to fetch system settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Helper methods for logos
  const getLogo = (type: 'auth' | 'dark' | 'icon' | 'primary'): string => {
    switch (type) {
      case 'auth': return settings.logo_auth;
      case 'dark': return settings.logo_dark;
      case 'icon': return settings.logo_icon;
      case 'primary': return settings.logo_primary;
      default: return settings.logo_primary;
    }
  };

  // Helper method for branding
  const getSystemName = () => settings.name;
  const getSystemEmail = () => settings.system_email;
  const getCopyrightText = () => settings.copyright_text;
  const getPrimaryColor = () => settings.primary_color;

  // Helper method for security
  const getSessionTimeout = () => settings.session_timeout;
  const getPasswordPolicy = () => settings.password_policy;
  const isTwoFactorRequired = () => settings.two_factor_auth;
  const getIPWhitelist = () => settings.ip_whitelist;
  
  const getPasswordRequirements = (): string => {
    switch (settings.password_policy) {
      case 'basic': return 'Minimum 6 characters';
      case 'medium': return 'Minimum 8 characters with letters and numbers';
      case 'strong': return 'Minimum 12 characters with uppercase, lowercase, numbers and special characters';
      default: return 'Minimum 8 characters required';
    }
  };

  // Check if feature is enabled
  const isFeatureEnabled = (feature: string): boolean => {
    const featureMap: Record<string, boolean> = {
      'email_notifications': settings.email_notifications,
      'push_notifications': settings.push_notifications,
      'meeting_reminders': settings.meeting_reminders,
      'deadline_alerts': settings.deadline_alerts,
      'weekly_reports': settings.weekly_reports,
      'two_factor_auth': settings.two_factor_auth,
    };
    return featureMap[feature] ?? true;
  };

  return {
    // Core state
    settings,
    isLoading,
    error,
    
    // Logo methods
    getLogo,
    authLogo: settings.logo_auth,
    darkLogo: settings.logo_dark,
    iconLogo: settings.logo_icon,
    primaryLogo: settings.logo_primary,
    
    // Branding methods
    getSystemName,
    getSystemEmail,
    getCopyrightText,
    getPrimaryColor,
    systemName: settings.name,
    copyrightText: settings.copyright_text,
    systemEmail: settings.system_email,
    
    // Security methods
    getSessionTimeout,
    getPasswordPolicy,
    getPasswordRequirements,
    isTwoFactorRequired,
    getIPWhitelist,
    sessionTimeout: settings.session_timeout,
    passwordPolicy: settings.password_policy,
    twoFactorRequired: settings.two_factor_auth,
    ipWhitelist: settings.ip_whitelist,
    
    // Feature checks
    isFeatureEnabled,
  };
}
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
  timezones: { name: string; abbrev: string; utc_offset: string }[];
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    id: 1,
    name: 'E-Cabinet System',
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
    timezones: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setSettings(data);
        
        console.log('🌍 System settings loaded:', {
          name: data.name,
          timezone: data.timezone,
          date_format: data.date_format
        });
        
      } catch (err) {
        console.error('Failed to fetch system settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading, error };
}
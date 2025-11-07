import { useState, useEffect } from 'react';

interface SystemSettings {
  timezone: string;
  date_format: string;
  timezones: { name: string; abbrev: string; utc_offset: string }[];
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    timezone: 'UTC',
    date_format: 'DD-MM-YYYY',
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
        setSettings({
          timezone: data.timezone || 'UTC',
          date_format: data.date_format || 'YYYY-MM-DD',
          timezones: data.timezones || []
        });
        
        console.log('🌍 System settings loaded:', {
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
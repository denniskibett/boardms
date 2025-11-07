// lib/actions/settings.ts
'use server';

import pool from '@/lib/db';

export async function getSystemSettings() {
  try {
    // Fetch system settings
    const settingsResult = await pool.query(
      'SELECT * FROM system_settings ORDER BY id DESC LIMIT 1'
    );

    // Fetch all PostgreSQL timezones dynamically
    const timezonesResult = await pool.query(`
      SELECT 
        name, 
        abbrev, 
        utc_offset,
        RANK() OVER (ORDER BY 
          CASE 
            WHEN name = 'UTC' THEN 0
            WHEN name LIKE 'Africa/%' THEN 1
            ELSE 2
          END,
          name
        ) as priority
      FROM pg_timezone_names 
      WHERE NOT (abbrev = 'zzz' AND utc_offset = '00:00:00'::interval)
      ORDER BY priority, name
    `);

    const timezones = timezonesResult.rows.map(tz => ({
      name: tz.name,
      abbrev: tz.abbrev,
      utc_offset: this.formatUtcOffset(tz.utc_offset)
    }));

    const defaultSettings = {
      id: 'default',
      name: 'E-Cabinet System',
      slogan: 'Digital Governance Platform',
      logo: '/images/logo/logo.svg',
      logo_dark: '/images/logo/logo-dark.svg',
      logo_icon: '/images/logo/logo-icon.svg',
      favicon: '/favicon.ico',
      theme: 'light',
      language: 'en',
      date_format: 'YYYY-MM-DD',
      timezone: 'UTC',
      timezones, 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return settingsResult.rows[0] 
      ? { ...defaultSettings, ...settingsResult.rows[0], timezones } 
      : defaultSettings;
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    // Return fallback settings
    return {
      id: 'default',
      name: 'E-Cabinet System',
      slogan: 'Digital Governance Platform',
      logo: '/images/logo/logo.svg',
      logo_dark: '/images/logo/logo-dark.svg',
      logo_icon: '/images/logo/logo-icon.svg',
      favicon: '/favicon.ico',
      theme: 'light',
      language: 'en',
      date_format: 'YYYY-MM-DD',
      timezone: 'UTC',
      timezones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Helper function to format UTC offset
function formatUtcOffset(offset: any): string {
  if (!offset) return '+00:00';
  
  const offsetStr = offset.toString();
  const matches = offsetStr.match(/([+-]?)(\d+):(\d+):(\d+)/);
  
  if (matches) {
    const sign = matches[1];
    const hours = matches[2].padStart(2, '0');
    const minutes = matches[3].padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
  }
  
  return '+00:00';
}
// lib/actions/settings.ts
'use server';

import pool from '@/lib/db';

export async function getSystemSettings() {
  try {
    console.log('🔄 Fetching system settings from database...');
    
    // Fetch system settings
    const settingsResult = await pool.query(
      'SELECT * FROM system_settings ORDER BY id DESC LIMIT 1'
    );

    // Fetch all PostgreSQL timezones dynamically
    const timezonesResult = await pool.query(`
      SELECT 
        name, 
        abbrev, 
        utc_offset
      FROM pg_timezone_names 
      WHERE NOT (abbrev = 'zzz' AND utc_offset = '00:00:00'::interval)
        AND name NOT LIKE 'posix/%'
        AND name NOT LIKE 'right/%'
      ORDER BY 
        CASE 
          WHEN name = 'UTC' THEN 0
          WHEN name = 'Africa/Nairobi' THEN 1
          WHEN name LIKE 'Africa/%' THEN 2
          ELSE 3
        END,
        name
      LIMIT 200
    `);

    // Format timezones properly
    const timezones = timezonesResult.rows.map(tz => ({
      name: tz.name,
      abbrev: tz.abbrev,
      utc_offset: formatUtcOffset(tz.utc_offset)
    }));

    const defaultSettings = {
      id: 'default',
      name: 'E-Cabinet System',
      slogan: 'Digital Governance Platform',
      logo: '/images/logo/logo.svg',
      logo_dark: '/images/logo/logo-dark.svg',
      logo_icon: '/images/logo/logo-icon.svg',
      favicon: '/favicon.ico',
      theme: 'light',
      language: 'en',
      date_format: 'DD/MM/YYYY', // Changed default to match your preference
      timezone: 'Africa/Nairobi', // Changed default to Nairobi
      timezones, 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const finalSettings = settingsResult.rows[0] 
      ? { ...defaultSettings, ...settingsResult.rows[0], timezones } 
      : defaultSettings;

    console.log('✅ System settings loaded:', {
      timezone: finalSettings.timezone,
      date_format: finalSettings.date_format,
      timezonesCount: finalSettings.timezones.length
    });

    return finalSettings;
  } catch (error) {
    console.error('❌ Failed to fetch system settings:', error);
    // Return Nairobi-focused fallback settings
    return {
      id: 'default',
      name: 'E-Cabinet System',
      slogan: 'Digital Governance Platform',
      logo: '/images/logo/logo.svg',
      logo_dark: '/images/logo/logo-dark.svg',
      logo_icon: '/images/logo/logo-icon.svg',
      favicon: '/favicon.ico',
      theme: 'light',
      language: 'en',
      date_format: 'DD/MM/YYYY',
      timezone: 'Africa/Nairobi',
      timezones: [
        { name: 'Africa/Nairobi', abbrev: 'EAT', utc_offset: '+03:00' },
        { name: 'UTC', abbrev: 'UTC', utc_offset: '+00:00' }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Helper function to format UTC offset
function formatUtcOffset(offset: any): string {
  if (!offset) return '+00:00';
  
  try {
    const offsetStr = offset.toString();
    const matches = offsetStr.match(/([+-]?)(\d+):(\d+):(\d+)/);
    
    if (matches) {
      const sign = matches[1] || '+';
      const hours = matches[2].padStart(2, '0');
      const minutes = matches[3].padStart(2, '0');
      return `${sign}${hours}:${minutes}`;
    }
  } catch (error) {
    console.error('Error formatting UTC offset:', error);
  }
  
  return '+00:00';
}
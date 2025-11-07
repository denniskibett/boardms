import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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

export async function GET() {
  try {
    console.log('🔍 Fetching system settings...');

    // Fetch latest system settings
    const result = await pool.query('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1');

    let settings = {};
    
    if (result.rows.length === 0) {
      console.log('⚠️ No settings found, returning defaults');
      // Return default structure
      settings = {
        id: 1,
        name: 'E-Cabinet System',
        version: '1.0.0',
        timezone: 'Africa/Nairobi',
        date_format: 'DD/MM/YYYY',
        language: 'en'
      };
    } else {
      settings = result.rows[0];
      console.log('📊 Settings found:', settings);
    }

    // Fetch timezones dynamically from PostgreSQL
    let timezones = [];
    try {
      const tzResult = await pool.query(`
        SELECT 
          name, 
          abbrev, 
          utc_offset
        FROM pg_timezone_names 
        WHERE NOT (abbrev = 'zzz' AND utc_offset = '00:00:00'::interval)
          AND name NOT LIKE 'posix/%'
          AND name NOT LIKE 'right/%'
        ORDER BY name
        LIMIT 200
      `);

      timezones = tzResult.rows.map(tz => ({
        name: tz.name || '',
        abbrev: tz.abbrev || '',
        utc_offset: formatUtcOffset(tz.utc_offset)
      }));

      console.log(`🌍 Loaded ${timezones.length} timezones`);
    } catch (tzError) {
      console.error('❌ Error fetching timezones:', tzError);
      timezones = [];
    }

    // Return settings along with dynamic timezones
    return NextResponse.json({ ...settings, timezones });
  } catch (error) {
    console.error('❌ GET Database error:', error);
    // Return safe default structure
    return NextResponse.json({
      id: 1,
      name: 'E-Cabinet System',
      version: '1.0.0',
      timezone: 'Africa/Nairobi',
      date_format: 'DD/MM/YYYY',
      language: 'en',
      timezones: []
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json();
    console.log('📝 Received settings update:', settings);
    
    if (!settings.id) {
      return NextResponse.json({ error: 'Settings ID is required' }, { status: 400 });
    }

    // Check if record exists
    const checkResult = await pool.query('SELECT id FROM system_settings WHERE id = $1', [settings.id]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const query = `
      UPDATE system_settings SET
        name = $1,
        timezone = $2,
        date_format = $3,
        language = $4,
        email_notifications = $5,
        push_notifications = $6,
        meeting_reminders = $7,
        deadline_alerts = $8,
        weekly_reports = $9,
        session_timeout = $10,
        password_policy = $11,
        two_factor_auth = $12,
        ip_whitelist = $13,
        audit_log_retention = $14,
        smtp_enabled = $15,
        smtp_server = $16,
        smtp_port = $17,
        file_storage = $18,
        max_file_size = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *
    `;
    
    const values = [
      settings.name || 'E-Cabinet System',
      settings.timezone || 'Africa/Nairobi',
      settings.date_format || 'DD/MM/YYYY',
      settings.language || 'English',
      settings.email_notifications !== undefined ? settings.email_notifications : true,
      settings.push_notifications !== undefined ? settings.push_notifications : true,
      settings.meeting_reminders !== undefined ? settings.meeting_reminders : true,
      settings.deadline_alerts !== undefined ? settings.deadline_alerts : true,
      settings.weekly_reports !== undefined ? settings.weekly_reports : false,
      settings.session_timeout || 30,
      settings.password_policy || 'strong',
      settings.two_factor_auth !== undefined ? settings.two_factor_auth : true,
      settings.ip_whitelist || ['192.168.1.0/24'],
      settings.audit_log_retention || 365,
      settings.smtp_enabled !== undefined ? settings.smtp_enabled : true,
      settings.smtp_server || 'smtp.gov.go.ke',
      settings.smtp_port || 587,
      settings.file_storage || 'local',
      settings.max_file_size || 10,
      settings.id
    ];

    const result = await pool.query(query, values);

    console.log('✅ Update successful:', result.rows[0]);
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ PUT Database error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update settings in database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

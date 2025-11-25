// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

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
    console.log('🔍 Fetching system settings from Supabase...');
    const supabase = supabaseServer();

    // Fetch latest system settings from Supabase
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let systemSettings = {};
    
    if (error || !settings) {
      console.log('⚠️ No settings found in Supabase, returning defaults');
      // Return default structure
      systemSettings = {
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
        audit_log_retention: 365
      };
    } else {
      systemSettings = settings;
      console.log('📊 Settings found in Supabase:', systemSettings);
    }

    // For timezones, we'll use a static list since we can't query pg_timezone_names in Supabase
    const timezones = [
      { name: 'Africa/Nairobi', abbrev: 'EAT', utc_offset: '+03:00' },
      { name: 'UTC', abbrev: 'UTC', utc_offset: '+00:00' },
      { name: 'America/New_York', abbrev: 'EST', utc_offset: '-05:00' },
      { name: 'Europe/London', abbrev: 'GMT', utc_offset: '+00:00' },
      { name: 'Asia/Dubai', abbrev: 'GST', utc_offset: '+04:00' },
    ];

    console.log(`🌍 Loaded ${timezones.length} timezones`);

    // Return settings along with timezones
    return NextResponse.json({ ...systemSettings, timezones });
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

    const supabase = supabaseServer();

    // Check if record exists
    const { data: existingSettings, error: checkError } = await supabase
      .from('system_settings')
      .select('id')
      .eq('id', settings.id)
      .single();

    if (checkError || !existingSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Update the settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('system_settings')
      .update({
        name: settings.name || 'E-Cabinet System',
        timezone: settings.timezone || 'Africa/Nairobi',
        date_format: settings.date_format || 'DD/MM/YYYY',
        language: settings.language || 'en',
        email_notifications: settings.email_notifications !== undefined ? settings.email_notifications : true,
        push_notifications: settings.push_notifications !== undefined ? settings.push_notifications : true,
        meeting_reminders: settings.meeting_reminders !== undefined ? settings.meeting_reminders : true,
        deadline_alerts: settings.deadline_alerts !== undefined ? settings.deadline_alerts : true,
        weekly_reports: settings.weekly_reports !== undefined ? settings.weekly_reports : false,
        session_timeout: settings.session_timeout || 30,
        password_policy: settings.password_policy || 'strong',
        two_factor_auth: settings.two_factor_auth !== undefined ? settings.two_factor_auth : true,
        ip_whitelist: settings.ip_whitelist || ['192.168.1.0/24'],
        audit_log_retention: settings.audit_log_retention || 365,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    console.log('✅ Update successful:', updatedSettings);
    return NextResponse.json(updatedSettings);
    
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
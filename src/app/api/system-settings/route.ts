// app/api/system-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cache } from 'react';

// Helper function to get timezones
const getTimezones = () => {
  return [
    { name: "Africa/Nairobi", abbrev: "EAT", utc_offset: "+03:00" },
    { name: "UTC", abbrev: "UTC", utc_offset: "+00:00" },
    { name: "America/New_York", abbrev: "EST", utc_offset: "-05:00" },
    { name: "Europe/London", abbrev: "GMT", utc_offset: "+00:00" },
    { name: "Asia/Tokyo", abbrev: "JST", utc_offset: "+09:00" },
    { name: "Australia/Sydney", abbrev: "AEST", utc_offset: "+10:00" },
    { name: "Asia/Dubai", abbrev: "GST", utc_offset: "+04:00" },
    { name: "Europe/Paris", abbrev: "CET", utc_offset: "+01:00" },
  ];
};

export async function GET(request: NextRequest) {
  try {
    console.log('🌍 Fetching system settings from Supabase...');
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Return defaults if no settings found
      const defaultSettings = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return NextResponse.json({
        ...defaultSettings,
        timezones: getTimezones()
      });
    }

    if (!settings) {
      console.warn('⚠️ No system settings found in database');
      
      const defaultSettings = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return NextResponse.json({
        ...defaultSettings,
        timezones: getTimezones()
      });
    }

    console.log('✅ System settings loaded:', {
      name: settings.name,
      timezone: settings.timezone,
      logo_primary: settings.logo_primary
    });

    // Add timezones to response
    const response = {
      ...settings,
      timezones: getTimezones()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('💾 Saving system settings...');
    
    const body = await request.json();
    console.log('📦 Received data:', JSON.stringify(body, null, 2));
    
    // Remove timezones from the data to save
    const { timezones, ...settingsToSave } = body;
    
    // Prepare data for Supabase
    const dataToSave = {
      ...settingsToSave,
      updated_at: new Date().toISOString()
    };

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('system_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let result;
    
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('system_settings')
        .update(dataToSave)
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabase
        .from('system_settings')
        .insert([{
          ...dataToSave,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Supabase save error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save system settings', details: result.error },
        { status: 500 }
      );
    }

    console.log('✅ System settings saved successfully');
    
    // Return the saved settings with timezones
    const savedSettings = {
      ...result.data,
      timezones: getTimezones()
    };

    return NextResponse.json(savedSettings);
  } catch (error) {
    console.error('❌ Error saving system settings:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// lib/server/systemSettings.ts
import { supabase } from '@/lib/supabase';

export const getSystemSettingsServer = async () => {
  try {
    console.log('🌍 Fetching system settings on server...');
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    if (!settings) {
      console.warn('⚠️ No system settings found in database, using defaults');
      return getDefaultSettings();
    }

    console.log('✅ System settings loaded:', {
      name: settings.name,
      timezone: settings.timezone,
      primary_color: settings.primary_color
    });

    return {
      id: settings.id,
      name: settings.name || 'BoardMS',
      version: settings.version || '1.0.0',
      timezone: settings.timezone || 'Africa/Nairobi',
      date_format: settings.date_format || 'DD/MM/YYYY',
      language: settings.language || 'en',
      logo_auth: settings.logo_auth || '/images/logo/auth-logo.svg',
      logo_dark: settings.logo_dark || '/images/logo/logo-dark.svg',
      logo_icon: settings.logo_icon || '/images/logo/logo-icon.svg',
      logo_primary: settings.logo_primary || '/images/logo/logo.svg',
      primary_color: settings.primary_color || '#3b82f6',
      secondary_color: settings.secondary_color || '#1e40af',
      favicon: settings.favicon || '/favicon.ico',
      system_email: settings.system_email || 'noreply@cabinet.go.ke',
      system_email_name: settings.system_email_name || 'BoardMS',
      copyright_text: settings.copyright_text || `© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`,
      description: settings.description || 'Government Meeting Management Platform',
      email_notifications: settings.email_notifications ?? true,
      push_notifications: settings.push_notifications ?? true,
      meeting_reminders: settings.meeting_reminders ?? true,
      deadline_alerts: settings.deadline_alerts ?? true,
      weekly_reports: settings.weekly_reports ?? false,
      session_timeout: settings.session_timeout || 30,
      password_policy: settings.password_policy || 'strong',
      two_factor_auth: settings.two_factor_auth ?? true,
      ip_whitelist: settings.ip_whitelist || ['192.168.1.0/24'],
      audit_log_retention: settings.audit_log_retention || 365,
      smtp_enabled: settings.smtp_enabled ?? true,
      smtp_server: settings.smtp_server || 'smtp.gov.go.ke',
      smtp_port: settings.smtp_port || 587,
      file_storage: settings.file_storage || 'local',
      max_file_size: settings.max_file_size || 10,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    };
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    return getDefaultSettings();
  }
};

function getDefaultSettings() {
  return {
    id: 1,
    name: 'BoardMS',
    version: '1.0.0',
    timezone: 'Africa/Nairobi',
    date_format: 'DD/MM/YYYY',
    language: 'en',
    logo_auth: '/images/logo/auth-logo.svg',
    logo_dark: '/images/logo/logo-dark.svg',
    logo_icon: '/images/logo/logo-icon.svg',
    logo_primary: '/images/logo/logo.svg',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    favicon: '/favicon.ico',
    system_email: 'noreply@cabinet.go.ke',
    system_email_name: 'BoardMS',
    copyright_text: `© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`,
    description: 'Government Meeting Management Platform',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
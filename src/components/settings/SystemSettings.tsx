// components/settings/SystemSettings.tsx
"use client";
import React, { useState, useEffect } from "react";
import SuperErrorModal from "@/components/ui/modal/SystemErrorModal";
import Image from "next/image";

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

interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
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
  description: 'Government Meeting Management Platform for boardms'
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ErrorState>({
    isOpen: false,
    title: "",
    message: ""
  });
  const [timezones, setTimezones] = useState<{ name: string; abbrev: string; utc_offset: string }[]>([]);

  // Add branding tabs to existing tabs array
  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "branding", name: "Branding", icon: "🎨" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "integrations", name: "Integrations", icon: "🔗" },
    { id: "backup", name: "Backup", icon: "💾" },
  ];

  // Helper function to display logo preview
  const LogoPreview = ({ type, label }: { type: keyof SystemSettings, label: string }) => {
    const logoUrl = currentSettings[type] as string;
    
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="relative w-12 h-12">
              <Image
                src={logoUrl}
                alt={`${label} Preview`}
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Fallback to default based on type
                  if (type === 'logo_auth') target.src = '/images/logo/auth-logo.svg';
                  else if (type === 'logo_dark') target.src = '/images/logo/logo-dark.svg';
                  else if (type === 'logo_icon') target.src = '/images/logo/logo-icon.svg';
                  else target.src = '/images/logo/logo.svg';
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => handleInputChange(type, e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
              placeholder={`Enter ${label.toLowerCase()} URL`}
            />
          </div>
        </div>
      </div>
    );
  };

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Fetching settings...');
        
        const response = await fetch('/api/system-settings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Received data:', data);
        
        if (!data || Object.keys(data).length === 0) {
          console.warn('⚠️ No settings data found, using defaults');
          setSettings(defaultSettings);
        } else {
          // Ensure all required fields are present
          const mergedSettings = { ...defaultSettings, ...data };
          console.log('🔄 Merged settings:', mergedSettings);
          setSettings(mergedSettings);
        }

        // Set timezones
        if (data.timezones && Array.isArray(data.timezones)) {
          console.log(`🌍 Loaded ${data.timezones.length} timezones`);
          setTimezones(data.timezones);
        } else {
          console.warn('⚠️ No timezones found in response, using defaults');
          // Default timezones with Nairobi as first option
          setTimezones([
            { name: "Africa/Nairobi", abbrev: "EAT", utc_offset: "+03:00" },
            { name: "UTC", abbrev: "UTC", utc_offset: "+00:00" },
            { name: "America/New_York", abbrev: "EST", utc_offset: "-05:00" },
            { name: "Europe/London", abbrev: "GMT", utc_offset: "+00:00" },
            { name: "Asia/Tokyo", abbrev: "JST", utc_offset: "+09:00" },
            { name: "Australia/Sydney", abbrev: "AEST", utc_offset: "+10:00" },
          ]);
        }
        
      } catch (error) {
        console.error('❌ Error fetching settings:', error);
        // Use default settings on error
        setSettings(defaultSettings);
        showError(
          'Failed to Load Settings',
          error instanceof Error ? error.message : 'Unable to load system settings. Using default settings.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const showError = (title: string, message: string) => {
    setError({
      isOpen: true,
      title,
      message
    });
  };

  const closeError = () => {
    setError(prev => ({ ...prev, isOpen: false }));
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    if (settings) {
      setSettings(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) {
      showError('Cannot Save', 'No settings data available to save.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save settings: ${response.status}`);
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
      // Show success message
      showError(
        'Settings Saved',
        'System settings have been updated successfully. Changes will take effect immediately.'
      );
      
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      showError(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save settings. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Add this debug logging
  useEffect(() => {
    console.log('🔍 Current settings state:', settings);
    console.log('🔍 Current timezones state:', timezones);
  }, [settings, timezones]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  // Ensure settings is never null when rendering
  const currentSettings = settings || defaultSettings;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  General System Settings
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      System Name
                    </label>
                    <input
                      type="text"
                      value={currentSettings.name || ''}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      System Version
                    </label>
                    <input
                      type="text"
                      value={currentSettings.version || ''}
                      disabled
                      className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={currentSettings.timezone || 'Africa/Nairobi'}
                      onChange={(e) => handleInputChange("timezone", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      {timezones
                        .filter(tz => tz && tz.name && tz.abbrev && tz.utc_offset)
                        .map((tz) => (
                          <option key={tz.name} value={tz.name}>
                            {tz.name} ({tz.abbrev}, UTC{tz.utc_offset})
                          </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Nairobi time is the default (UTC+3)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={currentSettings.date_format || 'DD/MM/YYYY'}
                      onChange={(e) => handleInputChange("date_format", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      System Language
                    </label>
                    <select
                      value={currentSettings.language || 'en'}
                      onChange={(e) => handleInputChange("language", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      System Description
                    </label>
                    <textarea
                      value={currentSettings.description || ''}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      placeholder="Brief description of the system"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding Settings - NEW */}
          {activeTab === "branding" && (
            <div className="space-y-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Branding & Appearance
              </h3>
              
              {/* Logo Settings */}
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Logos
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LogoPreview type="logo_primary" label="Primary Logo" />
                  <LogoPreview type="logo_dark" label="Dark Mode Logo" />
                  <LogoPreview type="logo_auth" label="Auth Page Logo" />
                  <LogoPreview type="logo_icon" label="Icon Logo" />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo Usage Notes:
                  </h5>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Primary Logo: Used in light mode header and dashboard</li>
                    <li>• Dark Mode Logo: Used when dark mode is enabled</li>
                    <li>• Auth Page Logo: Displayed on login/register pages</li>
                    <li>• Icon Logo: Used for favicon and small spaces</li>
                    <li>• Recommended formats: SVG, PNG (transparent background)</li>
                    <li>• Default path: /images/logo/logo.svg (relative to public folder)</li>
                  </ul>
                </div>
              </div>

              {/* Color Settings */}
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Colors
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={currentSettings.primary_color || '#3b82f6'}
                        onChange={(e) => handleInputChange("primary_color", e.target.value)}
                        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={currentSettings.primary_color || '#3b82f6'}
                        onChange={(e) => handleInputChange("primary_color", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                        placeholder="#3b82f6"
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Used for primary buttons, links, and active states
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={currentSettings.secondary_color || '#1e40af'}
                        onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={currentSettings.secondary_color || '#1e40af'}
                        onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                        placeholder="#1e40af"
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Used for hover states and secondary elements
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  System Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      System Email Address
                    </label>
                    <input
                      type="email"
                      value={currentSettings.system_email || ''}
                      onChange={(e) => handleInputChange("system_email", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder="noreply@cabinet.go.ke"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Email used for sending system notifications
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Display Name
                    </label>
                    <input
                      type="text"
                      value={currentSettings.system_email_name || ''}
                      onChange={(e) => handleInputChange("system_email_name", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder="boardms"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Name shown as sender in outgoing emails
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Favicon URL
                    </label>
                    <input
                      type="text"
                      value={currentSettings.favicon || '/favicon.ico'}
                      onChange={(e) => handleInputChange("favicon", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder="/favicon.ico"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Browser tab icon (16x16 or 32x32 pixels)
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Copyright Text
                    </label>
                    <input
                      type="text"
                      value={currentSettings.copyright_text || ''}
                      onChange={(e) => handleInputChange("copyright_text", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder={`© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Displayed in footer. Use {"{year}"} to auto-insert current year
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { id: "email_notifications", label: "Email Notifications", description: "Receive system notifications via email" },
                  { id: "push_notifications", label: "Push Notifications", description: "Receive real-time push notifications" },
                  { id: "meeting_reminders", label: "Meeting Reminders", description: "Get reminders for upcoming meetings" },
                  { id: "deadline_alerts", label: "Deadline Alerts", description: "Alerts for approaching deadlines" },
                  { id: "weekly_reports", label: "Weekly Reports", description: "Receive weekly activity summaries" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleInputChange(item.id as keyof SystemSettings, !currentSettings[item.id as keyof SystemSettings])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                        currentSettings[item.id as keyof SystemSettings] ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          currentSettings[item.id as keyof SystemSettings] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Security Settings
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={currentSettings.session_timeout || 30}
                    onChange={(e) => handleInputChange("session_timeout", parseInt(e.target.value) || 30)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Users will be automatically logged out after this period of inactivity
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Policy
                  </label>
                  <select
                    value={currentSettings.password_policy || 'strong'}
                    onChange={(e) => handleInputChange("password_policy", e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="basic">Basic (6 characters minimum)</option>
                    <option value="medium">Medium (8 characters with mix)</option>
                    <option value="strong">Strong (12 characters with complexity)</option>
                  </select>
                  <div className="mt-2 text-xs text-gray-500">
                    Determines password requirements for all users
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Require 2FA for all user accounts
                    </div>
                  </div>
                  <button
                    onClick={() => handleInputChange("two_factor_auth", !currentSettings.two_factor_auth)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                      currentSettings.two_factor_auth ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        currentSettings.two_factor_auth ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IP Whitelist (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(currentSettings.ip_whitelist || []).join(', ')}
                    onChange={(e) => handleInputChange("ip_whitelist", e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="192.168.1.0/24, 10.0.0.0/8"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Restrict access to specific IP ranges (leave empty to allow all)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audit Log Retention (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={currentSettings.audit_log_retention || 365}
                    onChange={(e) => handleInputChange("audit_log_retention", parseInt(e.target.value) || 365)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    How long to keep audit logs before automatic deletion
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Changes will affect the entire system including login, registration, and dashboard pages.
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    // Reset to defaults
                    if (confirm('Are you sure you want to reset all settings to defaults?')) {
                      setSettings(defaultSettings);
                    }
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Reset to Defaults
                </button>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuperErrorModal
        isOpen={error.isOpen}
        title={error.title}
        message={error.message}
        onClose={closeError}
      />
    </>
  );
}
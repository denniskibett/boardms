// components/settings/SystemSettings.tsx
"use client";
import React, { useState, useEffect } from "react";
import SuperErrorModal from "@/components/ui/modal/SystemErrorModal";

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
}

interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
}

// Default settings to prevent undefined issues
const defaultSettings: SystemSettings = {
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
  smtp_enabled: true,
  smtp_server: 'smtp.gov.go.ke',
  smtp_port: 587,
  file_storage: 'local',
  max_file_size: 10
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

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Fetching settings...');
        
        const response = await fetch('/api/settings');
        
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
          console.warn('⚠️ No timezones found in response');
          setTimezones([]);
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
      const response = await fetch('/api/settings', {
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
      
      // Show success message (you can replace this with a success modal/toast)
      console.log('✅ Settings saved successfully');
      
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

  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "integrations", name: "Integrations", icon: "🔗" },
    { id: "backup", name: "Backup", icon: "💾" },
  ];

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
          <nav className="-mb-px flex space-x-8 px-6">
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
                      {timezones.length > 0 ? (
                        timezones
                          .filter(tz => tz && tz.name && tz.abbrev && tz.utc_offset)
                          .map((tz) => (
                            <option key={tz.name} value={tz.name}>
                              {tz.name} ({tz.abbrev}, UTC{tz.utc_offset})
                            </option>
                          ))
                      ) : (
                        // Fallback options if no timezones loaded
                        <>
                          <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+03:00)</option>
                          <option value="UTC">UTC (UTC, UTC+00:00)</option>
                          <option value="Europe/London">Europe/London (GMT, UTC+00:00)</option>
                        </>
                      )}
                    </select>
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
                    value={currentSettings.session_timeout || 30}
                    onChange={(e) => handleInputChange("session_timeout", parseInt(e.target.value) || 30)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
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
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Two-Factor Authentication
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Require 2FA for all users
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
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end border-t border-gray-200 pt-6 dark:border-gray-800">
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

      <SuperErrorModal
        isOpen={error.isOpen}
        title={error.title}
        message={error.message}
        onClose={closeError}
      />
    </>
  );
}
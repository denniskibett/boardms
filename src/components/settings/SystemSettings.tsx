// components/settings/SystemSettings.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import SuperErrorModal from "@/components/ui/modal/SystemErrorModal";
import Image from "next/image";
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Link2,
  Database,
  Save,
  RotateCcw,
  Mail,
  Globe,
  Clock,
  Calendar,
  Languages,
  FileText,
  Eye,
  EyeOff,
  Key,
  Users,
  Server,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Image as ImageIcon,
  Type,
  AtSign,
  Copyright,
  Fingerprint,
  Wifi,
  Lock,
  Unlock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  AlertCircle,
  Info,
  HelpCircle,
} from "lucide-react";

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
  primary_color: '#026818',
  secondary_color: '#be0000',
  favicon: '/favicon.ico',
  system_email: 'noreply@cabinet.go.ke',
  system_email_name: 'boardms',
  copyright_text: `© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`,
  description: 'Government Meeting Management Platform for boardms'
};

export default function SystemSettings() {
  const { 
    getPrimaryColor, 
    getSecondaryColor,
    getSystemName,
    refreshSettings 
  } = useSystemSettings();
  
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
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

  // Get dynamic colors
  const primaryColor = getPrimaryColor();
  const secondaryColor = getSecondaryColor();
  const systemName = getSystemName();

  // Tabs with Lucide icons
  const tabs = [
    { id: "general", name: "General", icon: <Settings size={18} /> },
    { id: "branding", name: "Branding", icon: <Palette size={18} /> },
    { id: "notifications", name: "Notifications", icon: <Bell size={18} /> },
    { id: "security", name: "Security", icon: <Shield size={18} /> },
    { id: "integrations", name: "Integrations", icon: <Link2 size={18} /> },
    { id: "backup", name: "Backup", icon: <Database size={18} /> },
  ];

  // Helper function to display logo preview
  const LogoPreview = ({ type, label }: { type: keyof SystemSettings, label: string }) => {
    const logoUrl = currentSettings[type] as string;
    
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ImageIcon size={16} />
          {label}
        </div>
        <div className="flex items-center space-x-4">
          <div 
            className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ borderColor: primaryColor + '20' }}
          >
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
          <div className="flex-1 relative">
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => handleInputChange(type, e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm pl-9"
              placeholder={`Enter ${label.toLowerCase()} URL`}
            />
            <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
    );
  };

  // Color picker with preview
  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    description 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    description: string;
  }) => {
    const [isValid, setIsValid] = useState(true);

    const validateColor = (color: string) => {
      const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
      setIsValid(isValidHex);
      return isValidHex;
    };

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded border border-gray-300"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                validateColor(e.target.value);
              }}
              className={`w-full rounded-lg border bg-transparent px-3 py-2 text-sm pl-9 ${
                isValid 
                  ? 'border-gray-300 focus:border-brand-300' 
                  : 'border-error-500 focus:border-error-500'
              }`}
              placeholder="#000000"
            />
            <div 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
              style={{ backgroundColor: value }}
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Info size={12} />
          {description}
        </div>
        {!isValid && (
          <div className="text-xs text-error-500 flex items-center gap-1 mt-1">
            <AlertCircle size={12} />
            Invalid color format. Use hex format (e.g., #FF0000)
          </div>
        )}
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
      
      // Refresh system settings context
      await refreshSettings();
      
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
          <Loader2 size={32} className="animate-spin" style={{ color: primaryColor }} />
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
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }`}
                style={activeTab === tab.id ? { 
                  borderColor: primaryColor,
                  color: primaryColor 
                } : undefined}
              >
                {tab.icon}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings size={20} />
                  General System Settings
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Type size={16} />
                      System Name
                    </label>
                    <input
                      type="text"
                      value={currentSettings.name || ''}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      style={{ 
                        focusBorderColor: primaryColor,
                        focusRingColor: `${primaryColor}20`
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Server size={16} />
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Globe size={16} />
                      Timezone
                    </label>
                    <select
                      value={currentSettings.timezone || 'Africa/Nairobi'}
                      onChange={(e) => handleInputChange("timezone", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      style={{ 
                        focusBorderColor: primaryColor,
                        focusRingColor: `${primaryColor}20`
                      }}
                    >
                      {timezones
                        .filter(tz => tz && tz.name && tz.abbrev && tz.utc_offset)
                        .map((tz) => (
                          <option key={tz.name} value={tz.name}>
                            {tz.name} ({tz.abbrev}, UTC{tz.utc_offset})
                          </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Info size={12} />
                      Nairobi time is the default (UTC+3)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Calendar size={16} />
                      Date Format
                    </label>
                    <select
                      value={currentSettings.date_format || 'DD/MM/YYYY'}
                      onChange={(e) => handleInputChange("date_format", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      style={{ 
                        focusBorderColor: primaryColor,
                        focusRingColor: `${primaryColor}20`
                      }}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Languages size={16} />
                      System Language
                    </label>
                    <select
                      value={currentSettings.language || 'en'}
                      onChange={(e) => handleInputChange("language", e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      style={{ 
                        focusBorderColor: primaryColor,
                        focusRingColor: `${primaryColor}20`
                      }}
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <FileText size={16} />
                      System Description
                    </label>
                    <textarea
                      value={currentSettings.description || ''}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      placeholder="Brief description of the system"
                      style={{ 
                        focusBorderColor: primaryColor,
                        focusRingColor: `${primaryColor}20`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === "branding" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Palette size={20} />
                  Branding & Appearance
                </h3>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewMode('light')}
                    className={`p-2 rounded-md flex items-center gap-1 ${
                      previewMode === 'light' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Sun size={16} />
                    <span className="text-xs">Light</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('dark')}
                    className={`p-2 rounded-md flex items-center gap-1 ${
                      previewMode === 'dark' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Moon size={16} />
                    <span className="text-xs">Dark</span>
                  </button>
                </div>
              </div>
              
              {/* Color Preview Card */}
              <div 
                className="p-6 rounded-lg border-2 transition-all duration-300"
                style={{ 
                  borderColor: primaryColor + '40',
                  background: previewMode === 'light' 
                    ? 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' 
                    : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
                }}
              >
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: previewMode === 'light' ? '#374151' : '#e5e7eb' }}>
                  <Eye size={16} />
                  Live Preview
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button 
                      className="px-4 py-2 rounded-lg text-white text-sm transition-all hover:scale-105"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg text-white text-sm transition-all hover:scale-105"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Secondary Button
                    </button>
                    <span className="text-sm" style={{ color: primaryColor }}>
                      Primary Link
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: primaryColor + '80' }} />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor + '80' }} />
                  </div>
                </div>
              </div>
              
              {/* Logo Settings */}
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ImageIcon size={18} />
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
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Palette size={18} />
                  Colors
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ColorPicker
                    label="Primary Color"
                    value={currentSettings.primary_color}
                    onChange={(value) => handleInputChange("primary_color", value)}
                    description="Used for primary buttons, links, and active states"
                  />
                  
                  <ColorPicker
                    label="Secondary Color"
                    value={currentSettings.secondary_color}
                    onChange={(value) => handleInputChange("secondary_color", value)}
                    description="Used for hover states and secondary elements"
                  />
                </div>
              </div>

              {/* System Information */}
              <div className="space-y-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  System Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <AtSign size={16} />
                      System Email Address
                    </label>
                    <input
                      type="email"
                      value={currentSettings.system_email || ''}
                      onChange={(e) => handleInputChange("system_email", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder="noreply@cabinet.go.ke"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Info size={12} />
                      Email used for sending system notifications
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Type size={16} />
                      Email Display Name
                    </label>
                    <input
                      type="text"
                      value={currentSettings.system_email_name || ''}
                      onChange={(e) => handleInputChange("system_email_name", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder="boardms"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Info size={12} />
                      Name shown as sender in outgoing emails
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <ImageIcon size={16} />
                      Favicon URL
                    </label>
                    <input
                      type="text"
                      value={currentSettings.favicon || '/favicon.ico'}
                      onChange={(e) => handleInputChange("favicon", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder="/favicon.ico"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Info size={12} />
                      Browser tab icon (16x16 or 32x32 pixels)
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Copyright size={16} />
                      Copyright Text
                    </label>
                    <input
                      type="text"
                      value={currentSettings.copyright_text || ''}
                      onChange={(e) => handleInputChange("copyright_text", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm"
                      placeholder={`© ${new Date().getFullYear()} Government of Kenya. All rights reserved.`}
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Info size={12} />
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell size={20} />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { id: "email_notifications", label: "Email Notifications", description: "Receive system notifications via email", icon: <Mail size={16} /> },
                  { id: "push_notifications", label: "Push Notifications", description: "Receive real-time push notifications", icon: <Bell size={16} /> },
                  { id: "meeting_reminders", label: "Meeting Reminders", description: "Get reminders for upcoming meetings", icon: <Clock size={16} /> },
                  { id: "deadline_alerts", label: "Deadline Alerts", description: "Alerts for approaching deadlines", icon: <AlertTriangle size={16} /> },
                  { id: "weekly_reports", label: "Weekly Reports", description: "Receive weekly activity summaries", icon: <FileText size={16} /> },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5" style={{ color: primaryColor }}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInputChange(item.id as keyof SystemSettings, !currentSettings[item.id as keyof SystemSettings])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                        currentSettings[item.id as keyof SystemSettings] ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={{ 
                        backgroundColor: currentSettings[item.id as keyof SystemSettings] ? primaryColor : undefined,
                        focusRingColor: primaryColor
                      }}
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield size={20} />
                Security Settings
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Clock size={16} />
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={currentSettings.session_timeout || 30}
                    onChange={(e) => handleInputChange("session_timeout", parseInt(e.target.value) || 30)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    style={{ 
                      focusBorderColor: primaryColor,
                      focusRingColor: `${primaryColor}20`
                    }}
                  />
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    Users will be automatically logged out after this period of inactivity
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Key size={16} />
                    Password Policy
                  </label>
                  <select
                    value={currentSettings.password_policy || 'strong'}
                    onChange={(e) => handleInputChange("password_policy", e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    style={{ 
                      focusBorderColor: primaryColor,
                      focusRingColor: `${primaryColor}20`
                    }}
                  >
                    <option value="basic">Basic (6 characters minimum)</option>
                    <option value="medium">Medium (8 characters with mix)</option>
                    <option value="strong">Strong (12 characters with complexity)</option>
                  </select>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    Determines password requirements for all users
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Fingerprint size={16} style={{ color: primaryColor }} />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Require 2FA for all user accounts
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInputChange("two_factor_auth", !currentSettings.two_factor_auth)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                      currentSettings.two_factor_auth ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ 
                      backgroundColor: currentSettings.two_factor_auth ? primaryColor : undefined,
                      focusRingColor: primaryColor
                    }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        currentSettings.two_factor_auth ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Wifi size={16} />
                    IP Whitelist (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(currentSettings.ip_whitelist || []).join(', ')}
                    onChange={(e) => handleInputChange("ip_whitelist", e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="192.168.1.0/24, 10.0.0.0/8"
                    style={{ 
                      focusBorderColor: primaryColor,
                      focusRingColor: `${primaryColor}20`
                    }}
                  />
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    Restrict access to specific IP ranges (leave empty to allow all)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Database size={16} />
                    Audit Log Retention (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={currentSettings.audit_log_retention || 365}
                    onChange={(e) => handleInputChange("audit_log_retention", parseInt(e.target.value) || 365)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    style={{ 
                      focusBorderColor: primaryColor,
                      focusRingColor: `${primaryColor}20`
                    }}
                  />
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    How long to keep audit logs before automatic deletion
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Info size={14} />
                Changes will affect the entire system including login, registration, and dashboard pages.
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all settings to defaults?')) {
                      setSettings(defaultSettings);
                    }
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Reset to Defaults
                </button>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = secondaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
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
"use client";
import React, { useState } from "react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // General Settings
    systemName: "E-Cabinet System",
    systemVersion: "2.0.2",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
    language: "English",
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    meetingReminders: true,
    deadlineAlerts: true,
    weeklyReports: false,
    
    // Security Settings
    sessionTimeout: 30,
    passwordPolicy: "strong",
    twoFactorAuth: true,
    ipWhitelist: ["192.168.1.0/24"],
    auditLogRetention: 365,
    
    // Integration Settings
    smtpEnabled: true,
    smtpServer: "smtp.gov.go.ke",
    smtpPort: 587,
    fileStorage: "local",
    maxFileSize: 10,
  });

  const [activeTab, setActiveTab] = useState("general");

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "integrations", name: "Integrations", icon: "🔗" },
    { id: "backup", name: "Backup", icon: "💾" },
  ];

  return (
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
                    value={settings.systemName}
                    onChange={(e) => handleInputChange("general", "systemName", e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    System Version
                  </label>
                  <input
                    type="text"
                    value={settings.systemVersion}
                    disabled
                    className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleInputChange("general", "timezone", e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="Africa/Nairobi">East Africa Time (Nairobi)</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">GMT (London)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleInputChange("general", "dateFormat", e.target.value)}
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
                { id: "emailNotifications", label: "Email Notifications", description: "Receive system notifications via email" },
                { id: "pushNotifications", label: "Push Notifications", description: "Receive real-time push notifications" },
                { id: "meetingReminders", label: "Meeting Reminders", description: "Get reminders for upcoming meetings" },
                { id: "deadlineAlerts", label: "Deadline Alerts", description: "Alerts for approaching deadlines" },
                { id: "weeklyReports", label: "Weekly Reports", description: "Receive weekly activity summaries" },
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
                    onClick={() => handleInputChange("notifications", item.id, !settings[item.id])}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                      settings[item.id] ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings[item.id] ? 'translate-x-5' : 'translate-x-0'
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
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange("security", "sessionTimeout", parseInt(e.target.value))}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password Policy
                </label>
                <select
                  value={settings.passwordPolicy}
                  onChange={(e) => handleInputChange("security", "passwordPolicy", e.target.value)}
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
                  onClick={() => handleInputChange("security", "twoFactorAuth", !settings.twoFactorAuth)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    settings.twoFactorAuth ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.twoFactorAuth ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end border-t border-gray-200 pt-6 dark:border-gray-800">
          <button className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
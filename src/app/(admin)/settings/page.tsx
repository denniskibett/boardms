import type { Metadata } from "next";
import SystemSettings from "@/components/settings/SystemSettings";

export const metadata: Metadata = {
  title: "System Settings | E-Cabinet System",
  description: "Configure system settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure system preferences and global settings
          </p>
        </div>
      </div>
      <SystemSettings />
    </div>
  );
}
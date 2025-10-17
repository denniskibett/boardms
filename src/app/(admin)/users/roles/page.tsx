// app/(admin)/users/roles/page.tsx
import type { Metadata } from "next";
import RolesPermissions from "@/components/users/RolesPermissions";

export const metadata: Metadata = {
  title: "Roles & Permissions | E-Cabinet System",
  description: "Manage user roles and system permissions",
};

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles and their system permissions
          </p>
        </div>
      </div>
      <RolesPermissions />
    </div>
  );
}
// app/(admin)/users/page.tsx
import type { Metadata } from "next";
import UsersList from "@/components/users/UsersList";

export const metadata: Metadata = {
  title: "User Management | E-Cabinet System",
  description: "Manage system users and their permissions",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage system users, roles, and permissions
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>
      <UsersList />
    </div>
  );
}
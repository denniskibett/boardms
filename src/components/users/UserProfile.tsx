"use client";
import React from "react";
import { useSession } from "next-auth/react";
import WelcomeBanner from "./WelcomeBanner";

interface Ministry {
  id: number;
  name: string;
  acronym: string;
  cluster_id?: number;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

interface User {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  phone?: string;
  last_login?: string;
  ministry_id?: number;
  committees?: string[];
  created_at: string;
  updated_at: string;
  auth_users?: AuthUser;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface UserProfileProps {
  user: User;
  ministry: Ministry | null;
  currentUser: CurrentUser;
  showWelcomeMessage?: boolean;
  bannerSize?: "sm" | "md" | "lg";
}

export default function UserProfile({ 
  user, 
  ministry, 
  currentUser,
  showWelcomeMessage = true,
  bannerSize = "md"
}: UserProfileProps) {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner 
        user={user} 
        ministry={ministry} 
        showWelcomeMessage={showWelcomeMessage}
        size={bannerSize}
      />

      {/* Profile Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5 dark:border-gray-800">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                Profile Information
              </h3>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ministry
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {ministry ? `${ministry.name} (${ministry.acronym})` : "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Member Since
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Login
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "Never logged in"
                      }
                    </p>
                  </div>
                </div>

                {user.committees && user.committees.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Committee Memberships
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.committees.map((committee, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        >
                          {committee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5 dark:border-gray-800">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                Account Status
              </h3>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Profile Updated</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5 dark:border-gray-800">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                Quick Actions
              </h3>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-3">
                <button className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edit Profile
                </button>
                <button className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </button>
                <button className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions (you might want to move these to a separate utils file)
const roleColors: Record<string, string> = {
  President: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Deputy President": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Prime Cabinet Secretary": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "Cabinet Secretary": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Principal Secretary": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  "Cabinet Secretariat": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Director: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  "Assistant Director": "bg-cyan-50 text-cyan-700 dark:bg-cyan-800 dark:text-cyan-200",
  Admin: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  "Attorney General": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Secretary to the Cabinet": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const getRoleColor = (role: string): string => {
  return roleColors[role] || roleColors.Admin;
};

const getStatusColor = (status: string): string => {
  return statusColors[status] || statusColors.inactive;
};
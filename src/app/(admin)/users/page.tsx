// app/(admin)/users/page.tsx
import type { Metadata } from "next";
import UsersList from "@/components/users/UsersList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Management | E-Cabinet System",
  description: "Manage system users and their permissions",
};

export default async function UsersPage() {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Fetch auth users data server-side
  const authUsersResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/users`, {
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 30 } // Revalidate every 30 seconds
  });

  const authUsersData = await authUsersResponse.json();
  const authUsers = authUsersData.users || [];

  console.log('👥 Users page - Session:', {
    user: session.user.email,
    role: session.user.role,
    authUsersCount: authUsers.length
  });

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/20 py-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200/70 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                  User Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  Manage authentication users and their system access
                </p>
              </div>
              
              {/* User Stats - Responsive Grid */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:items-center xl:gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 sm:text-sm">Logged in as:</span>
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400 sm:text-sm">
                    {session.user.name} ({session.user.role})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 sm:text-sm">Total Auth Users:</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                    {authUsers.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 sm:text-sm">Last Updated:</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add User Button - Responsive */}
            <div className="flex-shrink-0">
              <button className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-6">
                <svg className="mr-2 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="whitespace-nowrap">Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users List Container */}
        <div className="w-full overflow-hidden">
          <UsersList initialUsers={authUsers} />
        </div>
      </div>
    </div>
  );
}
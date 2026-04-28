// app/(admin)/users/page.tsx - UPDATED
import type { Metadata } from "next";
import UsersList from "@/components/users/UsersList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseServer } from '@/lib/supabase/server';

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

  // Fetch auth users data using Supabase directly
  const supabase = supabaseServer();
  let authUsers = [];

  try {
    // Get all users from Supabase Auth (admin API)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      throw new Error('Failed to fetch authentication users');
    }

    // Get custom users from your database
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*');

    if (customError) {
      console.error('❌ Error fetching custom users:', customError);
      // Continue with auth users only
    }

    // Transform and combine data
    authUsers = users.map(authUser => {
      const customUser = customUsers?.find(u => u.email === authUser.email);
      
      return {
        id: authUser.id,
        email: authUser.email || '',
        email_confirmed: authUser.email_confirmed_at !== null,
        last_sign_in: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata || {},
        custom_user_linked: !!customUser,
        custom_user_id: customUser?.id,
        auth_id_in_custom: customUser?.auth_user_id,
        status: customUser?.status || 'active',
        role: customUser?.role || 'user',
        name: authUser.user_metadata?.name || customUser?.name || '',
        image: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || customUser?.image,
        phone: authUser.user_metadata?.phone || customUser?.phone,
        ministry_name: customUser?.ministry_name
      };
    });

    // Sort users by role hierarchy
    const roleHierarchy = {
      "President": 1,
      "Deputy President": 2,
      "Prime Cabinet Secretary": 3,
      "Cabinet Secretary": 4,
      "Principal Secretary": 5,
      "Cabinet Secretariat": 6,
      "Director": 7,
      "Assistant Director": 8,
      "Admin": 9,
      "Attorney General": 10,
      "Secretary to the Cabinet": 11
    };

    authUsers.sort((a, b) => {
      const roleA = roleHierarchy[a.role as keyof typeof roleHierarchy] || 999;
      const roleB = roleHierarchy[b.role as keyof typeof roleHierarchy] || 999;
      
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      
      return a.id.localeCompare(b.id);
    });

    console.log('✅ Users page - Loaded:', {
      user: session.user.email,
      role: session.user.role,
      authUsersCount: authUsers.length
    });

  } catch (error) {
    console.error('💥 Error in UsersPage:', error);
    // authUsers will remain empty array
  }

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
"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import Image from "next/image";
import Link from "next/link";

interface AuthUser {
  id: string;
  email: string;
  email_confirmed: boolean;
  last_sign_in: string | null;
  created_at: string;
  user_metadata: any;
  custom_user_linked: boolean;
  custom_user_id?: string;
  auth_id_in_custom?: string;
  status: string;
  role: string;
  name?: string;
  image?: string;
  phone?: string;
  ministry_name?: string;
}


// Define specific types for roles and statuses with proper hierarchy
type UserRole = 
  | "President"
  | "Deputy President"
  | "Prime Cabinet Secretary"
  | "Cabinet Secretary"
  | "Principal Secretary"
  | "Cabinet Secretariat"
  | "Director"
  | "Assistant Director"
  | "Admin"
  | "Attorney General"
  | "Secretary to the Cabinet";

type UserStatus = "active" | "inactive" | "pending" | "suspended";

// Role hierarchy for sorting
const roleHierarchy: Record<UserRole, number> = {
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

// Use Record type for better TypeScript support
const roleColors: Record<UserRole | "Admin", string> = {
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

const statusColors: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const syncStatusColors = {
  synced: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  not_synced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  mismatched: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
};

const roles: UserRole[] = [
  "President",
  "Deputy President",
  "Prime Cabinet Secretary",
  "Cabinet Secretary",
  "Principal Secretary",
  "Cabinet Secretariat",
  "Director",
  "Assistant Director",
  "Admin",
  "Attorney General",
  "Secretary to the Cabinet"
];

const statusOptions: UserStatus[] = ["active", "inactive", "pending", "suspended"];

// Enhanced UserAvatar component with better error handling
function UserAvatar({ user }: { user: AuthUser }) {
  const [imageError, setImageError] = useState(false);
  
  const getUserImage = (user: AuthUser): string | null => {
    try {
      // Priority order for image sources
      const imagePath = user.image || user.user_metadata?.image || user.user_metadata?.avatar_url;
      
      if (!imagePath) {
        return null;
      }

      // Handle external URLs
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      
      // Handle local paths
      if (imagePath.startsWith('/')) {
        return imagePath;
      }
      
      // Default to images folder
      return `/images/users/${imagePath}`;
    } catch (error) {
      console.error('Error getting user image:', error);
      return null;
    }
  };

  const getUserInitials = (user: AuthUser) => {
    try {
      const name = user.user_metadata?.name || user.email || '';
      return name
        .split(' ')
        .map((n: string) => n[0]) 
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } catch {
      return 'US';
    }
  };

  const getRoleColorForAvatar = (role: string) => {
    const colorMap: Record<string, string> = {
      President: "bg-purple-500",
      "Deputy President": "bg-blue-500", 
      "Prime Cabinet Secretary": "bg-indigo-500",
      "Cabinet Secretary": "bg-green-500",
      "Principal Secretary": "bg-teal-500",
      "Cabinet Secretariat": "bg-orange-500",
      Director: "bg-cyan-500",
      "Assistant Director": "bg-cyan-400",
      Admin: "bg-gray-500",
      "Attorney General": "bg-red-500",
      "Secretary to the Cabinet": "bg-amber-500"
    };
    return colorMap[role] || "bg-brand-500";
  };

  const imageUrl = getUserImage(user);

  if (!imageUrl || imageError) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getRoleColorForAvatar(user.role)}`}>
        <span className="text-sm font-medium text-white">
          {getUserInitials(user)}
        </span>
      </div>
    );
  }

  return (
    <div className="h-10 w-10 overflow-hidden rounded-full">
      <Image
        width={40}
        height={40}
        src={imageUrl}
        alt={`${user.user_metadata?.name || user.email}'s profile picture`}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
        unoptimized={imageUrl.startsWith('/images/')}
      />
    </div>
  );
}



// Main component with error boundary
export default function UsersList() {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const { user: currentUser, loading: userLoading } = useUser();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Cabinet Secretary" as UserRole,
    status: "active" as UserStatus,
    phone: "",
    password: "",
    image: "",
  });

  useEffect(() => {
    let mounted = true;

    const fetchAuthUsers = async () => {
      try {
        console.log('🔄 Starting to fetch auth users...');
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/auth/users/all');
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API Data received:', { 
          userCount: data.users?.length,
          total: data.total 
        });
        
        if (!mounted) return;
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Sort users by role hierarchy first, then by ID ascending
        const sortedUsers = (data.users || []).sort((a: AuthUser, b: AuthUser) => {
          const roleA = roleHierarchy[a.role as UserRole] || 999;
          const roleB = roleHierarchy[b.role as UserRole] || 999;
          
          if (roleA !== roleB) {
            return roleA - roleB;
          }
          
          // If same role, sort by ID ascending
          return a.id.localeCompare(b.id);
        });
        
        setAuthUsers(sortedUsers);
      } catch (error) {
        console.error('💥 Error fetching auth users:', error);
        if (mounted) {
          setError('Failed to load authentication users. Please try again.');
          setHasError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAuthUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = authUsers.filter(user => {
    const matchesFilter = filter === "all" || user.role === filter;
    const matchesSearch = 
      (user.user_metadata?.name || user.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleEdit = (user: AuthUser) => {
    setEditingUser(user);
    setFormData({
      name: user.user_metadata?.name || "",
      email: user.email,
      role: (user.role as UserRole) || "Cabinet Secretary",
      status: (user.status as UserStatus) || "active",
      phone: user.phone || "",
      password: "", // Don't pre-fill password for security
      image: user.user_metadata?.image || user.image || "",
    });
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "Cabinet Secretary",
      status: "active",
      phone: "",
      password: "",
      image: "",
    });
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const url = '/api/admin/users';
      const method = 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('User created successfully!');
        // Refresh the users list
        const refreshResponse = await fetch('/api/auth/users');
        const refreshData = await refreshResponse.json();
        if (refreshData.users) {
          const sortedUsers = refreshData.users.sort((a: AuthUser, b: AuthUser) => {
            const roleA = roleHierarchy[a.role as UserRole] || 999;
            const roleB = roleHierarchy[b.role as UserRole] || 999;
            if (roleA !== roleB) return roleA - roleB;
            return a.id.localeCompare(b.id);
          });
          setAuthUsers(sortedUsers);
        }
        setTimeout(() => {
          setIsModalOpen(false);
          resetForm();
        }, 1000);
      } else {
        setError(result.error || 'Error creating user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('User deleted successfully!');
        // Refresh the users list
        setAuthUsers(prev => prev.filter(user => user.id !== userToDelete.id));
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }, 1000);
      } else {
        setError(result.error || 'Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Network error. Please try again.');
    }
  };

  const syncUser = async (authUserId: string, email: string) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authUserId, email }),
      });

      if (response.ok) {
        setSuccess('User synced successfully!');
        // Refresh the users list
        const refreshResponse = await fetch('/api/auth/users');
        const refreshData = await refreshResponse.json();
        if (refreshData.users) {
          setAuthUsers(refreshData.users);
        }
      } else {
        const error = await response.json();
        setError(`Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      setError('Sync failed');
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess('Confirmation email sent!');
      } else {
        const error = await response.json();
        setError(`Failed to send confirmation: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      setError('Failed to send confirmation email');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "Cabinet Secretary",
      status: "active",
      phone: "",
      password: "",
      image: "",
    });
    setEditingUser(null);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openDeleteModal = (user: AuthUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  // Safe role color getter with fallback
  const getRoleColor = (role: string): string => {
    return roleColors[role as UserRole] || roleColors.Admin;
  };

  // Safe status color getter
  const getStatusColor = (status: string): string => {
    return statusColors[status as UserStatus] || statusColors.inactive;
  };

  const getSyncStatusColor = (user: AuthUser): string => {
    if (!user.custom_user_linked) return syncStatusColors.not_synced;
    if (user.auth_id_in_custom && !user.custom_user_linked) return syncStatusColors.mismatched;
    return syncStatusColors.synced;
  };

  const getSyncStatusText = (user: AuthUser): string => {
    if (!user.custom_user_linked) return "Not Synced";
    if (user.auth_id_in_custom && !user.custom_user_linked) return "Mismatched";
    return "Synced";
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Calculate statistics
  const stats = {
    total: authUsers.length,
    confirmed: authUsers.filter(u => u.email_confirmed).length,
    unconfirmed: authUsers.filter(u => !u.email_confirmed).length,
    synced: authUsers.filter(u => u.custom_user_linked).length,
    notSynced: authUsers.filter(u => !u.custom_user_linked).length,
  };

  // Show error state
  if (hasError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Failed to load users
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading the users data.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Statistics Cards - TailAdmin Styling */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">{stats.total}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/15">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">{stats.confirmed}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/15">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">{stats.unconfirmed}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unconfirmed</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-500/15">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">{stats.synced}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Synced</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/15">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header with Search and Filters */}
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                Cabinet Members
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage authentication users and their system access
              </p>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search moved to right */}
              <div className="relative sm:w-64">
                <input
                  type="text"
                  placeholder="Search cabinet members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Filter and Create buttons */}
              <div className="flex items-center gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors duration-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mx-5 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 sm:mx-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-5 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800 sm:mx-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1102px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-5 py-3 text-left sm:px-6">
                      <p className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Cabinet Member
                      </p>
                    </th>
                    <th className="px-5 py-3 text-left sm:px-6">
                      <p className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Role
                      </p>
                    </th>
                    <th className="px-5 py-3 text-left sm:px-6">
                      <p className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Status
                      </p>
                    </th>
                    <th className="px-5 py-3 text-left sm:px-6">
                      <p className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Sync Status
                      </p>
                    </th>
                    <th className="px-5 py-3 text-left sm:px-6">
                      <p className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Last Activity
                      </p>
                    </th>
                    <th className="px-5 py-3 text-left sm:px-6">
                      <p className="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Actions
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div>
                            <div>
                              <Link 
                                href={`/users/${user.id}`}
                                className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-600 dark:hover:text-brand-400"
                              >
                                {user.user_metadata?.name || user.email}
                              </Link>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="block text-gray-400 text-theme-xs dark:text-gray-500">
                                  {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-theme-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="space-y-1">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-theme-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-theme-xs font-medium ${
                            user.email_confirmed 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {user.email_confirmed ? 'Confirmed' : 'Unconfirmed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-theme-xs font-medium ${getSyncStatusColor(user)}`}>
                          {getSyncStatusText(user)}
                        </span>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <p className="text-gray-500 text-theme-sm dark:text-gray-400">
                          {user.last_sign_in 
                            ? new Date(user.last_sign_in).toLocaleDateString()
                            : 'Never signed in'
                          }
                        </p>
                        <p className="text-gray-400 text-theme-xs dark:text-gray-500">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap gap-1">
                          {!user.custom_user_linked && (
                            <button 
                              onClick={() => syncUser(user.id, user.email)}
                              className="rounded-lg bg-green-500 px-2 py-1 text-theme-xs font-medium text-white hover:bg-green-600 transition-colors duration-200"
                            >
                              Sync
                            </button>
                          )}
                          {!user.email_confirmed && (
                            <button 
                              onClick={() => resendConfirmation(user.email)}
                              className="rounded-lg bg-blue-500 px-2 py-1 text-theme-xs font-medium text-white hover:bg-blue-600 transition-colors duration-200"
                            >
                              Resend
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(user)}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user)}
                            className="rounded-lg bg-red-500 px-2 py-1 text-theme-xs font-medium text-white hover:bg-red-600 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No cabinet members found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "Try adjusting your search terms" : "No cabinet members available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error and Success Messages in Modal */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter a full URL to the profile image
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {!editingUser && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Delete User
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete {userToDelete.user_metadata?.name || userToDelete.email}? This action cannot be undone.
              </p>
              
              {/* Error Message in Delete Modal */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 mb-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800 mb-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{success}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
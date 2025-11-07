"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  password?: string;
  role: string;
  status: string;
  phone?: string;
  last_login?: string;
  ministry_id?: number;
  ministry_name?: string;
  cluster_id?: number;
  committees?: string[];
  created_at?: string;
  updated_at?: string;
}

interface Ministry {
  id: number;
  name: string;
  acronym: string;
  cluster_id?: number;
}

// Define specific types for roles and statuses
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

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: session } = useSession();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
    role: "Cabinet Secretary" as UserRole,
    status: "active" as UserStatus,
    phone: "",
    ministry_id: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchMinistries();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMinistries = async () => {
    try {
      const response = await fetch('/api/ministries');
      if (response.ok) {
        const data = await response.json();
        setMinistries(data);
      }
    } catch (error) {
      console.error('Error fetching ministries:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === "all" || user.role === filter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.ministry_name && user.ministry_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      image: user.image || "",
      role: user.role as UserRole,
      status: user.status as UserStatus,
      phone: user.phone || "",
      ministry_id: user.ministry_id?.toString() || "",
      password: "", // Don't pre-fill password for security
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
      image: "",
      role: "Cabinet Secretary",
      status: "active",
      phone: "",
      ministry_id: "",
      password: "",
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
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
        await fetchUsers(); // Refresh the list
        setTimeout(() => {
          setIsModalOpen(false);
          resetForm();
        }, 1000);
      } else {
        setError(result.error || `Error ${editingUser ? 'updating' : 'creating'} user`);
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
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('User deleted successfully!');
        await fetchUsers(); // Refresh the list
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

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      image: "",
      role: "Cabinet Secretary",
      status: "active",
      phone: "",
      ministry_id: "",
      password: "",
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

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const getMinistryName = (ministryId: number) => {
    const ministry = ministries.find(m => m.id === ministryId);
    return ministry ? `${ministry.name} (${ministry.acronym})` : 'Not assigned';
  };

  // Safe role color getter with fallback
  const getRoleColor = (role: string): string => {
    return roleColors[role as UserRole] || roleColors.Admin;
  };

  // Safe status color getter
  const getStatusColor = (status: string): string => {
    return statusColors[status as UserStatus] || statusColors.inactive;
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
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header with Filters */}
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cabinet members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-80"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
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

      {/* Error and Success Messages */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-700">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Cabinet Member</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Ministry</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Last Login</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <UserAvatar user={user} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {user.ministry_id ? getMinistryName(user.ministry_id) : 'Not assigned'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login 
                      ? `${new Date(user.last_login).toLocaleDateString()} at ${new Date(user.last_login).toLocaleTimeString()}`
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openDeleteModal(user)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                    placeholder="https://example.com/image.jpg or /images/users/photo.jpg or just filename.jpg"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter a full URL, relative path (/images/users/photo.jpg), or just filename (photo.jpg)
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
                    Ministry
                  </label>
                  <select
                    name="ministry_id"
                    value={formData.ministry_id}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Select Ministry</option>
                    {ministries.map(ministry => (
                      <option key={ministry.id} value={ministry.id}>
                        {ministry.name} ({ministry.acronym})
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
                Are you sure you want to delete {userToDelete.name}? This action cannot be undone.
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

// Separate component for user avatar with proper image handling
function UserAvatar({ user }: { user: User }) {
  const [imageError, setImageError] = useState(false);
  
  const getUserImage = (user: User) => {
    if (user.image) {
      // Handle both absolute URLs and relative paths
      if (user.image.startsWith('https') || user.image.startsWith('/')) {
        return user.image;
      }
      // If it's just a filename, assume it's in the images directory
      return `/images/users/${user.image}`;
    }
    return null;
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const imageUrl = getUserImage(user);

  if (!imageUrl || imageError) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
        <span className="text-sm font-medium text-brand-500">
          {getUserInitials(user.name)}
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
        alt={`${user.name}'s profile picture`}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
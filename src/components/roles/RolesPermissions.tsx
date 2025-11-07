// app/components/users/RolesPermissions.tsx
"use client";
import React, { useState, useEffect } from "react";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    [key: string]: string[];
  };
  userCount: number;
}

const defaultRoles: Role[] = [
  {
    id: "president",
    name: "President",
    description: "Full system access, final decision authority, e-signature capabilities",
    permissions: {
      memos: ["create", "read", "update", "delete", "approve"],
      committees: ["read", "manage"],
      meetings: ["create", "read", "update", "delete", "chair"],
      decisions: ["create", "read", "update", "delete", "sign"],
      actionLetters: ["create", "read", "update", "delete", "approve"],
      users: ["read", "manage"],
      reports: ["read", "export"],
      settings: ["read", "update"],
    },
    userCount: 1,
  },
  {
    id: "deputy_president",
    name: "Deputy President",
    description: "Committee chair responsibilities, decision review, extensive system access",
    permissions: {
      memos: ["create", "read", "update", "review"],
      committees: ["read", "manage", "chair"],
      meetings: ["create", "read", "update", "chair"],
      decisions: ["create", "read", "update", "recommend"],
      actionLetters: ["create", "read", "update"],
      users: ["read"],
      reports: ["read", "export"],
      settings: ["read"],
    },
    userCount: 1,
  },
  {
    id: "prime_cabinet_secretary",
    name: "Prime Cabinet Secretary",
    description: "Overall cabinet coordination, inter-ministerial oversight",
    permissions: {
      memos: ["create", "read", "update", "review", "coordinate"],
      committees: ["read", "manage", "chair"],
      meetings: ["create", "read", "update", "chair"],
      decisions: ["create", "read", "update", "recommend"],
      actionLetters: ["create", "read", "update", "coordinate"],
      users: ["read"],
      reports: ["read", "export"],
      settings: ["read"],
    },
    userCount: 1,
  },
  {
    id: "cabinet_secretary",
    name: "Cabinet Secretary",
    description: "Ministry-specific access, memo creation, committee participation",
    permissions: {
      memos: ["create", "read", "update", "submit"],
      committees: ["read", "participate"],
      meetings: ["read", "participate"],
      decisions: ["read"],
      actionLetters: ["read", "implement"],
      users: ["read"],
      reports: ["read"],
      settings: ["read"],
    },
    userCount: 22,
  },
  {
    id: "principal_secretary",
    name: "Principal Secretary",
    description: "State department management, technical oversight",
    permissions: {
      memos: ["create", "read", "update"],
      committees: ["read", "participate"],
      meetings: ["read", "participate"],
      decisions: ["read"],
      actionLetters: ["read", "implement"],
      users: ["read"],
      reports: ["read"],
      settings: ["read"],
    },
    userCount: 15,
  },
  {
    id: "cabinet_secretariat",
    name: "Cabinet Secretariat",
    description: "System administration, workflow management, user support",
    permissions: {
      memos: ["create", "read", "update", "assign"],
      committees: ["read", "manage"],
      meetings: ["create", "read", "update", "manage"],
      decisions: ["create", "read", "update"],
      actionLetters: ["create", "read", "update", "manage"],
      users: ["create", "read", "update"],
      reports: ["read", "export", "generate"],
      settings: ["read", "update"],
    },
    userCount: 8,
  },
  {
    id: "director",
    name: "Director",
    description: "Department-level access, document review",
    permissions: {
      memos: ["create", "read", "update"],
      committees: ["read"],
      meetings: ["read"],
      decisions: ["read"],
      actionLetters: ["read"],
      users: ["read"],
      reports: ["read"],
      settings: ["read"],
    },
    userCount: 25,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Full system administration access",
    permissions: {
      memos: ["create", "read", "update", "delete"],
      committees: ["create", "read", "update", "delete", "manage"],
      meetings: ["create", "read", "update", "delete", "manage"],
      decisions: ["create", "read", "update", "delete"],
      actionLetters: ["create", "read", "update", "delete", "manage"],
      users: ["create", "read", "update", "delete", "manage"],
      reports: ["create", "read", "update", "delete", "export", "generate"],
      settings: ["read", "update", "manage"],
    },
    userCount: 3,
  },
];

const permissionLabels = {
  create: "Create",
  read: "View",
  update: "Edit",
  delete: "Delete",
  approve: "Approve",
  manage: "Manage",
  chair: "Chair",
  review: "Review",
  recommend: "Recommend",
  submit: "Submit",
  participate: "Participate",
  implement: "Implement",
  assign: "Assign",
  export: "Export",
  generate: "Generate",
  coordinate: "Coordinate",
  sign: "Sign",
};

const modules = [
  "memos",
  "committees",
  "meetings",
  "decisions",
  "actionLetters",
  "users",
  "reports",
  "settings"
];

const moduleLabels = {
  memos: "Cabinet Memos",
  committees: "Committees",
  meetings: "Meetings",
  decisions: "Decisions",
  actionLetters: "Action Letters",
  users: "User Management",
  reports: "Reports & Analytics",
  settings: "System Settings"
};

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState(defaultRoles[0].id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userCounts, setUserCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {} as {[key: string]: string[]}
  });

  const currentRole = roles.find(role => role.id === selectedRole);

  useEffect(() => {
    fetchUserCounts();
  }, []);

  const fetchUserCounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        
        // Count users by role
        const counts: {[key: string]: number} = {};
        users.forEach((user: any) => {
          const roleKey = user.role.toLowerCase().replace(/\s+/g, '_');
          counts[roleKey] = (counts[roleKey] || 0) + 1;
        });
        
        setUserCounts(counts);
        
        // Update roles with actual user counts
        const updatedRoles = defaultRoles.map(role => ({
          ...role,
          userCount: counts[role.id] || 0
        }));
        
        setRoles(updatedRoles);
      }
    } catch (error) {
      console.error('Error fetching user counts:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description,
      permissions: { ...role.permissions }
    });
    setIsEditModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      permissions: Object.fromEntries(modules.map(module => [module, []]))
    });
    setIsCreateModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handlePermissionToggle = (module: string, permission: string) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions[module] || [];
      const updatedPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission];
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: updatedPermissions
        }
      };
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // In a real implementation, you would save to your database
      // For now, we'll update the local state
      if (isEditModalOpen) {
        const updatedRoles = roles.map(role => 
          role.id === selectedRole 
            ? { ...role, ...formData }
            : role
        );
        setRoles(updatedRoles);
        setSuccess('Role updated successfully!');
      } else {
        const newRole: Role = {
          id: formData.name.toLowerCase().replace(/\s+/g, '_'),
          ...formData,
          userCount: 0
        };
        setRoles(prev => [...prev, newRole]);
        setSuccess('Role created successfully!');
      }
      
      setTimeout(() => {
        setIsEditModalOpen(false);
        setIsCreateModalOpen(false);
        setSuccess(null);
      }, 2000);
      
    } catch (error) {
      setError('Failed to save role');
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      // Check if role has users
      const role = roles.find(r => r.id === roleId);
      if (role && role.userCount > 0) {
        setError(`Cannot delete role with ${role.userCount} assigned user(s). Reassign users first.`);
        return;
      }

      setRoles(prev => prev.filter(role => role.id !== roleId));
      setSuccess('Role deleted successfully!');
      
      // Reset selection if deleted role was selected
      if (selectedRole === roleId) {
        setSelectedRole(roles[0]?.id || '');
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete role');
    }
  };

  const getPermissionColor = (permission: string) => {
    const colors: {[key: string]: string} = {
      create: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      read: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      update: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      delete: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      approve: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      manage: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      chair: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    };
    
    return colors[permission] || "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage system roles and their access permissions
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors duration-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Role
        </button>
      </div>

      {/* Error and Success Messages */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Roles</h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full rounded-lg p-4 text-left transition-colors ${
                      selectedRole === role.id
                        ? "bg-brand-50 border border-brand-200 dark:bg-brand-900/20 dark:border-brand-800"
                        : "border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
                      {role.userCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {role.userCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Details */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-6 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentRole?.name} Permissions
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentRole?.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => currentRole && handleDelete(currentRole.id)}
                    disabled={currentRole?.userCount > 0}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete Role
                  </button>
                  <button 
                    onClick={() => currentRole && handleEdit(currentRole)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Edit Role
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(currentRole?.permissions || {}).map(([module, perms]) => (
                  <div key={module} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 dark:border-gray-800">
                    <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                      {moduleLabels[module as keyof typeof moduleLabels] || module}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((permission) => (
                        <span
                          key={permission}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPermissionColor(permission)}`}
                        >
                          {permissionLabels[permission as keyof typeof permissionLabels] || permission}
                        </span>
                      ))}
                      {perms.length === 0 && (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          No permissions
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Role Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Permissions:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {Object.values(currentRole?.permissions || {}).flat().length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Modules Access:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {Object.keys(currentRole?.permissions || {}).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Assigned Users:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {currentRole?.userCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Role ID:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white font-mono text-xs">
                      {currentRole?.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Role Modal */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {isEditModalOpen ? 'Edit Role' : 'Create New Role'}
              </h2>
            </div>
            
            <div className="p-6">
              {/* Error and Success Messages in Modal */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 mb-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800 mb-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Permissions Grid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Module Permissions
                  </label>
                  <div className="space-y-4">
                    {modules.map(module => (
                      <div key={module} className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          {moduleLabels[module as keyof typeof moduleLabels] || module}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.keys(permissionLabels).map(permission => (
                            <label key={permission} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.permissions[module]?.includes(permission) || false}
                                onChange={() => handlePermissionToggle(module, permission)}
                                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                {permissionLabels[permission as keyof typeof permissionLabels]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsCreateModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                >
                  {isEditModalOpen ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// src/components/users/RolesPermissions.tsx
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
  isSystemRole?: boolean;
  hierarchy?: number;
}

const defaultRoles: Role[] = [
  {
    id: "president",
    name: "President",
    description: "Head of State, full system access, final decision authority, e-signature capabilities",
    hierarchy: 1,
    permissions: {
      memos: ["create", "read", "update", "delete", "approve", "sign"],
      committees: ["create", "read", "update", "delete", "manage", "chair"],
      meetings: ["create", "read", "update", "delete", "chair", "manage"],
      decisions: ["create", "read", "update", "delete", "sign", "approve"],
      actionLetters: ["create", "read", "update", "delete", "approve", "sign"],
      users: ["create", "read", "update", "delete", "manage"],
      reports: ["create", "read", "update", "delete", "export", "generate"],
      settings: ["read", "update", "manage"],
    },
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: "deputy_president",
    name: "Deputy President",
    description: "Second in command, committee chair responsibilities, decision review",
    hierarchy: 2,
    permissions: {
      memos: ["create", "read", "update", "review", "approve"],
      committees: ["create", "read", "update", "manage", "chair"],
      meetings: ["create", "read", "update", "chair", "manage"],
      decisions: ["create", "read", "update", "recommend", "approve"],
      actionLetters: ["create", "read", "update", "approve"],
      users: ["read"],
      reports: ["read", "export"],
      settings: ["read"],
    },
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: "prime_cabinet_secretary",
    name: "Prime Cabinet Secretary",
    description: "Overall cabinet coordination, inter-ministerial oversight",
    hierarchy: 3,
    permissions: {
      memos: ["create", "read", "update", "review", "coordinate", "approve"],
      committees: ["create", "read", "update", "manage", "chair"],
      meetings: ["create", "read", "update", "chair", "manage"],
      decisions: ["create", "read", "update", "recommend", "coordinate"],
      actionLetters: ["create", "read", "update", "coordinate", "approve"],
      users: ["read"],
      reports: ["read", "export", "generate"],
      settings: ["read"],
    },
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: "cabinet_secretariat",
    name: "Cabinet Secretariat",
    description: "Cabinet office administration, workflow management, user support",
    hierarchy: 4,
    permissions: {
      memos: ["create", "read", "update", "assign", "manage"],
      committees: ["create", "read", "update", "manage"],
      meetings: ["create", "read", "update", "manage", "schedule"],
      decisions: ["create", "read", "update", "manage"],
      actionLetters: ["create", "read", "update", "manage", "track"],
      users: ["create", "read", "update", "manage"],
      reports: ["read", "export", "generate"],
      settings: ["read", "update"],
    },
    userCount: 8,
    isSystemRole: true,
  },
  {
    id: "attorney_general",
    name: "Attorney General",
    description: "Legal review, constitutional compliance, legal advisory",
    hierarchy: 5,
    permissions: {
      memos: ["read", "review", "legal_review", "comment"],
      committees: ["read", "participate", "legal_advisor"],
      meetings: ["read", "participate", "legal_advisor"],
      decisions: ["read", "legal_review", "certify"],
      actionLetters: ["read", "legal_review"],
      users: ["read"],
      reports: ["read"],
      settings: ["read"],
    },
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: "cabinet_secretary",
    name: "Cabinet Secretary",
    description: "Ministry head, memo creation, committee participation, decision implementation",
    hierarchy: 6,
    permissions: {
      memos: ["create", "read", "update", "submit", "review"],
      committees: ["read", "participate", "present"],
      meetings: ["read", "participate", "present"],
      decisions: ["read", "implement"],
      actionLetters: ["read", "implement", "assign"],
      users: ["read"],
      reports: ["read", "export"],
      settings: ["read"],
    },
    userCount: 22,
    isSystemRole: true,
  },
  {
    id: "principal_secretary",
    name: "Principal Secretary",
    description: "State department management, technical oversight, implementation",
    hierarchy: 7,
    permissions: {
      memos: ["create", "read", "update", "review"],
      committees: ["read", "participate", "technical_advisor"],
      meetings: ["read", "participate"],
      decisions: ["read", "implement", "report"],
      actionLetters: ["read", "implement", "monitor"],
      users: ["read"],
      reports: ["read", "export", "generate"],
      settings: ["read"],
    },
    userCount: 15,
    isSystemRole: true,
  },
  {
    id: "director",
    name: "Director",
    description: "Department-level management, document preparation, technical review",
    hierarchy: 8,
    permissions: {
      memos: ["create", "read", "update", "prepare"],
      committees: ["read", "support"],
      meetings: ["read", "support"],
      decisions: ["read"],
      actionLetters: ["read", "prepare"],
      users: ["read"],
      reports: ["read", "generate"],
      settings: ["read"],
    },
    userCount: 25,
    isSystemRole: true,
  },
  {
    id: "assistant_director",
    name: "Assistant Director",
    description: "Reports to Director, document drafting, committee support, research",
    hierarchy: 9,
    permissions: {
      memos: ["create", "read", "update", "draft"],
      committees: ["read", "support", "minute"],
      meetings: ["read", "support", "minute"],
      decisions: ["read"],
      actionLetters: ["read", "draft"],
      users: ["read"],
      reports: ["read", "generate"],
      settings: ["read"],
    },
    userCount: 20,
    isSystemRole: false,
  },
  {
    id: "co_officer",
    name: "Cabinet Office Officer",
    description: "Cabinet office operations, document management, meeting coordination",
    hierarchy: 10,
    permissions: {
      memos: ["create", "read", "update", "process"],
      committees: ["read", "coordinate", "support"],
      meetings: ["create", "read", "update", "coordinate"],
      decisions: ["create", "read", "update"],
      actionLetters: ["create", "read", "update", "track"],
      users: ["read"],
      reports: ["read", "generate"],
      settings: ["read"],
    },
    userCount: 12,
    isSystemRole: false,
  },
  {
    id: "sysadmin",
    name: "System Administrator",
    description: "Technical system administration, database management, security",
    hierarchy: 11,
    permissions: {
      memos: ["read"],
      committees: ["read"],
      meetings: ["read"],
      decisions: ["read"],
      actionLetters: ["read"],
      users: ["create", "read", "update", "delete", "manage", "reset"],
      reports: ["read", "export", "generate", "system_logs"],
      settings: ["read", "update", "manage", "system_config"],
    },
    userCount: 3,
    isSystemRole: true,
  },
  {
    id: "admin",
    name: "Business Administrator",
    description: "Business owner, full administrative access, user management, configuration",
    hierarchy: 12,
    permissions: {
      memos: ["create", "read", "update", "delete", "manage"],
      committees: ["create", "read", "update", "delete", "manage"],
      meetings: ["create", "read", "update", "delete", "manage"],
      decisions: ["create", "read", "update", "delete", "manage"],
      actionLetters: ["create", "read", "update", "delete", "manage"],
      users: ["create", "read", "update", "delete", "manage", "assign_roles"],
      reports: ["create", "read", "update", "delete", "export", "generate"],
      settings: ["read", "update", "manage"],
    },
    userCount: 3,
    isSystemRole: true,
  },
];

const permissionLabels: { [key: string]: string } = {
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
  legal_review: "Legal Review",
  comment: "Comment",
  legal_advisor: "Legal Advisor",
  certify: "Certify",
  present: "Present",
  technical_advisor: "Technical Advisor",
  report: "Report",
  monitor: "Monitor",
  prepare: "Prepare",
  support: "Support",
  draft: "Draft",
  minute: "Take Minutes",
  process: "Process",
  track: "Track",
  schedule: "Schedule",
  reset: "Reset Passwords",
  system_logs: "System Logs",
  system_config: "System Configuration",
  assign_roles: "Assign Roles",
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

const moduleLabels: { [key: string]: string } = {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      // Fetch roles from API
      const rolesResponse = await fetch('/api/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData);
      } else {
        // Fallback to default roles if API fails
        console.error('Failed to fetch roles from API, using defaults');
        const counts: {[key: string]: number} = {};
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          users.forEach((user: any) => {
            const roleKey = user.role.toLowerCase().replace(/\s+/g, '_');
            counts[roleKey] = (counts[roleKey] || 0) + 1;
          });
        }
        
        const updatedRoles = defaultRoles.map(role => ({
          ...role,
          userCount: counts[role.id] || 0
        }));
        setRoles(updatedRoles);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load role data');
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
      
      if (isEditModalOpen) {
        // Update existing role
        const response = await fetch('/api/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleKey: selectedRole,
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update role');
        }

        const updatedRole = await response.json();
        
        // Update local state
        setRoles(prev => prev.map(role => 
          role.id === selectedRole ? updatedRole : role
        ));
        
        setSuccess('Role updated successfully!');
      } else {
        // Create new role
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create role');
        }

        const newRole = await response.json();
        setRoles(prev => [...prev, newRole]);
        setSuccess('Role created successfully!');
      }
      
      setTimeout(() => {
        setIsEditModalOpen(false);
        setIsCreateModalOpen(false);
        setSuccess(null);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error saving role:', error);
      setError(error.message || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) {
      setError('Cannot delete system roles');
      return;
    }

    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles?roleKey=${roleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }

      setRoles(prev => prev.filter(role => role.id !== roleId));
      setSuccess('Role deleted successfully!');
      
      if (selectedRole === roleId) {
        setSelectedRole(roles[0]?.id || '');
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error deleting role:', error);
      setError(error.message || 'Failed to delete role');
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
      sign: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      legal_review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      coordinate: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    };
    
    return colors[permission] || "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const sortRolesByHierarchy = (roles: Role[]) => {
    return [...roles].sort((a, b) => (a.hierarchy || 999) - (b.hierarchy || 999));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage system roles and their access permissions for the E-Cabinet system
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
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Roles</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {roles.length} roles configured
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {sortRolesByHierarchy(roles).map((role) => (
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
                      <div className="flex gap-1">
                        {role.isSystemRole && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            System
                          </span>
                        )}
                        {role.userCount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {role.userCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {role.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

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
                    disabled={currentRole?.isSystemRole || (currentRole?.userCount ?? 0) > 0}
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
                      {(perms as string[]).map((permission) => (
                        <span
                          key={permission}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPermissionColor(permission)}`}
                        >
                          {permissionLabels[permission as keyof typeof permissionLabels] || permission}
                        </span>
                      ))}
                      {(perms as string[]).length === 0 && (
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
                    <span className="text-gray-500 dark:text-gray-400">Role Type:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {currentRole?.isSystemRole ? 'System Role' : 'Custom Role'}
                    </span>
                  </div>
                  {currentRole?.hierarchy && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Hierarchy Level:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {currentRole.hierarchy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Role Modal */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {isEditModalOpen ? 'Edit Role' : 'Create New Role'}
              </h2>
            </div>
            
            <div className="p-6">
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
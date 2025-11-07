// app/components/users/RolesPermissions.tsx
"use client";
import React, { useState } from "react";

const roles = [
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
    id: "secretariat",
    name: "Secretariat",
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
};

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState(roles[0].id);

  const currentRole = roles.find(role => role.id === selectedRole);

  return (
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
                  <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
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
              <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Edit Role
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {Object.entries(currentRole?.permissions || {}).map(([module, perms]) => (
                <div key={module} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 dark:border-gray-800">
                  <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {module.replace('_', ' ')} Module
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      >
                        {permissionLabels[permission]}
                      </span>
                    ))}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
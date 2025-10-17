// app/components/users/UsersList.tsx - UPDATED WITH KENYAN CABINET
"use client";
import React, { useState } from "react";

const users = [
  {
    id: "1",
    name: "H.E. Dr. William Samoei Ruto",
    email: "president@president.go.ke",
    role: "President",
    ministry: "Office of the President",
    status: "active",
    lastLogin: "2024-01-18T10:30:00",
    phone: "+254 700 000000",
    committees: ["Full Cabinet", "National Development Council"],
  },
  {
    id: "2",
    name: "Hon. Prof. Kithure Kindiki",
    email: "deputy.president@president.go.ke",
    role: "Deputy President",
    ministry: "Office of the Deputy President",
    status: "active",
    lastLogin: "2024-01-18T09:15:00",
    phone: "+254 700 000001",
    committees: ["Infrastructure & Energy", "Budget & Finance"],
  },
  {
    id: "3",
    name: "Hon. Musalia Mudavadi",
    email: "mudavadi@primecabinet.go.ke",
    role: "Prime Cabinet Secretary",
    ministry: "Prime Cabinet Secretary Office",
    status: "active",
    lastLogin: "2024-01-17T16:45:00",
    phone: "+254 700 000002",
    committees: ["Full Cabinet"],
  },
  {
    id: "4",
    name: "Hon. Kipchumba Murkomen",
    email: "murkomen@interior.go.ke",
    role: "Cabinet Secretary",
    ministry: "Ministry of Interior & National Administration",
    status: "active",
    lastLogin: "2024-01-18T11:20:00",
    phone: "+254 700 000003",
    committees: ["Security & Administration"],
  },
  {
    id: "5",
    name: "Hon. Soipan Tuya",
    email: "tuya@defence.go.ke",
    role: "Cabinet Secretary",
    ministry: "Ministry of Defence",
    status: "active",
    lastLogin: "2024-01-17T14:30:00",
    phone: "+254 700 000004",
    committees: ["Security & Administration"],
  },
  {
    id: "6",
    name: "Hon. Alfred Mutua",
    email: "mutua@foreignaffairs.go.ke",
    role: "Cabinet Secretary",
    ministry: "Ministry of Foreign & Diaspora Affairs",
    status: "active",
    lastLogin: "2024-01-16T10:15:00",
    phone: "+254 700 000005",
    committees: ["Full Cabinet"],
  },
  {
    id: "7",
    name: "Hon. John Mbadi Ng'ongo",
    email: "mbadi@treasury.go.ke",
    role: "Cabinet Secretary",
    ministry: "The National Treasury & Economic Planning",
    status: "active",
    lastLogin: "2024-01-18T08:45:00",
    phone: "+254 700 000006",
    committees: ["Budget & Finance"],
  },
  {
    id: "8",
    name: "Hon. Davis Chirchir",
    email: "chirchir@transport.go.ke",
    role: "Cabinet Secretary",
    ministry: "Ministry of Roads & Transport",
    status: "active",
    lastLogin: "2024-01-17T16:20:00",
    phone: "+254 700 000007",
    committees: ["Infrastructure & Energy"],
  },
  {
    id: "9",
    name: "Hon. Opiyo Wandayi",
    email: "wandayi@energy.go.ke",
    role: "Cabinet Secretary",
    ministry: "Ministry of Energy & Petroleum",
    status: "active",
    lastLogin: "2024-01-18T09:30:00",
    phone: "+254 700 000008",
    committees: ["Infrastructure & Energy"],
  },
  {
    id: "10",
    name: "Hon. Aden Duale",
    email: "duale@health.go.ke",
    role: "Cabinet Secretary",
    ministry: "Ministry of Health",
    status: "active",
    lastLogin: "2024-01-18T11:45:00",
    phone: "+254 700 000009",
    committees: ["Social Services"],
  },
];

const roleColors = {
  President: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Deputy President": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Prime Cabinet Secretary": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "Cabinet Secretary": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Secretariat: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "MDA Officer": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Auditor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function UsersList() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === "all" || user.role === filter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.ministry.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
              <option value="President">President</option>
              <option value="Deputy President">Deputy President</option>
              <option value="Prime Cabinet Secretary">Prime Cabinet Secretary</option>
              <option value="Cabinet Secretary">Cabinet Secretary</option>
            </select>
          </div>
        </div>
      </div>

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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                        <span className="text-sm font-medium text-brand-500">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {user.ministry}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.status]}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.lastLogin).toLocaleDateString()} at {new Date(user.lastLogin).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                        Edit
                      </button>
                      <button className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
                        View
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
    </div>
  );
}
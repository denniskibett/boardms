import type { Metadata } from "next";
import AssignMembers from "@/components/committees/AssignMembers";

export const metadata: Metadata = {
  title: "Assign Committee Members | E-Cabinet System",
  description: "Assign members to cabinet committees",
};

export default function AssignMembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assign Committee Members
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage committee memberships and assignments
          </p>
        </div>
      </div>
      <AssignMembers />
    </div>
  );
}
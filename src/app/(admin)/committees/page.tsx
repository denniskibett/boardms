// app/(admin)/committees/page.tsx
import type { Metadata } from "next";
import CommitteesList from "@/components/committees/CommitteesList";

export const metadata: Metadata = {
  title: "Committees | E-Cabinet System",
  description: "View and manage cabinet committees",
};

export default function CommitteesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cabinet Committees
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage committee memberships and assignments
          </p>
        </div>
      </div>
      <CommitteesList />
    </div>
  );
}
import type { Metadata } from "next";
import MyCommitteesList from "@/components/committees/MyCommitteesList";

export const metadata: Metadata = {
  title: "My Committees | E-Cabinet System",
  description: "View committees you are a member of",
};

export default function MyCommitteesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Committees
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Committees you are currently serving on
          </p>
        </div>
      </div>
      <MyCommitteesList />
    </div>
  );
}
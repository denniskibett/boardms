// app/(admin)/memos/all/page.tsx
import type { Metadata } from "next";
import AllMemosList from "@/components/memos/AllMemosList";

export const metadata: Metadata = {
  title: "All Government Memos | E-Cabinet System",
  description: "View all government memos across all ministries",
};

export default function AllMemosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Government Memos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage all memos across all ministries and departments
          </p>
        </div>
      </div>
      <AllMemosList />
    </div>
  );
}
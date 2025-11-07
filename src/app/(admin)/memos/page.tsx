// app/(admin)/memos/page.tsx
import type { Metadata } from "next";
import MemosList from "@/components/memos/MemosList";
import { Link } from "lucide-react";

export const metadata: Metadata = {
  title: "My Government Memos | E-Cabinet System",
  description: "View and manage your government memos",
};

export default function MyMemosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Government Memos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage all memos you{"'"}ve created
          </p>
        </div>
        <Link
          href="/memos/create"
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          Create New Memo
        </Link>
      </div>
      <MemosList />
    </div>
  );
}
// app/(admin)/audit/page.tsx
import type { Metadata } from "next";
import AuditTrail from "@/components/audit/AuditTrail";

export const metadata: Metadata = {
  title: "Audit Trail | E-Cabinet System",
  description: "System activity audit trail and logs",
};

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Trail
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive log of all system activities and changes
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Export Logs
          </button>
          <button className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            Filter Logs
          </button>
        </div>
      </div>
      <AuditTrail />
    </div>
  );
}
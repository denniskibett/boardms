// app/(admin)/decisions/page.tsx
import type { Metadata } from "next";
import DecisionsList from "@/components/decisions/DecisionsList";

export const metadata: Metadata = {
  title: "Cabinet Decisions | E-Cabinet System",
  description: "View all cabinet decisions and resolutions",
};

export default function DecisionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cabinet Decisions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View all approved cabinet decisions and resolutions
          </p>
        </div>
      </div>
      <DecisionsList />
    </div>
  );
}
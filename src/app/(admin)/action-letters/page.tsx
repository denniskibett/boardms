import type { Metadata } from "next";
import ActionLettersList from "@/components/action-letters/ActionLettersList";

export const metadata: Metadata = {
  title: "Action Letters | E-Cabinet System",
  description: "Manage action letters sent to ministries for implementation",
};

export default function ActionLettersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Action Letters
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage action letters sent to ministries for implementation of cabinet decisions
          </p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600">
          Generate Action Letters
        </button>
      </div>
      <ActionLettersList />
    </div>
  );
}
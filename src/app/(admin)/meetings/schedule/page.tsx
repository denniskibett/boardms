// app/(admin)/meetings/schedule/page.tsx
import type { Metadata } from "next";
import ScheduleMeetingForm from "@/components/meetings/ScheduleMeetingForm";

export const metadata: Metadata = {
  title: "Schedule Meeting | E-Cabinet System",
  description: "Schedule a new committee or cabinet meeting",
};

export default function ScheduleMeetingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schedule Meeting
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Schedule a new committee or full cabinet meeting
          </p>
        </div>
      </div>
      <ScheduleMeetingForm />
    </div>
  );
}
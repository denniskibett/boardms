import type { Metadata } from "next";
import MeetingMinutesList from "@/components/meetings/MeetingMinutesList";

export const metadata: Metadata = {
  title: "Meeting Minutes | E-Cabinet System",
  description: "View and manage meeting minutes",
};

export default function MeetingMinutesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meeting Minutes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Access minutes from previous meetings
          </p>
        </div>
      </div>
      <MeetingMinutesList />
    </div>
  );
}
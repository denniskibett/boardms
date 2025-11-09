// app/(admin)/meetings/calendar/page.tsx
import type { Metadata } from "next";
import MeetingCalendar from "@/components/meetings/MeetingCalendar";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import TodayMeetings from "@/components/meetings/TodayMeetings";

export const metadata: Metadata = {
  title: "Meeting Calendar | E-Cabinet System",
  description: "View all scheduled meetings in calendar format",
};

export default function MeetingCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meeting Calendar
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View all scheduled cabinet and committee meetings
          </p>
        </div>
        <a
          href="/meetings/schedule"
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          Schedule Meeting
        </a>
      </div>
      <MeetingCalendar />
      <UpcomingMeetings />
    </div>
  );
}
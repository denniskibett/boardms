// app/(admin)/dashboard/page.tsx
import type { Metadata } from "next";
import React from "react";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RecentMemos from "@/components/dashboard/RecentMemos";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import ActionItems from "@/components/dashboard/ActionItems";
import WorkflowChart from "@/components/dashboard/WorkflowChart";

export const metadata: Metadata = {
  title: "E-Cabinet Dashboard | Government Decision Management System",
  description: "E-Cabinet System Dashboard for Government Workflow Management",
};

export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Dashboard Metrics */}
      {/* <div className="col-span-12">
        <DashboardMetrics />
      </div> */}

      

      {/* Upcoming Meetings */}
      <div className="col-span-12 xl:col-span-12">
        <UpcomingMeetings />
      </div>

      {/* Charts and Workflow */}
      <div className="col-span-12 xl:col-span-12">
        <WorkflowChart />
      </div>

      {/* Recent Memos and Action Items */}
      <div className="col-span-12 lg:col-span-7">
        <RecentMemos />
      </div>

      <div className="col-span-12 lg:col-span-5">
        <ActionItems />
      </div>
    </div>
  );
}
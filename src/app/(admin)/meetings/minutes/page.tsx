import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/kit";
import MeetingMinutesList from "@/components/meetings/MeetingMinutesList";

export const metadata: Metadata = {
  title: "Meeting Minutes | E-Cabinet System",
  description: "View and manage meeting minutes",
};

export default function MeetingMinutesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Meeting minutes" description="Records of held meetings: agenda, participants and decisions." />
      <MeetingMinutesList />
    </div>
  );
}

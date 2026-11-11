// app/(admin)/meetings/schedule/page.tsx — scheduling happens in the slide-over on /meetings.
import { redirect } from "next/navigation";

export default function ScheduleMeetingPage() {
  redirect("/meetings?new=1");
}

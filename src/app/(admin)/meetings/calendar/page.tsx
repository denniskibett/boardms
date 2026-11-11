// app/(admin)/meetings/calendar/page.tsx — the calendar lives on /meetings.
import { redirect } from "next/navigation";

export default function MeetingCalendarPage() {
  redirect("/meetings?view=calendar");
}

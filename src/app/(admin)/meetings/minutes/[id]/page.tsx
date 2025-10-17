// app/(admin)/meetings/minutes/[id]/page.tsx
"use client";
import React from "react";
import { useParams } from "next/navigation";
import MeetingMinutesDetail from "@/components/meetings/MeetingMinutesDetail";

export default function MeetingMinutesDetailPage() {
  const params = useParams();
  const minuteId = params.id;

  return <MeetingMinutesDetail minuteId={minuteId as string} />;
}
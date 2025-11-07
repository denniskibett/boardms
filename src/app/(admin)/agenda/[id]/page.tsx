"use client";
import React from "react";
import { useParams } from "next/navigation";
import AgendaBookViewer from "@/components/agenda/AgendaBookViewer";

export default function AgendaBookPage() {
  const params = useParams();
  const agendaId = params.id;

  return <AgendaBookViewer agendaId={agendaId as string} />;
}
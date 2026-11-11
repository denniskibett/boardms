// app/(admin)/agenda/page.tsx
import type { Metadata } from "next";
import AgendaList from "@/components/agenda/AgendaList";

export const metadata: Metadata = {
  title: "Agenda Management | E-Cabinet System",
  description: "Create and manage meeting agenda",
};

export default function AgendaPage() {
  return <AgendaList />;
}

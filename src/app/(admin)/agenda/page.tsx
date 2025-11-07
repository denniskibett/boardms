// app/(admin)/agenda/page.tsx
import type { Metadata } from "next";
import AgendaList from "@/components/agenda/AgendaList";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agenda Management | E-Cabinet System",
  description: "Create and manage meeting agenda",
};

export default function agendaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agenda Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage meeting agenda and compile agenda books
          </p>
        </div>
        <Link
          href="/agenda/create"
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Create Agenda
        </Link>
      </div>
      <AgendaList />
    </div>
  );
}
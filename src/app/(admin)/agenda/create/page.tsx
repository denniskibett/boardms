import type { Metadata } from "next";
import CreateAgendaForm from "@/components/agenda/CreateAgendaForm";

export const metadata: Metadata = {
  title: "Create Agenda | E-Cabinet System",
  description: "Create a new meeting agenda",
};

export default function CreateAgendaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Agenda
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a new meeting agenda and add agenda items
          </p>
        </div>
      </div>
      <CreateAgendaForm />
    </div>
  );
}
// app/(admin)/memos/create/page.tsx
import type { Metadata } from "next";
import CreateMemoForm from "@/components/memos/CreateMemoForm";

export const metadata: Metadata = {
  title: "Create Government Memo | E-Cabinet System",
  description: "Create a new government memo for cabinet consideration",
};

export default function CreateMemoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Government Memo
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Draft a new memo for cabinet consideration and approval
          </p>
        </div>
      </div>
      <CreateMemoForm />
    </div>
  );
}
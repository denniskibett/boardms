// src/app/(admin)/page.tsx - Redirect to Dashboard
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "E-Cabinet System",
  description: "Government Decision Management System",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to dashboard with RBAC
  redirect("/dashboard");
}
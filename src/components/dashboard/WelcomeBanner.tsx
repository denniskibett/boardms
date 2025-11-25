// src/components/dashboard/WelcomeBanner.tsx - UPDATED FOR SERVER COMPONENT
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function WelcomeBanner() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white shadow-theme-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session.user?.name || session.user?.email}!
          </h1>
          <p className="mt-1 opacity-90">
            E-Cabinet System - Government Decision Management
          </p>
          <p className="mt-2 text-sm opacity-80">
            Role: <span className="font-medium">{session.user?.role || 'User'}</span>
          </p>
        </div>
        <div className="hidden md:block">
          <div className="rounded-full bg-white/20 p-4">
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

/** Shown by admin pages when the signed-in role lacks the module's view permission. */
export default function AccessDenied({ what = 'this page' }: { what?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <ShieldOff className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-800 dark:text-white/90">You don&apos;t have access to {what}</h2>
      <p className="mt-1 max-w-md text-theme-sm text-gray-500 dark:text-gray-400">
        Ask a system administrator to grant your role the permission if you need it.
      </p>
      <Link href="/dashboard" className="mt-5 text-theme-sm font-medium text-brand-500 hover:text-brand-600">
        Back to dashboard
      </Link>
    </div>
  );
}

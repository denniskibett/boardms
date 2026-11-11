import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

/** TailAdmin eCommerce-style metric card: grey icon tile, label, big number, optional hint. */
export default function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <Icon className="h-6 w-6 text-gray-800 dark:text-white/90" strokeWidth={1.75} />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value ?? '—'}</h4>
        {hint && <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full hover:[&>div]:border-brand-200 dark:hover:[&>div]:border-brand-800">
      {body}
    </Link>
  ) : (
    body
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">{children}</div>;
}

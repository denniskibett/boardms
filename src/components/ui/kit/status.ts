// Pure status helpers — no 'use client', so server components can call them too.

export const TONES = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80',
  brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
  error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
} as const;

export type Tone = keyof typeof TONES;

/** Maps common workflow statuses to a badge tone. */
export function toneForStatus(status?: string | null): Tone {
  const s = (status || '').toLowerCase();
  if (/(approved|completed|done|active|published|confirmed|closed|signed|implemented)/.test(s)) return 'success';
  if (/(pending|draft|scheduled|in.?progress|review|upcoming|open)/.test(s)) return 'warning';
  if (/(rejected|cancel|failed|overdue|inactive|suspended|deleted)/.test(s)) return 'error';
  if (/(submitted|new|ongoing)/.test(s)) return 'brand';
  return 'gray';
}

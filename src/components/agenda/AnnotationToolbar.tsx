'use client';

import React from 'react';
import { PenLine, X } from 'lucide-react';

interface AnnotationToolbarProps {
  isAnnotating: boolean;
  onToggleAnnotating: () => void;
}

export default function AnnotationToolbar({ isAnnotating, onToggleAnnotating }: AnnotationToolbarProps) {
  return (
    <button
      type="button"
      onClick={onToggleAnnotating}
      aria-pressed={isAnnotating}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-theme-sm font-medium shadow-theme-xs transition ${
        isAnnotating
          ? 'bg-error-500 text-white hover:bg-error-600'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5'
      }`}
    >
      {isAnnotating ? <X className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
      {isAnnotating ? 'Stop annotating' : 'Annotate'}
    </button>
  );
}

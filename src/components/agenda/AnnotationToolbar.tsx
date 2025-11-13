'use client';

import React from 'react';

interface AnnotationToolbarProps {
  isAnnotating: boolean;
  onToggleAnnotating: () => void;
}

export default function AnnotationToolbar({
  isAnnotating,
  onToggleAnnotating
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggleAnnotating}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isAnnotating
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAnnotating ? 'Stop Annotating' : 'Annotate'}
      </button>
    </div>
  );
}
// app/resources/page.tsx
"use client";

import React from 'react';
import ResourcesManager from '@/components/resources/ResourcesManager';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ResourcesManager />
      </div>
    </div>
  );
}
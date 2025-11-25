// app/resources/page.tsx
"use client";

import React from 'react';
import ResourcesManager from '@/components/resources/ResourcesManager';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/20 py-6">
      <div className="space-y-6">
        <ResourcesManager />
      </div>
    </div>
  );
}
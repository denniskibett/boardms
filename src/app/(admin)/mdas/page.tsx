'use client'

import { useState } from 'react'
import { useHierarchicalMDAs } from '@/hooks/useHierarchicalMDAs'
import { HierarchicalView } from '@/components/mdas/HierarchicalView'

export default function MDAsPage(): JSX.Element {
  const [search, setSearch] = useState<string>('')
  const { data, loading, error } = useHierarchicalMDAs()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Government MDAs</h1>
          <p className="text-gray-600 mt-2">
            Browse through Ministries, Departments, and Agencies of the Kenyan Government
          </p>
          
          {data && (
            <div className="flex gap-6 mt-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold">{data.ministries.length}</span> Ministries
              </div>
              <div>
                <span className="font-semibold">{data.totalDepartments}</span> State Departments
              </div>
              <div>
                <span className="font-semibold">{data.totalAgencies}</span> Agencies
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : data ? (
          <HierarchicalView 
            ministries={data.ministries}
            search={search}
            onSearchChange={setSearch}
          />
        ) : null}
      </div>
    </div>
  )
}
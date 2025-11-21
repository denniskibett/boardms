import { useState } from 'react'
import { MinistryWithDepartments } from '@/types/mda'
import { DepartmentCard } from './DepartmentCard'

interface MinistryCardProps {
  ministry: MinistryWithDepartments
}

export function MinistryCard({ ministry }: MinistryCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const departmentCount = ministry.state_departments?.length || 0
  const agencyCount = ministry.state_departments?.reduce((total, dept) => 
    total + (dept.agencies?.length || 0), 0
  ) || 0

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Ministry Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{ministry.name}</h3>
              {ministry.acronym && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                  {ministry.acronym}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {ministry.headquarters && (
                <span><strong>HQ:</strong> {ministry.headquarters}</span>
              )}
              {ministry.phone && (
                <span><strong>Phone:</strong> {ministry.phone}</span>
              )}
              {ministry.email && (
                <span><strong>Email:</strong> {ministry.email}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-gray-500">
              <div>{departmentCount} department{departmentCount !== 1 ? 's' : ''}</div>
              <div>{agencyCount} agency{agencyCount !== 1 ? 's' : ''}</div>
            </div>
            
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {departmentCount === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No state departments found for this ministry
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <h4 className="font-medium text-gray-900 mb-4">State Departments</h4>
              {ministry.state_departments?.map((department) => (
                <DepartmentCard key={department.id} department={department} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
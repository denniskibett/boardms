import { useState } from 'react'
import { StateDepartmentWithAgencies } from '@/types/mda'
import { AgencyCard } from './AgencyCard'

interface DepartmentCardProps {
  department: StateDepartmentWithAgencies
}

export function DepartmentCard({ department }: DepartmentCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const agencyCount = department.agencies?.length || 0

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Department Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h5 className="font-medium text-gray-900 mb-1">{department.name}</h5>
            
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {department.principal_secretary && (
                <span><strong>PS:</strong> {department.principal_secretary}</span>
              )}
              {department.location && (
                <span><strong>Location:</strong> {department.location}</span>
              )}
              {department.phone && (
                <span><strong>Phone:</strong> {department.phone}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-sm text-gray-500">
              {agencyCount} agency{agencyCount !== 1 ? 's' : ''}
            </div>
            
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {agencyCount === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No agencies found for this department
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <h6 className="font-medium text-gray-900 text-sm mb-3">Agencies</h6>
              {department.agencies?.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
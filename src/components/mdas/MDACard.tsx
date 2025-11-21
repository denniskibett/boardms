import Link from 'next/link'
import { MDAEntity, MDAType } from '@/types/mda'

interface MDACardProps {
  mda: MDAEntity
  type: MDAType
}

export function MDACard({ mda, type }: MDACardProps): JSX.Element {
  const getMDAType = (): string => {
    switch (type) {
      case 'ministry': return 'Ministry'
      case 'department': return 'State Department'
      case 'agency': return 'Agency'
      default: return 'MDA'
    }
  }

  const getDetails = (): {
    name: string
    acronym?: string | null
    ministry?: string
    department?: string
    principal_secretary?: string | null
    director_general?: string | null
    headquarters?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  } => {
    if (type === 'ministry') {
      const ministry = mda as any
      return {
        name: ministry.name,
        acronym: ministry.acronym,
        headquarters: ministry.headquarters,
        phone: ministry.phone,
        email: ministry.email,
        website: ministry.website
      }
    } else if (type === 'department') {
      const department = mda as any
      return {
        name: department.name,
        // No acronym for departments
        ministry: department.ministries?.name,
        principal_secretary: department.principal_secretary || department.ps,
        phone: department.phone,
        website: department.website,
        email: department.email
      }
    } else {
      const agency = mda as any
      return {
        name: agency.name,
        acronym: agency.acronym,
        department: agency.state_departments?.name,
        ministry: agency.state_departments?.ministries?.name,
        director_general: agency.director_general,
        phone: agency.phone,
        website: agency.website,
        email: agency.email
      }
    }
  }

  const details = getDetails()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{details.name}</h3>
          {details.acronym && (
            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mt-1">
              {details.acronym}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {getMDAType()}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {details.ministry && (
          <p><strong>Ministry:</strong> {details.ministry}</p>
        )}
        {details.department && (
          <p><strong>Department:</strong> {details.department}</p>
        )}
        {details.principal_secretary && (
          <p><strong>Principal Secretary:</strong> {details.principal_secretary}</p>
        )}
        {details.director_general && (
          <p><strong>Director General:</strong> {details.director_general}</p>
        )}
        {details.headquarters && (
          <p><strong>Headquarters:</strong> {details.headquarters}</p>
        )}
        {details.phone && (
          <p><strong>Phone:</strong> {details.phone}</p>
        )}
        {details.email && (
          <p><strong>Email:</strong> {details.email}</p>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <Link 
          href={`/mdas/${mda.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details →
        </Link>
        {details.website && (
          <a 
            href={details.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Website
          </a>
        )}
      </div>
    </div>
  )
}
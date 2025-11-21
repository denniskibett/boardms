import { Agency } from '@/types/mda'

interface AgencyCardProps {
  agency: Agency
}

export function AgencyCard({ agency }: AgencyCardProps): JSX.Element {
  return (
    <div className="bg-white rounded border border-gray-200 p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h6 className="font-medium text-gray-900 text-sm">{agency.name}</h6>
            {agency.acronym && (
              <span className="inline-block bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                {agency.acronym}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            {agency.director_general && (
              <div><strong>DG:</strong> {agency.director_general}</div>
            )}
            {agency.location && (
              <div><strong>Location:</strong> {agency.location}</div>
            )}
            {agency.phone && (
              <div><strong>Phone:</strong> {agency.phone}</div>
            )}
          </div>
        </div>

        {agency.website && (
          <a 
            href={agency.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs ml-2"
          >
            Website
          </a>
        )}
      </div>
    </div>
  )
}
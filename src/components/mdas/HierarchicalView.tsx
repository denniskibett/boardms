import { MinistryWithDepartments } from '@/types/mda'
import { MinistryCard } from './MinistryCard'

interface HierarchicalViewProps {
  ministries: MinistryWithDepartments[]
  search: string
  onSearchChange: (search: string) => void
}

export function HierarchicalView({ ministries, search, onSearchChange }: HierarchicalViewProps): JSX.Element {
  const filteredMinistries = ministries.filter(ministry => 
    ministry.name.toLowerCase().includes(search.toLowerCase()) ||
    ministry.acronym?.toLowerCase().includes(search.toLowerCase()) ||
    ministry.state_departments?.some(dept => 
      dept.name.toLowerCase().includes(search.toLowerCase())
    ) ||
    ministry.state_departments?.some(dept => 
      dept.agencies?.some(agency => 
        agency.name.toLowerCase().includes(search.toLowerCase()) ||
        agency.acronym?.toLowerCase().includes(search.toLowerCase())
      )
    )
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search ministries, departments, or agencies..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredMinistries.length} ministries
        </div>
      </div>

      {filteredMinistries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No ministries found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMinistries.map((ministry) => (
            <MinistryCard key={ministry.id} ministry={ministry} />
          ))}
        </div>
      )}
    </div>
  )
}
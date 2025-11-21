import { MDAEntity, MDAType, Pagination } from '@/types/mda'
import { MDACard } from './MDACard'
import { MDASearch } from './MDASearch'
import { MDAPagination } from './MDAPagination'

interface MDAListProps {
  type: MDAType
  data: MDAEntity[]
  pagination: Pagination
  search: string
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
}

export function MDAList({ 
  type, 
  data, 
  pagination, 
  search, 
  onSearchChange, 
  onPageChange 
}: MDAListProps): JSX.Element {
  return (
    <div className="space-y-6">
      <MDASearch 
        value={search} 
        onChange={onSearchChange}
        type={type}
      />
      
      {data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No {type}s found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((mda) => (
              <MDACard key={mda.id} mda={mda} type={type} />
            ))}
          </div>
          
          <MDAPagination 
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}
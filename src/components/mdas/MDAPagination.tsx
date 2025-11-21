import { Pagination } from '@/types/mda'

interface MDAPaginationProps {
  pagination: Pagination
  onPageChange: (page: number) => void
}

export function MDAPagination({ pagination, onPageChange }: MDAPaginationProps): JSX.Element | null {
  const { page, totalPages } = pagination

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center space-x-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  )
}
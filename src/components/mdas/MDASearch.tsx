import { MDAType } from '@/types/mda'

interface MDASearchProps {
  value: string
  onChange: (value: string) => void
  type: MDAType
}

export function MDASearch({ value, onChange, type }: MDASearchProps): JSX.Element {
  const getPlaceholder = (): string => {
    switch (type) {
      case 'ministry': return 'Search ministries by name or acronym...'
      case 'department': return 'Search state departments by name...'
      case 'agency': return 'Search agencies by name or acronym...'
      default: return 'Search...'
    }
  }

  const getTypeLabel = (): string => {
    switch (type) {
      case 'ministry': return 'Ministries'
      case 'department': return 'State Departments'
      case 'agency': return 'Agencies'
      default: return 'Items'
    }
  }

  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1">
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="text-sm text-gray-500">
        {getTypeLabel()}
      </div>
    </div>
  )
}
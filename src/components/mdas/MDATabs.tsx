import { MDAType } from '@/types/mda'

interface MDATabsProps {
  activeTab: MDAType
  onTabChange: (tab: MDAType) => void
}

export function MDATabs({ activeTab, onTabChange }: MDATabsProps): JSX.Element {
  const tabs: { id: MDAType; name: string; count: string }[] = [
    { id: 'agency', name: 'Agencies', count: '320' },
    { id: 'department', name: 'State Departments', count: '50' },
    { id: 'ministry', name: 'Ministries', count: '23' }
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.name}
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
// src/components/mdas/StatsCard.tsx
interface StatsCardProps {
  title: string
  count: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple'
}

export default function StatsCard({ title, count, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/70 dark:bg-gray-800/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 ${colorClasses[color]} rounded-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
        </div>
      </div>
    </div>
  )
}
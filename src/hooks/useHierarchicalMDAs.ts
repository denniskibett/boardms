import { useState, useEffect } from 'react'
import { HierarchicalData } from '@/types/mda'

interface UseHierarchicalMDAsReturn {
  data: HierarchicalData | null
  loading: boolean
  error: string | null
}

export function useHierarchicalMDAs(): UseHierarchicalMDAsReturn {
  const [data, setData] = useState<HierarchicalData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHierarchicalData = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/mdas/hierarchical')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()

        if (result.error) {
          throw new Error(result.error)
        }

        setData(result.data || { ministries: [], totalAgencies: 0, totalDepartments: 0 })
      } catch (err) {
        console.error('Error fetching hierarchical MDAs:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchHierarchicalData()
  }, [])

  return { data, loading, error }
}
import { useState, useEffect } from 'react'
import { MDAEntity, MDAType, Pagination } from '@/types/mda'

interface UseMDAsParams {
  type?: MDAType
  page?: number
  limit?: number
  search?: string
}

interface UseMDAsReturn {
  data: MDAEntity[]
  loading: boolean
  error: string | null
  pagination: Pagination
}

export function useMDAs({ 
  type = 'agency', 
  page = 1, 
  limit = 10, 
  search = '' 
}: UseMDAsParams = {}): UseMDAsReturn {
  const [data, setData] = useState<MDAEntity[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    const fetchMDAs = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams({
          type,
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search })
        })

        const response = await fetch(`/api/mdas?${params}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error)
        }

        setData(result.data)
        setPagination(result.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMDAs()
  }, [type, page, limit, search])

  return { data, loading, error, pagination }
}

interface UseMDAReturn {
  data: any | null
  loading: boolean
  error: string | null
}

export function useMDA(id: string | undefined): UseMDAReturn {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMDA = async (): Promise<void> => {
      if (!id) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/mdas/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error)
        }

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMDA()
  }, [id])

  return { data, loading, error }
}
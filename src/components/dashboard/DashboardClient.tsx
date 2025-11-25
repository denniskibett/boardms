'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface DashboardClientProps {
  initialUser: any
  initialMemos?: any[]
}

export function DashboardClient({ initialUser, initialMemos = [] }: DashboardClientProps) {
  const [memos, setMemos] = useState(initialMemos)
  const [user, setUser] = useState(initialUser)
  const [isOnline, setIsOnline] = useState(true)

  // Real-time subscription for memos
  useEffect(() => {
    const channel = supabase
      .channel('memos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gov_memos'
        },
        (payload) => {
          console.log('Memo change received!', payload)
          // Refresh memos or update specific memo
          fetchMemos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchMemos = async () => {
    const { data } = await supabase
      .from('gov_memos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setMemos(data)
    }
  }

  return (
    <div>
      {/* Online status indicator */}
      {!isOnline && (
        <div className="p-2 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded">
          You are currently offline. Some features may be limited.
        </div>
      )}
      
      {/* Your dashboard content */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name || user?.email}!
        </h1>
        <p>You have {memos.length} recent memos</p>
      </div>

      {/* Memos will update in real-time */}
      <div className="space-y-4">
        {memos.map(memo => (
          <div key={memo.id} className="p-4 border rounded">
            <h3 className="font-semibold">{memo.name}</h3>
            <p className="text-sm text-gray-600">{memo.summary}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
// src/hooks/useSession.ts
import { useSession as useNextAuthSession } from "next-auth/react"

export function useSession() {
  const { data: session, status, update } = useNextAuthSession()
  
  return {
    user: session?.user,
    role: session?.user?.role,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    updateSession: update,
    session // Full session object if needed
  }
}
// hooks/useUser.ts
import { useSession } from "next-auth/react"

export function useUser() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user || null,
    profile: session?.user || null, // For backward compatibility
    loading: status === 'loading'
  }
}

// If you have existing code using useUsers, create an alias
export const useUsers = useUser
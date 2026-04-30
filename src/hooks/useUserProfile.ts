import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

export function useUserProfile(uid: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', uid],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'users', uid!))
      if (!snap.exists()) return null
      return { uid, ...snap.data() } as UserProfile
    },
    enabled: !!uid,
  })
}

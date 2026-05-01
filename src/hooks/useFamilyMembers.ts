import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

export function useFamilyMembers(memberIds: string[] | undefined) {
  return useQuery({
    queryKey: ['familyMembers', memberIds],
    queryFn: async () => {
      const profiles = await Promise.all(
        memberIds!.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid))
          return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null
        })
      )
      return profiles.filter((p): p is UserProfile => p !== null)
    },
    enabled: !!memberIds?.length,
  })
}

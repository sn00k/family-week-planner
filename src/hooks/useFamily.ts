import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Family } from '@/types'

export function useFamily(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'families', familyId!))
      if (!snap.exists()) return null
      return { id: familyId, ...snap.data() } as Family
    },
    enabled: !!familyId,
  })
}

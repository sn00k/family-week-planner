import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { addDays } from '@/lib/dates'
import type { CalendarEvent } from '@/types'

export function useWeekEvents(familyId: string | undefined, weekStart: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)

    const weekEnd = addDays(weekStart, 7)
    const q = query(
      collection(db, 'events'),
      where('familyId', '==', familyId),
      where('startTime', '>=', weekStart.toISOString()),
      where('startTime', '<', weekEnd.toISOString()),
      orderBy('startTime', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent)))
      setLoading(false)
    })

    return unsubscribe
  }, [familyId, weekStart.getTime()])

  return { events, loading }
}

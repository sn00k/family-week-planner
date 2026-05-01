import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp()

const db = getFirestore()

export const notifyOnNewEvent = onDocumentCreated(
  { document: 'events/{eventId}', region: 'europe-north1', maxInstances: 5 },
  async (event) => {
    const data = event.data?.data()
    if (!data) return

    const { familyId, createdBy, title, type, startTime, allDay } = data as {
      familyId: string
      createdBy: string
      title: string
      type: string
      startTime: string
      allDay: boolean
    }

    const EVENT_ICONS: Record<string, string> = {
      lunch: '🍽️', dinner: '🍽️', pickup: '🚗', dropoff: '🚗',
      trip: '✈️', appointment: '📅', other: '📌',
    }
    const icon = EVENT_ICONS[type] ?? '📌'

    // Deduplicate: atomically mark this event as notified
    const eventRef = db.doc(`events/${event.params.eventId}`)
    const alreadySent = await db.runTransaction(async (tx) => {
      const snap = await tx.get(eventRef)
      if (snap.data()?.notificationSent) return true
      tx.update(eventRef, { notificationSent: true })
      return false
    })
    if (alreadySent) return

    const [familySnap, creatorSnap] = await Promise.all([
      db.doc(`families/${familyId}`).get(),
      db.doc(`users/${createdBy}`).get(),
    ])
    const members: string[] = familySnap.data()?.members ?? []
    const creatorName: string = creatorSnap.data()?.displayName ?? 'Någon'
    const recipients = members.filter((uid) => uid !== createdBy)
    if (recipients.length === 0) return

    const userSnaps = await Promise.all(
      recipients.map((uid) => db.doc(`users/${uid}`).get()),
    )

    const tokensByUid = new Map<string, string>()
    userSnaps.forEach((snap, i) => {
      const token: string | undefined = snap.data()?.fcmToken
      if (token) tokensByUid.set(recipients[i], token)
    })

    if (tokensByUid.size === 0) return

    const uids = [...tokensByUid.keys()]
    const tokens = [...tokensByUid.values()]

    const date = new Date(startTime)
    const tz = 'Europe/Stockholm'
    const dateStr = allDay
      ? date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz })
      : date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }) +
        ' ' + date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: tz })

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: `${icon} ${title}`,
        body: `${creatorName} · ${dateStr}`,
      },
      webpush: {
        notification: { icon: '/pwa-192x192.png', badge: '/pwa-64x64.png' },
        fcmOptions: { link: '/' },
      },
    })

    // Remove stale tokens so we don't keep sending to dead registrations
    await Promise.all(
      response.responses.map((r, i) => {
        if (!r.success) {
          return db.doc(`users/${uids[i]}`).update({ fcmToken: null })
        }
        return null
      }),
    )
  },
)

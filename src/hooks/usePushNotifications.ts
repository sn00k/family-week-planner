import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { requestNotificationToken, notificationPermission } from '@/lib/messaging'

export function usePushNotifications(uid: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPermission(notificationPermission())
  }, [])

  const enable = async () => {
    if (!uid) return
    setLoading(true)
    try {
      const token = await requestNotificationToken()
      const current = notificationPermission()
      setPermission(current)
      if (token) {
        await updateDoc(doc(db, 'users', uid), { fcmToken: token })
      }
    } finally {
      setLoading(false)
    }
  }

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator

  return { permission, enable, loading, isSupported }
}

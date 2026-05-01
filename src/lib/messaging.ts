import { getMessaging, getToken } from 'firebase/messaging'
import { app } from './firebase'

let _messaging: ReturnType<typeof getMessaging> | null = null

function messagingInstance() {
  if (!_messaging) _messaging = getMessaging(app)
  return _messaging
}

export async function requestNotificationToken(): Promise<string | null> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messagingInstance(), { vapidKey, serviceWorkerRegistration: registration })
    return token || null
  } catch (err) {
    console.error('[FCM] getToken failed:', err)
    return null
  }
}

export function notificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

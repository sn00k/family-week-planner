/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging/sw'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const app = initializeApp({
  apiKey: 'AIzaSyDKSStj050KQnDNNHmC0KbLs_twUnE2fWE',
  authDomain: 'family-week-planner-8f648.firebaseapp.com',
  projectId: 'family-week-planner-8f648',
  storageBucket: 'family-week-planner-8f648.firebasestorage.app',
  messagingSenderId: '426905197554',
  appId: '1:426905197554:web:d66a86f82885a3ba77e96b',
})

getMessaging(app)

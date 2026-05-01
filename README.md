# Familjekalendern

A private family calendar PWA built with React, Firebase, and TanStack Router. Supports push notifications, offline use, and installation on iOS and Android.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, TanStack Router
- **Backend**: Firebase (Auth, Firestore, Cloud Functions v2, Hosting, FCM)
- **PWA**: vite-plugin-pwa with unified service worker (Workbox + Firebase Messaging)
- **Build**: Vite, pnpm

## Features

- Week-view calendar with color-coded events per family member
- Event creation and editing (type, date, time, location, notes)
- Family management with invite codes
- Push notifications via Firebase Cloud Messaging (iOS PWA + Android)
- Installable as a PWA on iOS (Safari) and Android (Chrome)

## Getting started

### 1. Install dependencies

```bash
pnpm install
cd functions && pnpm install && cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

You can find these values in the Firebase Console under **Project settings → General → Your apps**.

The VAPID key is under **Project settings → Cloud Messaging → Web Push certificates**.

### 3. Run locally

```bash
pnpm dev
```

## Deployment

```bash
pnpm build
firebase deploy
```

This deploys both hosting and Cloud Functions.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | VAPID key for web push |

## Notes

- The service worker (`src/sw.ts`) contains the Firebase config inline — this is intentional and safe. Service workers don't have access to `import.meta.env`, and Firebase web config values are public identifiers (security is enforced by Firestore rules and Firebase App Check).
- Push notifications on iOS require the app to be installed as a PWA and iOS 16.4+.

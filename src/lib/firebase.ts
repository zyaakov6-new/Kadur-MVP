import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth,      type Auth }       from 'firebase/auth'
import { getFirestore, type Firestore }  from 'firebase/firestore'
import { getAnalytics, logEvent, type Analytics } from 'firebase/analytics'

/** True only when real Firebase credentials are present in env */
export const FIREBASE_READY = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

let app:        FirebaseApp | undefined
let _auth:      Auth        | undefined
let _db:        Firestore   | undefined
let _analytics: Analytics   | undefined

if (FIREBASE_READY) {
  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
  // Prevent double-initialisation in HMR / dev
  app        = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  _auth      = getAuth(app)
  _db        = getFirestore(app)
  // Analytics only works in browser (not SSR)
  if (typeof window !== 'undefined') {
    try { _analytics = getAnalytics(app) } catch { /* ignore */ }
  }
}

export const auth      = _auth      as Auth
export const db        = _db        as Firestore
export const analytics = _analytics as Analytics | undefined

/** Track a custom event — no-ops silently in dev or if analytics not ready */
export function track(event: string, params?: Record<string, string | number | boolean>) {
  if (analytics) logEvent(analytics, event, params)
}

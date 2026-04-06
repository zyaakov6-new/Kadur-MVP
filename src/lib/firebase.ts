import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth,      type Auth }       from 'firebase/auth'
import { getFirestore, type Firestore }  from 'firebase/firestore'

/** True only when real Firebase credentials are present in env */
export const FIREBASE_READY = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

let app:  FirebaseApp | undefined
let _auth: Auth | undefined
let _db:   Firestore | undefined

if (FIREBASE_READY) {
  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  }
  // Prevent double-initialisation in HMR / dev
  app   = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  _auth = getAuth(app)
  _db   = getFirestore(app)
}

export const auth = _auth as Auth
export const db   = _db   as Firestore

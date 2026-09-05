import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

export interface FirebaseConfigSchema {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

export const isValidFirebaseApiKey = (key?: string): boolean => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.includes('YOUR_') && !trimmed.includes('placeholder');
};

let activeConfig: FirebaseConfigSchema = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || ''
};

export let isFirebaseConfigured = isValidFirebaseApiKey(activeConfig.apiKey) && Boolean(activeConfig.projectId && !activeConfig.projectId.includes('YOUR_'));

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

const subscribers: Array<() => void> = [];

export const onFirebaseInitialized = (callback: () => void) => {
  if (isFirebaseConfigured && auth) {
    callback();
  }
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx !== -1) subscribers.splice(idx, 1);
  };
};

const setupFirebaseInstances = (config: FirebaseConfigSchema) => {
  if (!isValidFirebaseApiKey(config.apiKey) || !config.projectId || config.projectId.includes('YOUR_')) {
    return false;
  }

  try {
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    auth = getAuth(app);
    const databaseId = config.firestoreDatabaseId || undefined;
    db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseConfigured = true;
    subscribers.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
    return true;
  } catch (err) {
    console.warn('[Firebase] Initialization error, falling back to secure sandbox:', err);
    return false;
  }
};

// If build-time config is valid, initialize immediately
if (isFirebaseConfigured) {
  setupFirebaseInstances(activeConfig);
}

// Runtime dynamic fetcher: queries /api/firebase-config if build-time key was missing or placeholder
let fetchPromise: Promise<boolean> | null = null;
export const ensureFirebaseInitialized = async (): Promise<boolean> => {
  if (isFirebaseConfigured && auth && db) {
    return true;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/firebase-config');
      if (res.ok) {
        const runtimeConfig = await res.json();
        if (isValidFirebaseApiKey(runtimeConfig.apiKey) && runtimeConfig.projectId) {
          activeConfig = { ...runtimeConfig };
          return setupFirebaseInstances(activeConfig);
        }
      }
    } catch (err) {
      console.warn('[Firebase] Could not load dynamic runtime config:', err);
    } finally {
      fetchPromise = null;
    }
    return isFirebaseConfigured;
  })();

  return fetchPromise;
};

export const getDb = () => db;
export const getAuthInstance = () => auth;
export const getGoogleProvider = () => googleProvider;

export { app, auth, db, googleProvider };

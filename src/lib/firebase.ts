import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase config at init time - catch missing env vars early
const hasApiKey = Boolean(firebaseConfig.apiKey);
const hasAuthDomain = Boolean(firebaseConfig.authDomain);
const hasProjectId = Boolean(firebaseConfig.projectId);
const hasStorageBucket = Boolean(firebaseConfig.storageBucket);
const hasMessagingSenderId = Boolean(firebaseConfig.messagingSenderId);
const hasAppId = Boolean(firebaseConfig.appId);

const allEnvVarsPresent = 
  hasApiKey && 
  hasAuthDomain && 
  hasProjectId && 
  hasStorageBucket && 
  hasMessagingSenderId && 
  hasAppId;

if (!allEnvVarsPresent) {
  const missing = [
    !hasApiKey && 'VITE_FIREBASE_API_KEY',
    !hasAuthDomain && 'VITE_FIREBASE_AUTH_DOMAIN',
    !hasProjectId && 'VITE_FIREBASE_PROJECT_ID',
    !hasStorageBucket && 'VITE_FIREBASE_STORAGE_BUCKET',
    !hasMessagingSenderId && 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    !hasAppId && 'VITE_FIREBASE_APP_ID',
  ].filter(Boolean).join(', ');
  
  throw new Error(
    `Firebase initialization failed. Missing env vars: ${missing}. ` +
    'Ensure .env contains all VITE_FIREBASE_* keys, or add them to Vercel Project Settings > Environment Variables and redeploy.'
  );
}

if (import.meta.env.PROD) {
  console.info('[firebase] init', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
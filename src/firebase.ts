import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// System flag: Firebase data connection has been disconnected according to user request
export const IS_FIREBASE_CONNECTED = false;

// Initialize Firebase App instance for optional client-side token utilities if needed
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: any;
}

// Disconnected handler: Logs a soft warning instead of throwing unhandled crashes
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  console.info(`[Firebase Disconnected] Offline-first mode: Operation ${operationType} on ${path} managed locally.`);
}

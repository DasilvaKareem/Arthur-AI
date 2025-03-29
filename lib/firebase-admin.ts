import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT is not defined');
}

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('Error initializing Firebase Admin:', error.message);
    throw error;
  }
}

export const adminDb = getFirestore();

export async function getAdminDb() {
  return adminDb;
} 
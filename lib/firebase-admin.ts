import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
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
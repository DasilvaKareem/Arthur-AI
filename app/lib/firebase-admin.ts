/**
 * Server-side Firebase Admin SDK Configuration
 * 
 * This file is meant to be used only in server contexts (API routes, server components)
 * and should not be imported from client-side code.
 */

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore, DocumentReference, CollectionReference, Query, Transaction } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK for server-side operations
let adminApp: ReturnType<typeof initializeApp> | undefined;
let adminDb: Firestore | undefined;

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Mock Firestore implementation for development
function createMockFirestore(): Firestore {
  const mockDb = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: false,
          data: () => null,
        }),
        set: async (data: any) => {
          console.log("📝 Mock Firestore set:", { name, id, data });
          return { id };
        },
        update: async (data: any) => {
          console.log("📝 Mock Firestore update:", { name, id, data });
          return { id };
        },
        collection: (subcollection: string) => ({
          add: async (data: any) => {
            const newId = Math.random().toString(36).substring(7);
            console.log("📝 Mock Firestore add:", { name, id, subcollection, data });
            return { id: newId };
          },
        }),
      }),
    }),
    runTransaction: async (fn: (transaction: Transaction) => Promise<void>) => {
      console.log("📝 Mock Firestore transaction");
      await fn({} as Transaction);
    },
    settings: () => {},
    databaseId: "mock-db",
    doc: () => ({} as DocumentReference),
    collectionGroup: () => ({} as Query),
    getAll: async () => [],
    listCollections: () => [],
    terminate: async () => {},
    batch: () => ({} as any),
    recursiveDelete: async () => {},
  } as unknown as Firestore;

  return mockDb;
}

// Initialize Firebase Admin SDK
export async function getAdminDb() {
  if (adminDb) {
    return adminDb;
  }

  try {
    // Check if we're in development mode
    if (isDevelopment) {
      // In development, use the service account key file
      const serviceAccount = {
        type: process.env.FIREBASE_ADMIN_TYPE,
        project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
        private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
        auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
        token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN,
      } as ServiceAccount;

      if (!getApps().length) {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        adminApp = getApps()[0];
      }
    } else {
      // In production, use the default credentials
      if (!getApps().length) {
        adminApp = initializeApp();
      } else {
        adminApp = getApps()[0];
      }
    }

    adminDb = getFirestore(adminApp);
    return adminDb;
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
    if (isDevelopment) {
      console.warn("⚠️ Using mock Firestore for development");
      adminDb = createMockFirestore();
      return adminDb;
    }
    return undefined;
  }
} 
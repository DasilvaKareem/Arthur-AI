/**
 * Server-side Firebase Admin SDK Configuration
 * 
 * This file is meant to be used only in server contexts (API routes, server components)
 * and should not be imported from client-side code.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK for server-side operations
let adminApp;
let adminDb;

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize the Firebase Admin app if it hasn't been initialized yet
function getAdminApp() {
  if (!adminApp) {
    try {
      // Check if any Firebase Admin apps have been initialized
      if (getApps().length === 0) {
        // Use environment variables for service account credentials
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines with actual newlines in the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        // Check if required Firebase credentials are provided
        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
          if (isDevelopment) {
            console.warn("⚠️ Firebase credentials incomplete - using mock implementation in development");
            return null;
          } else {
            throw new Error("Missing required Firebase credentials");
          }
        }

        console.log("🔥 Initializing Firebase Admin SDK...");
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
        console.log("🔥 Firebase initialized: true");
      } else {
        adminApp = getApps()[0];
      }
    } catch (error) {
      console.error("❌ Firebase Admin initialization error:", error);
      if (isDevelopment) {
        console.warn("⚠️ Using mock implementation in development mode");
        return null;
      } else {
        throw error; // In production, we should fail if Firebase can't initialize
      }
    }
  }
  return adminApp;
}

// Get the Firestore database instance
export function getAdminDb() {
  if (!adminDb) {
    try {
      const app = getAdminApp();
      if (app) {
        adminDb = getFirestore(app);
      } else {
        // Always use mock in development if app initialization failed
        console.warn("⚠️ Using mock Firestore for development");
        adminDb = createMockFirestore();
      }
    } catch (error) {
      console.error("❌ Firestore initialization error:", error);
      if (isDevelopment) {
        // Fallback to mock implementation only in development
        console.warn("⚠️ Falling back to mock Firestore");
        adminDb = createMockFirestore();
      } else {
        throw error; // In production, we should fail if Firestore can't initialize
      }
    }
  }
  return adminDb;
}

// Create a mock Firestore implementation for development
function createMockFirestore() {
  return {
    collection: (name) => ({
      doc: (id) => ({
        collection: (subcollection) => ({
          where: () => ({
            limit: () => ({
              get: async () => ({
                forEach: (fn) => {
                  // Return sample data for development
                  fn({
                    id: 'sample-chunk',
                    data: () => ({
                      content: 'Sample content for screenwriting',
                      fileName: 'sample.txt',
                      relevance: 0.95,
                      keywords: ['sample', 'content', 'screenwriting']
                    })
                  });
                }
              })
            })
          })
        })
      })
    })
  };
} 
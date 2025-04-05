"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Debug logging for environment variables
const debugEnvVars = () => {
  if (isBrowser) {
    console.log('Firebase Environment Variables:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
};

// Call debug function
debugEnvVars();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: any = null;
let storage: any = null;

// Only initialize Firebase in browser environment
if (isBrowser) {
  try {
    console.log("🔥 Initializing Firebase...");
    // Check if Firebase is already initialized
    if (!getApps().length) {
      // Initialize Firebase app
      firebaseApp = initializeApp(firebaseConfig);
      console.log("✅ Firebase app initialized successfully");
    } else {
      firebaseApp = getApps()[0];
      console.log("ℹ️ Using existing Firebase app");
    }

    // Initialize Firebase services only if we have a valid app
    if (firebaseApp) {
      try {
        auth = getAuth(firebaseApp);
        // Set persistence to LOCAL (this persists even when the window is closed)
        if (auth) {
          setPersistence(auth, browserLocalPersistence)
            .then(() => {
              console.log("✅ Firebase auth persistence set to LOCAL");
            })
            .catch((error) => {
              console.error("❌ Error setting auth persistence:", error);
            });
        }
        
        db = getFirestore(firebaseApp);
        storage = getStorage(firebaseApp);
        console.log("✅ Firebase services initialized successfully", {
          hasAuth: !!auth,
          hasDb: !!db,
          hasStorage: !!storage
        });
      } catch (serviceError) {
        console.error("❌ Error initializing Firebase services:", serviceError);
      }
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase app:", error);
  }
}

// Export services with both new and legacy names for compatibility
export { auth as firebaseAuth, auth, db, storage };
export default firebaseApp; 
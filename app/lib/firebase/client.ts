"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator, browserSessionPersistence, setPersistence } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  
  // Set persistence - options: LOCAL, SESSION, NONE
  setPersistence(firebaseAuth, browserSessionPersistence);
  
  // Connect to Auth Emulator in development
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
    console.log('🔥 Using Firebase Auth Emulator');
  }
} else {
  firebaseApp = getApps()[0];
  firebaseAuth = getAuth(firebaseApp);
}

export { firebaseApp, firebaseAuth }; 
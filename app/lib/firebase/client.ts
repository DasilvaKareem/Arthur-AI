"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, Storage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing Firebase config: ${key}`);
  }
});

// Initialize Firebase client
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseDb: Firestore;
let firebaseStorage: Storage;

try {
  if (!getApps().length) {
    console.log('Initializing Firebase app...');
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
    
    // Set persistence - options: LOCAL, SESSION, NONE
    setPersistence(firebaseAuth, browserLocalPersistence)
      .then(() => console.log('Firebase persistence set to local'))
      .catch(error => console.error('Error setting persistence:', error));
    
    // Connect to Auth Emulator in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
      console.log('🔥 Using Firebase Auth Emulator');
    }
    console.log('Firebase app initialized successfully');
  } else {
    console.log('Using existing Firebase app');
    firebaseApp = getApps()[0];
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { firebaseApp, firebaseAuth, firebaseDb, firebaseStorage }; 
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      console.warn('Firebase Auth is not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshAuth = async () => {
    if (!firebaseAuth?.currentUser) {
      console.warn('No current user to refresh');
      return;
    }
    
    try {
      await firebaseAuth.currentUser.getIdToken(true);
      return true;
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      return false;
    }
  };

  return { user, loading, refreshAuth };
} 
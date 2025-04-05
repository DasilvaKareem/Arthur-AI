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

  return { user, loading };
} 
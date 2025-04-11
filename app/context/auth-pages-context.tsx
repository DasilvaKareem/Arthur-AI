"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  sendPasswordResetEmail,
  updateProfile,
  Auth,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "../lib/firebase/client";
import { toast } from "sonner";

// Define context type
interface AuthPagesContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create context with default values
const AuthPagesContext = createContext<AuthPagesContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
});

// Auth provider component specifically for auth pages
export const AuthPagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    if (!firebaseAuth) {
      console.error("Firebase Auth not initialized");
      setLoading(false);
      return;
    }

    const auth = firebaseAuth as Auth;
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Initial check (handles page refresh)
    const checkInitialAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to prevent flicker
      setLoading(false);
    };
    checkInitialAuth();

    return () => unsubscribe();
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }

    try {
      setLoading(true);
      
      // Add basic input validation
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Check for rate limiting in localStorage
      const attempts = JSON.parse(localStorage.getItem('signInAttempts') || '{"count": 0, "timestamp": 0}');
      const now = Date.now();
      const timeWindow = 15 * 60 * 1000; // 15 minutes

      if (now - attempts.timestamp < timeWindow && attempts.count >= 5) {
        const minutesLeft = Math.ceil((timeWindow - (now - attempts.timestamp)) / 60000);
        throw new Error(`Too many login attempts. Please try again in ${minutesLeft} minutes.`);
      }

      try {
        const auth = firebaseAuth as Auth;
        await signInWithEmailAndPassword(auth, email, password);
        // Reset attempts on successful login
        localStorage.setItem('signInAttempts', JSON.stringify({ count: 0, timestamp: now }));
        toast.success('Signed in successfully');
        router.push('/create-story');
      } catch (error: any) {
        // Update attempts count on failure
        localStorage.setItem('signInAttempts', JSON.stringify({
          count: attempts.count + 1,
          timestamp: attempts.timestamp || now
        }));
        throw error;
      }
    } catch (error: any) {
      console.error("Sign In Error:", error);
      const errorMessage = getAuthErrorMessage(error.code || error.message);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name?: string) => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }

    try {
      setLoading(true);
      const auth = firebaseAuth as Auth;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name if provided
      if (name) {
        await updateProfile(user, { displayName: name });
      }
      
      toast.success('Account created successfully');
      router.push('/create-story');
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }

    try {
      const auth = firebaseAuth as Auth;
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Get user-friendly error messages
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your internet connection.';
      case 'Please enter both email and password':
        return errorCode;
      default:
        if (errorCode.includes('try again in')) {
          return errorCode;
        }
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    resetPassword,
  };

  return <AuthPagesContext.Provider value={value}>{children}</AuthPagesContext.Provider>;
};

// Custom hook to use auth pages context
export const useAuthPages = () => {
  const context = useContext(AuthPagesContext);
  if (context === undefined) {
    throw new Error('useAuthPages must be used within an AuthPagesProvider');
  }
  return context;
}; 
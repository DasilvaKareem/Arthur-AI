"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  Auth,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { firebaseAuth } from "../lib/firebase/client";
import { toast } from "sonner";

// Define context type
export interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteUserAccount: (password: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  updateUserPassword: async () => {},
  deleteUserAccount: async () => {},
  refreshAuth: async () => {},
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const tokenRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const authRecoveryAttempts = useRef(0);
  const lastActiveAt = useRef(Date.now());

  // Function to refresh auth
  const refreshAuth = async (): Promise<void> => {
    console.log("🔄 Manual auth refresh requested");
    if (!firebaseAuth) {
      console.error("❌ Firebase Auth not initialized");
      return;
    }

    try {
      const currentUser = firebaseAuth.currentUser;
      
      if (currentUser) {
        console.log("🔐 Refreshing token for:", currentUser.email);
        await currentUser.getIdToken(true);
        console.log("✅ Token refreshed successfully");
        
        // Reset recovery attempts after successful refresh
        authRecoveryAttempts.current = 0;
        
        // Update the user state to trigger UI refresh
        setUser({ ...currentUser });
      } else {
        console.log("⚠️ No user found during manual refresh");
        
        // Check local storage for any saved auth data
        const savedUserEmail = localStorage.getItem('userEmail');
        if (savedUserEmail) {
          console.log("🔍 Found saved user email:", savedUserEmail);
          
          // Only show toast if we're not already on an auth page
          if (!pathname?.includes('/auth/')) {
            toast.info("Session expired. Please sign in again.");
            localStorage.removeItem('userEmail');
            router.push('/auth/signin');
          }
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing auth:", error);
      authRecoveryAttempts.current += 1;
      
      // Only redirect after 5 failed attempts (up from 3)
      if (authRecoveryAttempts.current > 5) {
        console.log("⚠️ Multiple auth recovery failures, redirecting to signin");
        toast.error("Authentication error. Please sign in again.");
        
        if (!pathname?.includes('/auth/')) {
          router.push('/auth/signin');
        }
      }
    }
  };

  // Set up persistence
  useEffect(() => {
    const setupPersistence = async () => {
      if (firebaseAuth) {
        try {
          await setPersistence(firebaseAuth, browserLocalPersistence);
          console.log("✅ Auth persistence set to LOCAL");
        } catch (error) {
          console.error("❌ Error setting auth persistence:", error);
        }
      } else {
        console.warn("⚠️ Firebase Auth not available for persistence setup");
      }
    };
    
    setupPersistence();
  }, []);

  // Set up user activity tracking
  useEffect(() => {
    const updateActivity = () => {
      lastActiveAt.current = Date.now();
    };
    
    // Track user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    // Check if user is active and refresh token if needed
    const activityInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActiveAt.current;
      
      // Only refresh if user becomes active after being inactive for more than 30 minutes (up from 10)
      if (inactiveTime < 5000 && inactiveTime > 30 * 60 * 1000) {
        console.log("👋 User returned after inactivity, refreshing auth");
        refreshAuth();
      }
    }, 60 * 1000); // Check once per minute
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(activityInterval);
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    console.log("🔐 Setting up auth listeners...");

    // Set persistence on initialization
    const initializeAuth = async () => {
      if (!firebaseAuth) return;
      try {
        await setPersistence(firebaseAuth, browserLocalPersistence);
        console.log("✅ Auth persistence set to LOCAL");
      } catch (error) {
        console.error("❌ Error setting auth persistence:", error);
      }
    };
    initializeAuth();

    // Set up token refresh interval
    const setupTokenRefresh = () => {
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
      
      // Refresh token every 55 minutes (up from 50, tokens expire after 1 hour)
      tokenRefreshInterval.current = setInterval(async () => {
        const currentUser = firebaseAuth?.currentUser;
        if (currentUser) {
          try {
            await currentUser.getIdToken(true);
            console.log("✅ Token refreshed via interval");
          } catch (error) {
            console.error("❌ Error refreshing token via interval:", error);
            // Don't redirect on interval refresh failures
          }
        }
      }, 55 * 60 * 1000);
    };

    // Set up auth state listener
    const unsubscribeAuthState = onAuthStateChanged(firebaseAuth as Auth, async (user) => {
      console.log("👤 Auth state changed:", user?.email);
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Save email for recovery
        localStorage.setItem('userEmail', user.email || '');
        // Set up token refresh after successful auth
        setupTokenRefresh();
      } else {
        // Clear saved data if no user
        localStorage.removeItem('userEmail');
        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current);
        }
      }
    });

    // Set up token change listener
    const unsubscribeToken = onIdTokenChanged(firebaseAuth as Auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          console.log("✅ Token updated");
        } catch (error) {
          console.error("❌ Error getting token:", error);
        }
      }
    });

    // Initial check (handles page refresh)
    const checkInitialAuth = async () => {
      if (!firebaseAuth) return;
      const currentUser = firebaseAuth.currentUser;
      console.log("🔍 Initial auth check:", currentUser?.email);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true);
          console.log("✅ Initial token refreshed");
          
          // Save email for recovery
          localStorage.setItem('userEmail', currentUser.email || '');
          // Set up token refresh
          setupTokenRefresh();
        } catch (error) {
          console.error("❌ Error refreshing initial token:", error);
          refreshAuth(); // Try to recover
        }
      }
    };
    checkInitialAuth();

    // Handle online/offline status
    const handleOnline = () => {
      console.log("🌐 Browser went online, refreshing auth...");
      refreshAuth();
    };
    
    const handleOffline = () => {
      console.log("📴 Browser went offline");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeAuthState();
      unsubscribeToken();
      
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
      
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth redirection logic
  useEffect(() => {
    if (loading) return;

    // Prevent authenticated users from accessing auth pages
    if (user && (pathname?.includes('/auth/signin') || pathname?.includes('/auth/signup'))) {
      console.log("🚀 Redirecting authenticated user from auth page to create-story");
      router.push('/create-story');
    }
  }, [user, loading, pathname, router]);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

    try {
      setLoading(true);
      console.log("🔑 Attempting sign in:", email);
      
      // Ensure LOCAL persistence is set
      if (firebaseAuth) {
        await setPersistence(firebaseAuth, browserLocalPersistence);
      }
      
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log("✅ Sign in successful:", result.user.email);
      
      // Save email for recovery
      localStorage.setItem('userEmail', result.user.email || '');
      
      // Get fresh token
      await result.user.getIdToken(true);
      
      toast.success('Signed in successfully');
      router.push('/create-story');
    } catch (error: any) {
      console.error("❌ Sign In Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name?: string) => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

    try {
      setLoading(true);
      console.log("📝 Attempting sign up:", email);
      const { user } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Set display name if provided
      if (name) {
        await updateProfile(user, { displayName: name });
      }
      
      console.log("✅ Sign up successful:", user.email);
      toast.success('Account created successfully');
      router.push('/create-story');
    } catch (error: any) {
      console.error("❌ Sign Up Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

    try {
      console.log("🚪 Attempting sign out");
      await firebaseSignOut(firebaseAuth);
      console.log("✅ Sign out successful");
      toast.success('Signed out successfully');
      router.push('/auth/signin');
    } catch (error) {
      console.error("❌ Sign Out Error:", error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    if (!firebaseAuth) throw new Error("Firebase Auth not initialized");

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName?: string | null, photoURL?: string | null) => {
    if (!user) throw new Error('No user signed in');
    
    try {
      await updateProfile(user, { 
        displayName: displayName ?? user.displayName, 
        photoURL: photoURL ?? user.photoURL 
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error("Update Profile Error:", error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    }
  };

  // Update user password
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('No user signed in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error("Update Password Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Delete user account
  const deleteUserAccount = async (password: string) => {
    if (!user || !user.email) throw new Error('No user signed in');
    
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      toast.success('Account deleted successfully');
      router.push('/auth/signin');
    } catch (error: any) {
      console.error("Delete Account Error:", error);
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
        return 'Incorrect password. Please try again.';
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
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const value = {
    user,
    currentUser: user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    deleteUserAccount,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 
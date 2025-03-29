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
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser
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
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        
        // Refresh token every 55 minutes to prevent expiration
        // Firebase tokens expire in 60 minutes by default
        const tokenRefreshInterval = setInterval(async () => {
          const token = await user.getIdToken(true);
          console.log("Token refreshed:", new Date().toISOString());
        }, 55 * 60 * 1000);
        
        return () => clearInterval(tokenRefreshInterval);
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

  // Auth redirection logic
  useEffect(() => {
    if (loading) return;

    // Prevent authenticated users from accessing auth pages
    if (user && (pathname?.includes('/auth/signin') || pathname?.includes('/auth/signup'))) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      toast.success('Signed in successfully');
      router.push('/');
    } catch (error: any) {
      console.error("Sign In Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Set display name if provided
      if (name) {
        await updateProfile(user, { displayName: name });
      }
      
      toast.success('Account created successfully');
      router.push('/');
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      toast.success('Signed out successfully');
      router.push('/auth/signin');
    } catch (error) {
      console.error("Sign Out Error:", error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
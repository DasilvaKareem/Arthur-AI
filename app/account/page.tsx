"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import TopNavBar from '../../components/TopNavBar';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // If user is not logged in, redirect to sign in
    if (!user && !loading) {
      router.push('/auth/signin');
      return;
    }
    
    // If user is logged in, automatically redirect to stripe portal
    if (user?.uid) {
      const createPortalSession = async () => {
        try {
          setLoading(true);
          
          const response = await fetch('/api/stripe/create-portal-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.uid }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create portal session');
          }
          
          const { url } = await response.json();
          if (url) {
            window.location.href = url;
          } else {
            // Redirect to workspace if no URL is returned
            router.push('/workspace');
          }
        } catch (error) {
          console.error('Failed to create portal session:', error);
          toast.error('Could not access subscription management. Please try again later.');
          // Redirect to workspace on error
          router.push('/workspace');
        } finally {
          setLoading(false);
        }
      };
      
      createPortalSession();
    }
  }, [user, router, loading]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to subscription management...</p>
        </div>
      </div>
    </div>
  );
} 
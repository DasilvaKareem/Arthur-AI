'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useNftAccess from '../app/hooks/useNftAccess';
import WalletConnect from './WalletConnect';
import { useAuth } from '../app/context/auth-context';

interface NftGateWrapperProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function NftGateWrapper({ 
  children, 
  redirectTo = '/mint' 
}: NftGateWrapperProps) {
  const { hasAccess, isLoading, walletAddress } = useNftAccess();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Only redirect if both auth and NFT checks are complete
    if (!authLoading && !isLoading) {
      // Must be logged in with Firebase AND have NFT access
      if (!user) {
        router.push('/auth/signin');
      } else if (!walletAddress) {
        // User is authenticated but wallet not connected
        // Don't redirect, show wallet connect UI
      } else if (!hasAccess) {
        // Wallet connected but no NFT
        router.push(redirectTo);
      }
    }
  }, [hasAccess, isLoading, walletAddress, user, authLoading, router, redirectTo]);
  
  // Show loading state while checking
  if (authLoading || isLoading) {
    return <div className="p-8 text-center">Checking access...</div>;
  }
  
  // If user is logged in but wallet not connected
  if (user && !walletAddress) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="mb-4">You need to connect your wallet to access this content</p>
        <WalletConnect />
      </div>
    );
  }
  
  // If all checks pass, show the protected content
  if (user && hasAccess) {
    return <>{children}</>;
  }
  
  // This should rarely happen due to redirects
  return <div className="p-8 text-center">You don't have access to this page</div>;
} 
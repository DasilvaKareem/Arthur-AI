'use client';

import NftGateWrapper from '../../components/NftGateWrapper';
import { useAuth } from '../context/auth-context';
import useNftAccess from '../hooks/useNftAccess';

export default function PremiumPage() {
  const { user } = useAuth();
  const { nftMetadata } = useNftAccess();
  
  return (
    <NftGateWrapper>
      <div className="max-w-4xl mx-auto p-8 my-12">
        <h1 className="text-3xl font-bold mb-6">Premium Content</h1>
        
        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mb-8">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <span>🔓</span>
            </div>
            <h2 className="text-xl font-semibold ml-4">NFT Access Verified</h2>
          </div>
          
          <p className="mb-4">
            Welcome, {user?.displayName || user?.email}! You have successfully accessed the premium area with your NFT membership.
          </p>
          
          {nftMetadata && (
            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded">
              <h3 className="font-semibold mb-2">Your Membership Details</h3>
              <p>Name: {nftMetadata.name || 'Arthur AI Membership'}</p>
              {nftMetadata.attributes?.map((attr: any, index: number) => (
                <p key={index}>
                  {attr.trait_type}: {attr.value}
                </p>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Premium Feature 1</h3>
            <p>Advanced feature only available to NFT holders.</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Premium Feature 2</h3>
            <p>Another exclusive feature for yearly members.</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Premium Feature 3</h3>
            <p>Special tools only for verified wallet holders.</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Premium Feature 4</h3>
            <p>Exclusive content reserved for our NFT community.</p>
          </div>
        </div>
      </div>
    </NftGateWrapper>
  );
} 
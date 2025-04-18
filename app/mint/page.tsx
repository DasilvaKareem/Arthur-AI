'use client';

import { useState } from 'react';
import { useAddress, useContract, Web3Button, useClaimConditions } from '@thirdweb-dev/react';
import { useRouter } from 'next/navigation';
import { NFT_DROP_ADDRESS, NFT_TOKEN_ID, NFT_CONTRACT_TYPE } from '../../lib/nft-access';
import WalletConnect from '../../components/WalletConnect';
import { useAuth } from '../context/auth-context';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MintPage() {
  const { user, loading: authLoading } = useAuth();
  const address = useAddress();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  
  const { contract } = useContract(NFT_DROP_ADDRESS, NFT_CONTRACT_TYPE);
  const { data: claimConditions, isLoading: conditionsLoading } = useClaimConditions(contract);

  // Handle successful claim
  const handleClaimSuccess = () => {
    toast.success("NFT claimed successfully!");
    // Give a moment for state to update
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };
  
  if (authLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-8 my-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
        <p className="mb-6">Please sign in to mint your Arthur AI yearly membership.</p>
        <Link href="/auth/signin" className="bg-blue-600 text-white px-6 py-3 rounded">
          Sign In
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-8 my-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Arthur AI Yearly Membership</h1>
      
      {!address ? (
        <div className="text-center mb-8">
          <p className="mb-6">Connect your wallet to mint your yearly membership NFT</p>
          <WalletConnect />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Yearly Access Pass</h2>
            <ul className="space-y-2 mb-6">
              <li>✅ Full access to all premium features</li>
              <li>✅ Valid for one year from purchase</li>
              <li>✅ Transferable to another wallet</li>
              <li>✅ Early access to new features</li>
            </ul>
            
            {conditionsLoading ? (
              <p>Loading pricing...</p>
            ) : (
              <>
                {claimConditions && claimConditions[0] && (
                  <div className="mb-6">
                    <p className="text-xl font-bold">
                      Price: {claimConditions[0].currencyMetadata.displayValue}{' '}
                      {claimConditions[0].currencyMetadata.symbol}
                    </p>
                    {claimConditions[0].maxClaimablePerWallet && (
                      <p className="text-sm">
                        Limit: {claimConditions[0].maxClaimablePerWallet} per wallet
                      </p>
                    )}
                  </div>
                )}
                
                <Web3Button
                  contractAddress={NFT_DROP_ADDRESS}
                  action={async (contract) => {
                    setIsClaiming(true);
                    try {
                      await contract.erc1155.claim(NFT_TOKEN_ID, 1);
                      handleClaimSuccess();
                    } catch (err) {
                      console.error("Failed to claim:", err);
                      toast.error("Failed to claim. Please try again.");
                    } finally {
                      setIsClaiming(false);
                    }
                  }}
                  isDisabled={isClaiming}
                  className="w-full bg-black text-white p-4 rounded"
                >
                  {isClaiming ? "Minting..." : "Mint Yearly Membership"}
                </Web3Button>
              </>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              Note: Membership NFT is tied to your wallet address. 
              Make sure you keep access to this wallet for the duration of your membership.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
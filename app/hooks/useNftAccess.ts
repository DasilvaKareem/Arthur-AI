'use client';

import { useAddress, useContract, useNFTBalance, useNFT } from '@thirdweb-dev/react';
import { useEffect, useState } from 'react';
import { NFT_DROP_ADDRESS, NFT_TOKEN_ID, NFT_CONTRACT_TYPE, checkExpiration } from '../../lib/nft-access';
import { BigNumber } from 'ethers';

export type NFTAccessStatus = {
  hasAccess: boolean;
  isLoading: boolean;
  error: Error | null;
  balance: number;
  nftMetadata: any;
  isExpired: boolean;
  walletAddress: string | undefined;
};

export default function useNftAccess(): NFTAccessStatus {
  const address = useAddress();
  const { contract } = useContract(NFT_DROP_ADDRESS, NFT_CONTRACT_TYPE);
  const { data: balance, isLoading: balanceLoading, error } = useNFTBalance(
    contract,
    address,
    NFT_TOKEN_ID
  );
  
  const { data: nftData, isLoading: metadataLoading } = useNFT(contract, NFT_TOKEN_ID);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  // Check NFT expiration based on metadata
  useEffect(() => {
    if (nftData && !metadataLoading && balance && balance.value && BigNumber.isBigNumber(balance.value) && balance.value.gt(0)) {
      setIsExpired(!checkExpiration(nftData.metadata));
    }
  }, [nftData, metadataLoading, balance]);
  
  const isLoading = balanceLoading || metadataLoading;
  const hasAccess = !isLoading && 
    !!address && 
    !!balance && 
    !!balance.value &&
    BigNumber.isBigNumber(balance.value) &&
    balance.value.gt(0) && 
    !isExpired;
  
  return {
    hasAccess,
    isLoading,
    error: error as Error | null,
    balance: balance && balance.value && BigNumber.isBigNumber(balance.value) ? parseInt(balance.value.toString()) : 0,
    nftMetadata: nftData?.metadata || null,
    isExpired,
    walletAddress: address,
  };
} 
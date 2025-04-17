// NFT Contract Configuration
// Replace with your actual deployed contract address when ready
export const NFT_DROP_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_ADDRESS || '0xYourContractAddressHere';
export const NFT_TOKEN_ID = process.env.NEXT_PUBLIC_NFT_TOKEN_ID || '0';

// Access tiers
export const AccessTier = {
  FREE: 'free',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime'
};

// NFT contract types
export const NFT_CONTRACT_TYPE = 'edition-drop'; // ERC-1155 Edition Drop

// Configure expiration metadata check - based on NFT attributes
export const checkExpiration = (metadata: any): boolean => {
  // For yearly memberships, check expiration date from metadata
  try {
    const expiryAttribute = metadata?.attributes?.find(
      (attr: any) => attr.trait_type === 'Expires'
    );
    
    if (!expiryAttribute?.value) return true; // If no expiry set, assume valid
    
    const expiryDate = new Date(expiryAttribute.value);
    const now = new Date();
    
    return now < expiryDate; // Valid if current date is before expiry
  } catch (e) {
    console.error("Error checking NFT expiration:", e);
    return false; // Fail closed on error
  }
}; 
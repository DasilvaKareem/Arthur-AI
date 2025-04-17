# NFT-Gated Access for Arthur AI

This integration adds NFT-based access control to Arthur AI, allowing you to gate premium features behind NFT ownership using [thirdweb](https://thirdweb.com).

## Features

- **Firebase + Web3 Authentication**: Combines existing Firebase auth with wallet connections
- **Yearly NFT Membership**: Time-based access via NFT metadata
- **Seamless User Experience**: Easy wallet connection and NFT minting
- **Flexible Configuration**: Easily customize contract addresses and chain settings

## Setup Instructions

### 1. Environment Variables

Copy the example env file and set your values:

```bash
cp .env.local.example .env.local
```

Then update the values:

```
NEXT_PUBLIC_NFT_DROP_ADDRESS=0xYourContractAddressHere
NEXT_PUBLIC_NFT_TOKEN_ID=0
NEXT_PUBLIC_ACTIVE_CHAIN=polygon
```

### 2. Deploy your NFT Contract

1. Go to [thirdweb.com](https://thirdweb.com)
2. Connect your admin wallet
3. Create an Edition Drop contract (ERC-1155):
   - Name: "Arthur AI Membership"
   - Choose Polygon network (or your preferred EVM chain)
   - Create 1 NFT with metadata that includes an "Expires" attribute
   
Example NFT Metadata:

```json
{
  "name": "Arthur AI Pro - 2025",
  "description": "Yearly access to Arthur AI Pro features",
  "image": "ipfs://your-image-hash", 
  "attributes": [
    {
      "trait_type": "Expires",
      "value": "2025-12-31"
    },
    {
      "trait_type": "Access Tier",
      "value": "Pro"
    }
  ]
}
```

### 3. Set Claim Conditions

1. In your thirdweb dashboard, select your contract
2. Set up claim conditions:
   - Price (e.g., 0.01 MATIC or 20 USDC)
   - Max per wallet: 1
   - Supply limit: As needed

### 4. Enable Credit Card Checkout (Optional)

To allow users to purchase with credit card:
1. Go to contract settings
2. Connect to thirdweb Stripe integration
3. Complete verification process
4. Enable "Credit Card Payments"

## Usage in Your App

### Protecting Routes

Wrap any component that requires NFT access with the `NftGateWrapper`:

```tsx
// In your premium page
import NftGateWrapper from '@/components/NftGateWrapper';

export default function PremiumPage() {
  return (
    <NftGateWrapper>
      <YourProtectedContent />
    </NftGateWrapper>
  );
}
```

### Checking Access Programmatically

```tsx
import useNftAccess from '@/app/hooks/useNftAccess';

function YourComponent() {
  const { hasAccess, isLoading, nftMetadata } = useNftAccess();
  
  if (isLoading) return <LoadingState />;
  
  if (!hasAccess) {
    return <AccessDeniedState />;
  }
  
  return <YourContent nftData={nftMetadata} />;
}
```

## Renewal Process

When a user's NFT expires (based on the "Expires" attribute), they'll be redirected to the `/mint` page to purchase a new yearly pass.

## Support

For issues or questions about this integration, contact the Arthur AI team.

---

This integration was built using [thirdweb React SDK](https://portal.thirdweb.com/react) v5.x for Next.js App Router. 
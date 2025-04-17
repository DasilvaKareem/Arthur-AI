'use client';

import { ConnectWallet } from '@thirdweb-dev/react';

export default function WalletConnect() {
  return (
    <div className="p-4">
      <ConnectWallet 
        theme="dark"
        btnTitle="Connect Wallet"
        modalTitle="Connect to Arthur AI"
      />
    </div>
  );
} 
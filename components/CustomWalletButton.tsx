'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FC, useCallback } from 'react';
import { RainbowButton } from './ui/rainbow-button';

export const CustomWalletButton: FC = () => {
    const { wallet, connect, connecting, connected, publicKey } = useWallet();
    const { visible, setVisible } = useWalletModal();

    const handleClick = useCallback(() => {
        setVisible(true);
    }, [setVisible]);

    const walletAddress = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : '';

    return (
        <RainbowButton onClick={handleClick} disabled={connecting}>
            {connecting ? 'Connecting...' : connected ? `Connected: ${walletAddress}` : 'Connect Wallet'}
        </RainbowButton>
    );
}; 
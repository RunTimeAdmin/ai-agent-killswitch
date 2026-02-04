/**
 * $KILLSWITCH Wallet Hook - Phantom/Solana wallet integration
 */
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  connecting: boolean;
}

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    balance: 0,
    connecting: false,
  });

  const updateBalance = useCallback(async (pubKey: string) => {
    try {
      const connection = new Connection(SOLANA_RPC);
      const balance = await connection.getBalance(new PublicKey(pubKey));
      setWallet(prev => ({ ...prev, balance: balance / LAMPORTS_PER_SOL }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setWallet(prev => ({ ...prev, connecting: true }));

    try {
      const response = await window.solana.connect();
      const pubKey = response.publicKey.toString();
      setWallet({
        connected: true,
        publicKey: pubKey,
        balance: 0,
        connecting: false,
      });
      await updateBalance(pubKey);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWallet(prev => ({ ...prev, connecting: false }));
    }
  }, [updateBalance]);

  const disconnect = useCallback(async () => {
    if (window.solana) {
      await window.solana.disconnect();
    }
    setWallet({
      connected: false,
      publicKey: null,
      balance: 0,
      connecting: false,
    });
  }, []);

  useEffect(() => {
    // Check if already connected
    if (window.solana?.publicKey) {
      const pubKey = window.solana.publicKey.toString();
      setWallet({
        connected: true,
        publicKey: pubKey,
        balance: 0,
        connecting: false,
      });
      updateBalance(pubKey);
    }

    // Listen for wallet events
    if (window.solana) {
      window.solana.on('connect', (publicKey: PublicKey) => {
        const pubKey = publicKey.toString();
        setWallet({
          connected: true,
          publicKey: pubKey,
          balance: 0,
          connecting: false,
        });
        updateBalance(pubKey);
      });

      window.solana.on('disconnect', () => {
        setWallet({
          connected: false,
          publicKey: null,
          balance: 0,
          connecting: false,
        });
      });
    }
  }, [updateBalance]);

  return {
    ...wallet,
    connect,
    disconnect,
  };
}

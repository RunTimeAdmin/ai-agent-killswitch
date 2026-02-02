'use client';

import { useEffect, useState, useCallback } from 'react';

interface PhantomWindow extends Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: () => void) => void;
    publicKey?: { toString: () => string };
  };
}

declare const window: PhantomWindow;

export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const connect = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.solana?.isPhantom) {
        const response = await window.solana.connect();
        const key = response.publicKey.toString();
        setPublicKey(key);
        setConnected(true);
        
        // Fetch token balance (mock for now)
        // TODO: Connect to Solana RPC to get real balance
        setBalance(0);
        
        return key;
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
    return null;
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
        setConnected(false);
        setPublicKey(null);
        setBalance(0);
      }
    } catch (error) {
      console.error('Wallet disconnect error:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana?.isPhantom) {
      window.solana.on('connect', () => {
        if (window.solana?.publicKey) {
          setPublicKey(window.solana.publicKey.toString());
          setConnected(true);
        }
      });

      window.solana.on('disconnect', () => {
        setConnected(false);
        setPublicKey(null);
        setBalance(0);
      });

      // Check if already connected
      if (window.solana.publicKey) {
        setPublicKey(window.solana.publicKey.toString());
        setConnected(true);
      }
    }
  }, []);

  return {
    connected,
    publicKey,
    balance,
    connect,
    disconnect,
  };
}
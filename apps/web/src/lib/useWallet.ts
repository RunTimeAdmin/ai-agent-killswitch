'use client';

import { useEffect, useState, useCallback } from 'react';

const KILLSWITCH_TOKEN = '56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

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

interface TokenBalance {
  amount: number;
  decimals: number;
  uiAmount: number;
}

async function getTokenBalance(walletAddress: string): Promise<number> {
  try {
    // Get token accounts for the wallet
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: KILLSWITCH_TOKEN },
          { encoding: 'jsonParsed' }
        ]
      })
    });

    const data = await response.json();
    
    if (data.result?.value?.length > 0) {
      const tokenAccount = data.result.value[0];
      const balance = tokenAccount.account.data.parsed.info.tokenAmount;
      return balance.uiAmount || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async (address: string) => {
    setLoading(true);
    const tokenBalance = await getTokenBalance(address);
    setBalance(tokenBalance);
    setLoading(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.solana?.isPhantom) {
        const response = await window.solana.connect();
        const key = response.publicKey.toString();
        setPublicKey(key);
        setConnected(true);
        
        // Fetch real token balance
        await fetchBalance(key);
        
        return key;
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
    return null;
  }, [fetchBalance]);

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

  const refreshBalance = useCallback(async () => {
    if (publicKey) {
      await fetchBalance(publicKey);
    }
  }, [publicKey, fetchBalance]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana?.isPhantom) {
      window.solana.on('connect', () => {
        if (window.solana?.publicKey) {
          const key = window.solana.publicKey.toString();
          setPublicKey(key);
          setConnected(true);
          fetchBalance(key);
        }
      });

      window.solana.on('disconnect', () => {
        setConnected(false);
        setPublicKey(null);
        setBalance(0);
      });

      // Check if already connected
      if (window.solana.publicKey) {
        const key = window.solana.publicKey.toString();
        setPublicKey(key);
        setConnected(true);
        fetchBalance(key);
      }
    }
  }, [fetchBalance]);

  return {
    connected,
    publicKey,
    balance,
    loading,
    connect,
    disconnect,
    refreshBalance,
  };
}
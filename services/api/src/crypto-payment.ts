/**
 * $KILLSWITCH Crypto Payment Service
 * Accept SOL and USDC payments on Solana
 */
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TIERS, TierName } from './subscription-service';

// Treasury wallet for receiving payments
const TREASURY_WALLET = process.env.TREASURY_WALLET || '';

// USDC token on Solana mainnet
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export interface PaymentRequest {
  userId: string;
  tier: TierName;
  paymentToken: 'SOL' | 'USDC';
  discountPercent: number;
}

export interface PaymentInfo {
  paymentAddress: string;
  amountUsd: number;
  amountToken: number;
  paymentToken: string;
  expiresAt: Date;
}

export interface PaymentVerification {
  verified: boolean;
  signature?: string;
  amount?: number;
  error?: string;
}

// In-memory payment tracking
const pendingPayments: Map<string, PaymentInfo & { userId: string; tier: TierName }> = new Map();

export class CryptoPaymentService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
  }

  /**
   * Generate a payment request
   */
  async generatePaymentRequest(request: PaymentRequest): Promise<PaymentInfo> {
    const basePrice = TIERS[request.tier].price;
    const discountedPrice = basePrice * (1 - request.discountPercent / 100);

    // Get current token price (in production, use price oracle)
    const tokenPrice = request.paymentToken === 'SOL' 
      ? await this.getSolPrice()
      : 1; // USDC is pegged to $1

    const amountToken = discountedPrice / tokenPrice;

    // Use treasury wallet as payment address
    const paymentAddress = TREASURY_WALLET;

    const paymentInfo: PaymentInfo = {
      paymentAddress,
      amountUsd: discountedPrice,
      amountToken: Math.ceil(amountToken * 1000000) / 1000000, // 6 decimal precision
      paymentToken: request.paymentToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    // Store pending payment
    pendingPayments.set(request.userId, {
      ...paymentInfo,
      userId: request.userId,
      tier: request.tier,
    });

    return paymentInfo;
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(userId: string, signature: string): Promise<PaymentVerification> {
    const pendingPayment = pendingPayments.get(userId);
    
    if (!pendingPayment) {
      return { verified: false, error: 'No pending payment found' };
    }

    if (new Date() > pendingPayment.expiresAt) {
      pendingPayments.delete(userId);
      return { verified: false, error: 'Payment request expired' };
    }

    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        return { verified: false, error: 'Transaction not found' };
      }

      // Verify recipient
      const recipient = this.extractRecipient(transaction);
      if (recipient !== TREASURY_WALLET) {
        return { verified: false, error: 'Invalid recipient' };
      }

      // Verify amount
      const amount = this.extractAmount(transaction, pendingPayment.paymentToken);
      const expectedAmount = pendingPayment.amountToken;

      // Allow 1% slippage
      if (amount < expectedAmount * 0.99) {
        return { verified: false, error: `Insufficient amount: got ${amount}, expected ${expectedAmount}` };
      }

      // Payment verified, remove from pending
      pendingPayments.delete(userId);

      return {
        verified: true,
        signature,
        amount,
      };
    } catch (error) {
      return { verified: false, error: `Verification failed: ${error}` };
    }
  }

  /**
   * Get SOL price in USD (simplified - use oracle in production)
   */
  private async getSolPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      return data.solana.usd;
    } catch {
      return 100; // Fallback price
    }
  }

  /**
   * Extract recipient from transaction
   */
  private extractRecipient(transaction: any): string {
    const postBalances = transaction.meta?.postBalances || [];
    const preBalances = transaction.meta?.preBalances || [];
    const accounts = transaction.transaction?.message?.accountKeys || [];

    // Find account with increased balance
    for (let i = 0; i < postBalances.length; i++) {
      if (postBalances[i] > preBalances[i]) {
        return accounts[i]?.toString() || '';
      }
    }
    return '';
  }

  /**
   * Extract amount from transaction
   */
  private extractAmount(transaction: any, token: string): number {
    if (token === 'SOL') {
      const postBalances = transaction.meta?.postBalances || [];
      const preBalances = transaction.meta?.preBalances || [];
      
      for (let i = 0; i < postBalances.length; i++) {
        const diff = postBalances[i] - preBalances[i];
        if (diff > 0) {
          return diff / LAMPORTS_PER_SOL;
        }
      }
    }
    // For USDC, parse token transfer
    return 0;
  }

  /**
   * Get pending payment for user
   */
  getPendingPayment(userId: string): PaymentInfo | undefined {
    const payment = pendingPayments.get(userId);
    if (payment && new Date() > payment.expiresAt) {
      pendingPayments.delete(userId);
      return undefined;
    }
    return payment;
  }

  /**
   * Cancel pending payment
   */
  cancelPayment(userId: string): void {
    pendingPayments.delete(userId);
  }
}

export const cryptoPaymentService = new CryptoPaymentService();

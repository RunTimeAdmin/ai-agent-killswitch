/**
 * $KILLSWITCH Token Utility Service
 * Token balance checking and discount calculation
 */
import { Connection, PublicKey } from '@solana/web3.js';

// $KILLSWITCH Token Address on Solana
export const KILLSWITCH_TOKEN = '56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon';
export const TOTAL_SUPPLY = 1_000_000_000;

// Token tiers for discounts and governance
export const TOKEN_TIERS = {
  holder: { min: 1000, discount: 0, votingMultiplier: 1 },
  supporter: { min: 10000, discount: 10, votingMultiplier: 1 },
  advocate: { min: 100000, discount: 20, votingMultiplier: 1 },
  whale: { min: 1000000, discount: 40, votingMultiplier: 2 },
} as const;

export interface TokenHolder {
  walletAddress: string;
  balance: number;
  tier: string;
  discountPercent: number;
  votingPower: number;
}

export class TokenUtilityService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
  }

  /**
   * Get $KILLSWITCH token balance for a wallet
   */
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenMint = new PublicKey(KILLSWITCH_TOKEN);

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(publicKey, {
        mint: tokenMint,
      });

      if (tokenAccounts.value.length === 0) return 0;

      const balance = await this.connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      return parseInt(balance.value.amount) / Math.pow(10, balance.value.decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Calculate discount based on token holdings
   */
  calculateDiscount(balance: number): number {
    if (balance >= TOKEN_TIERS.whale.min) return TOKEN_TIERS.whale.discount;
    if (balance >= TOKEN_TIERS.advocate.min) return TOKEN_TIERS.advocate.discount;
    if (balance >= TOKEN_TIERS.supporter.min) return TOKEN_TIERS.supporter.discount;
    return 0;
  }

  /**
   * Get tier name based on balance
   */
  getTierName(balance: number): string {
    if (balance >= TOKEN_TIERS.whale.min) return 'whale';
    if (balance >= TOKEN_TIERS.advocate.min) return 'advocate';
    if (balance >= TOKEN_TIERS.supporter.min) return 'supporter';
    if (balance >= TOKEN_TIERS.holder.min) return 'holder';
    return 'none';
  }

  /**
   * Calculate voting power (2x for whales)
   */
  calculateVotingPower(balance: number): number {
    if (balance < TOKEN_TIERS.holder.min) return 0;
    if (balance >= TOKEN_TIERS.whale.min) return balance * 2;
    return balance;
  }

  /**
   * Check if wallet can participate in governance (1K+ tokens)
   */
  canParticipateInGovernance(balance: number): boolean {
    return balance >= TOKEN_TIERS.holder.min;
  }

  /**
   * Get full token holder info
   */
  async getTokenHolderInfo(walletAddress: string): Promise<TokenHolder> {
    const balance = await this.getTokenBalance(walletAddress);

    return {
      walletAddress,
      balance,
      tier: this.getTierName(balance),
      discountPercent: this.calculateDiscount(balance),
      votingPower: this.calculateVotingPower(balance),
    };
  }

  /**
   * Verify wallet signature (for connecting wallets)
   */
  async verifyWalletOwnership(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const { sign } = await import('tweetnacl');
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(signature, 'base64');

      return sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
    } catch {
      return false;
    }
  }

  /**
   * Get Jupiter swap URL for $KILLSWITCH
   */
  getSwapUrl(inputToken: string = 'SOL'): string {
    return `https://jup.ag/swap/${inputToken}-${KILLSWITCH_TOKEN}`;
  }

  /**
   * Get token info URL on Jupiter
   */
  getTokenInfoUrl(): string {
    return `https://jup.ag/tokens/${KILLSWITCH_TOKEN}`;
  }
}

export const tokenUtilityService = new TokenUtilityService();

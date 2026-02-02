/**
 * $KILLSWITCH Governance Service
 * Proposal creation and voting with token-weighted voting power
 */
import { tokenUtilityService, TOKEN_TIERS } from './token-utility';

export interface Proposal {
  id: number;
  proposerId: number;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'cancelled';
  forVotes: number;
  againstVotes: number;
  voteStart: Date;
  voteEnd: Date;
  createdAt: Date;
}

export interface Vote {
  id: number;
  userId: number;
  proposalId: number;
  support: boolean;
  votingPower: number;
  createdAt: Date;
}

// In-memory storage (replace with database in production)
const proposals: Map<number, Proposal> = new Map();
const votes: Map<string, Vote> = new Map(); // key: `${userId}-${proposalId}`
let proposalIdCounter = 1;
let voteIdCounter = 1;

export class GovernanceService {
  /**
   * Create a new proposal (requires 1K+ tokens)
   */
  async createProposal(
    proposerId: number,
    walletAddress: string,
    title: string,
    description: string
  ): Promise<Proposal> {
    const holderInfo = await tokenUtilityService.getTokenHolderInfo(walletAddress);

    if (!tokenUtilityService.canParticipateInGovernance(holderInfo.balance)) {
      throw new Error(`Must hold ${TOKEN_TIERS.holder.min}+ $KILLSWITCH to create proposals`);
    }

    const proposal: Proposal = {
      id: proposalIdCounter++,
      proposerId,
      title,
      description,
      status: 'active',
      forVotes: 0,
      againstVotes: 0,
      voteStart: new Date(),
      voteEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(
    userId: number,
    walletAddress: string,
    proposalId: number,
    support: boolean
  ): Promise<Vote> {
    const proposal = proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.status !== 'active') throw new Error('Proposal is not active');
    if (new Date() > proposal.voteEnd) throw new Error('Voting period has ended');

    const holderInfo = await tokenUtilityService.getTokenHolderInfo(walletAddress);

    if (!tokenUtilityService.canParticipateInGovernance(holderInfo.balance)) {
      throw new Error(`Must hold ${TOKEN_TIERS.holder.min}+ $KILLSWITCH to vote`);
    }

    const voteKey = `${userId}-${proposalId}`;
    if (votes.has(voteKey)) throw new Error('Already voted on this proposal');

    const vote: Vote = {
      id: voteIdCounter++,
      userId,
      proposalId,
      support,
      votingPower: holderInfo.votingPower,
      createdAt: new Date(),
    };

    votes.set(voteKey, vote);

    // Update vote counts
    if (support) {
      proposal.forVotes += holderInfo.votingPower;
    } else {
      proposal.againstVotes += holderInfo.votingPower;
    }

    return vote;
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: number): Proposal | undefined {
    return proposals.get(proposalId);
  }

  /**
   * List all proposals
   */
  listProposals(status?: string): Proposal[] {
    const all = Array.from(proposals.values());
    if (status) return all.filter(p => p.status === status);
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get user's vote on a proposal
   */
  getUserVote(userId: number, proposalId: number): Vote | undefined {
    return votes.get(`${userId}-${proposalId}`);
  }

  /**
   * Finalize proposal (called after voting ends)
   */
  finalizeProposal(proposalId: number): Proposal {
    const proposal = proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.status !== 'active') throw new Error('Proposal already finalized');
    if (new Date() < proposal.voteEnd) throw new Error('Voting period not ended');

    // Determine outcome (simple majority)
    proposal.status = proposal.forVotes > proposal.againstVotes ? 'passed' : 'rejected';
    return proposal;
  }

  /**
   * Cancel proposal (only by proposer)
   */
  cancelProposal(proposalId: number, userId: number): Proposal {
    const proposal = proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.proposerId !== userId) throw new Error('Only proposer can cancel');
    if (proposal.status !== 'active') throw new Error('Proposal not active');

    proposal.status = 'cancelled';
    return proposal;
  }

  /**
   * Get governance stats
   */
  getStats(): {
    totalProposals: number;
    activeProposals: number;
    passedProposals: number;
    totalVotes: number;
  } {
    const all = Array.from(proposals.values());
    return {
      totalProposals: all.length,
      activeProposals: all.filter(p => p.status === 'active').length,
      passedProposals: all.filter(p => p.status === 'passed').length,
      totalVotes: votes.size,
    };
  }
}

export const governanceService = new GovernanceService();

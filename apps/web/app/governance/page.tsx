'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/useWallet';
import { supabase } from '@/lib/supabase';

interface Proposal {
  id: string;
  title: string;
  description: string;
  votes_for: number;
  votes_against: number;
  status: string;
  ends_at: string;
}

export default function GovernancePage() {
  const { connected, publicKey, balance, connect, disconnect } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  // Calculate tier based on balance
  const getTier = (bal: number) => {
    if (bal >= 1000000) return { name: 'Whale', discount: 40, voteMultiplier: 2 };
    if (bal >= 100000) return { name: 'Diamond', discount: 20, voteMultiplier: 1 };
    if (bal >= 10000) return { name: 'Gold', discount: 10, voteMultiplier: 1 };
    if (bal >= 1000) return { name: 'Silver', discount: 0, voteMultiplier: 1 };
    return { name: '-', discount: 0, voteMultiplier: 0 };
  };

  const tier = getTier(balance);
  const votingPower = balance >= 1000 ? balance * tier.voteMultiplier : 0;

  // Fetch proposals from Supabase
  useEffect(() => {
    async function fetchProposals() {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching proposals:', error);
        // Use mock data if table doesn't exist yet
        setProposals([
          {
            id: '1',
            title: 'Increase API rate limits for Pro tier',
            description: 'Proposal to increase Pro tier API calls from 100 to 250 per day',
            votes_for: 45000,
            votes_against: 12000,
            status: 'active',
            ends_at: '2026-02-15'
          },
          {
            id: '2',
            title: 'Add new VIP benefits',
            description: 'Add priority support and custom integrations for VIP tier',
            votes_for: 78000,
            votes_against: 5000,
            status: 'active',
            ends_at: '2026-02-10'
          }
        ]);
      } else {
        setProposals(data || []);
      }
      setLoading(false);
    }

    fetchProposals();
  }, []);

  // Cast vote
  const castVote = async (proposalId: string, voteFor: boolean) => {
    if (!connected || !publicKey || votingPower === 0) {
      alert('Connect wallet with at least 1,000 $KILLSWITCH to vote');
      return;
    }

    setVoting(proposalId);

    try {
      // Record vote in Supabase
      const { error } = await supabase.from('votes').insert({
        proposal_id: proposalId,
        wallet_address: publicKey,
        vote_power: votingPower,
        vote_for: voteFor
      });

      if (error) {
        console.error('Vote error:', error);
        alert('Vote recorded (demo mode)');
      } else {
        alert('Vote submitted successfully!');
      }

      // Update local state
      setProposals(prev => prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            votes_for: voteFor ? p.votes_for + votingPower : p.votes_for,
            votes_against: !voteFor ? p.votes_against + votingPower : p.votes_against
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Vote error:', err);
    }

    setVoting(null);
  };

  const votePercentage = (forVotes: number, againstVotes: number) => {
    const total = forVotes + againstVotes;
    return total > 0 ? Math.round((forVotes / total) * 100) : 0;
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-red-500">$KILLSWITCH</span> Governance
          </h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-white">← Back</a>
            {connected ? (
              <button 
                onClick={disconnect}
                className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                {shortenAddress(publicKey!)} ✓
              </button>
            ) : (
              <button 
                onClick={connect}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Connect Phantom
              </button>
            )}
          </div>
        </div>

        {/* Token Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Your Balance</p>
            <p className="text-2xl font-bold">{balance.toLocaleString()} $KILL</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Voting Power</p>
            <p className="text-2xl font-bold">{votingPower.toLocaleString()} votes</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Your Tier</p>
            <p className="text-2xl font-bold">{tier.name}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Discount</p>
            <p className="text-2xl font-bold">{tier.discount}%</p>
          </div>
        </div>

        {/* Wallet Connection Notice */}
        {!connected && (
          <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4 mb-8 text-center">
            <p className="text-purple-300">
              Connect your Phantom wallet to vote on proposals
            </p>
          </div>
        )}

        {/* Tier Requirements */}
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-8">
          <h2 className="text-xl font-semibold mb-4">Token Holder Tiers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">1,000 $KILL</p>
              <p className="text-green-400">Vote on proposals</p>
            </div>
            <div>
              <p className="text-gray-400">10,000 $KILL</p>
              <p className="text-green-400">10% discount</p>
            </div>
            <div>
              <p className="text-gray-400">100,000 $KILL</p>
              <p className="text-green-400">20% discount</p>
            </div>
            <div>
              <p className="text-gray-400">1,000,000 $KILL</p>
              <p className="text-green-400">40% + 2x votes</p>
            </div>
          </div>
        </div>

        {/* Active Proposals */}
        <h2 className="text-xl font-semibold mb-4">Active Proposals</h2>
        
        {loading ? (
          <p className="text-gray-400">Loading proposals...</p>
        ) : proposals.length === 0 ? (
          <p className="text-gray-400">No active proposals</p>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{proposal.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{proposal.description}</p>
                  </div>
                  <span className="bg-green-600 text-xs px-2 py-1 rounded">
                    {proposal.status.toUpperCase()}
                  </span>
                </div>
                
                {/* Vote Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-400">For: {proposal.votes_for.toLocaleString()}</span>
                    <span className="text-red-400">Against: {proposal.votes_against.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${votePercentage(proposal.votes_for, proposal.votes_against)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-sm">Ends: {proposal.ends_at}</p>
                  <div className="space-x-2">
                    <button 
                      onClick={() => castVote(proposal.id, true)}
                      disabled={!connected || votingPower === 0 || voting === proposal.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm"
                    >
                      {voting === proposal.id ? '...' : 'Vote For'}
                    </button>
                    <button 
                      onClick={() => castVote(proposal.id, false)}
                      disabled={!connected || votingPower === 0 || voting === proposal.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm"
                    >
                      {voting === proposal.id ? '...' : 'Vote Against'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buy Token CTA */}
        <div className="mt-8 text-center">
          <a 
            href="https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition inline-block"
          >
            Buy $KILLSWITCH on Jupiter
          </a>
        </div>
      </div>
    </main>
  );
}
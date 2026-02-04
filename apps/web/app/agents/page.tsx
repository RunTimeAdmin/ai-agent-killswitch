'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/lib/useWallet';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'killed';
  last_activity: string;
  api_calls_today: number;
  created_at: string;
}

export default function AgentsPage() {
  const { connected, publicKey, connect } = useWallet();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      if (!publicKey) {
        // Mock data for demo
        setAgents([
          {
            id: '1',
            name: 'Trading Bot Alpha',
            status: 'active',
            last_activity: new Date().toISOString(),
            api_calls_today: 45,
            created_at: '2026-01-15'
          },
          {
            id: '2',
            name: 'Research Assistant',
            status: 'paused',
            last_activity: new Date(Date.now() - 3600000).toISOString(),
            api_calls_today: 12,
            created_at: '2026-01-20'
          }
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('owner_wallet', publicKey);

      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents(data || []);
      }
      setLoading(false);
    }

    fetchAgents();
  }, [publicKey]);

  const toggleAgent = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    // Update in Supabase
    await supabase
      .from('agents')
      .update({ status: newStatus })
      .eq('id', agentId);

    // Update local state
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: newStatus as Agent['status'] } : a
    ));
  };

  const killAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to kill this agent?')) return;

    await supabase
      .from('agents')
      .update({ status: 'killed' })
      .eq('id', agentId);

    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: 'killed' } : a
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'killed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-black text-center py-2 px-4 text-sm">
        <span className="font-semibold">Demo Mode</span> — Showing sample data. <a href="/docs" className="underline">View integration docs</a>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-red-500">Agent</span> Dashboard
          </h1>
          <div className="flex gap-4">
            <a href="/" className="text-gray-400 hover:text-white">← Home</a>
            <a href="/governance" className="text-gray-400 hover:text-white">Governance</a>
          </div>
        </div>

        {!connected && (
          <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-6 mb-8 text-center">
            <p className="text-purple-300 mb-4">Connect wallet to manage your agents</p>
            <button 
              onClick={connect}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold"
            >
              Connect Phantom
            </button>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Total Agents</p>
            <p className="text-2xl font-bold">{agents.length}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-400">
              {agents.filter(a => a.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Paused</p>
            <p className="text-2xl font-bold text-yellow-400">
              {agents.filter(a => a.status === 'paused').length}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">API Calls Today</p>
            <p className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + a.api_calls_today, 0)}
            </p>
          </div>
        </div>

        {/* Agents List */}
        <h2 className="text-xl font-semibold mb-4">Your Agents</h2>

        {loading ? (
          <p className="text-gray-400">Loading agents...</p>
        ) : agents.length === 0 ? (
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400 mb-4">No agents registered yet</p>
            <button className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg">
              Register New Agent
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                    <div>
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
                      <p className="text-gray-400 text-sm">
                        Last active: {new Date(agent.last_activity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-400">API Calls Today</p>
                    <p className="font-semibold">{agent.api_calls_today}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Registered</p>
                    <p className="font-semibold">{agent.created_at}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">ID</p>
                    <p className="font-mono text-xs">{agent.id}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {agent.status !== 'killed' && (
                    <>
                      <button
                        onClick={() => toggleAgent(agent.id, agent.status)}
                        className={`px-4 py-2 rounded text-sm ${
                          agent.status === 'active' 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {agent.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => killAgent(agent.id)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                      >
                        Kill
                      </button>
                    </>
                  )}
                  <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                    View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register New Agent CTA */}
        <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-2">Register a New Agent</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add the $KILLSWITCH fence to your AI agent for real-time monitoring and control.
          </p>
          <code className="block bg-black p-4 rounded text-sm text-green-400 mb-4">
            pip install killswitch-fence
          </code>
          <a href="/docs" className="text-red-400 hover:text-red-300 text-sm">
            View Integration Guide →
          </a>
        </div>
      </div>
    </main>
  );
}
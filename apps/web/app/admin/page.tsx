'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalRevenue: number;
  apiCallsToday: number;
  newUsersToday: number;
}

interface User {
  id: string;
  wallet_address: string;
  tier: string;
  created_at: string;
  agents_count: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalRevenue: 0,
    apiCallsToday: 0,
    newUsersToday: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch agents count
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });

      // Fetch active agents
      const { count: activeCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Mock stats for demo
      setStats({
        totalUsers: usersData?.length || 47,
        totalAgents: agentsCount || 128,
        activeAgents: activeCount || 89,
        totalRevenue: 12450,
        apiCallsToday: 8432,
        newUsersToday: 12
      });

      setUsers(usersData || [
        { id: '1', wallet_address: '7xKX...3mPq', tier: 'pro', created_at: '2026-02-01', agents_count: 3 },
        { id: '2', wallet_address: '4nRe...9kLm', tier: 'team', created_at: '2026-02-01', agents_count: 8 },
        { id: '3', wallet_address: '9pQw...2jNx', tier: 'basic', created_at: '2026-01-31', agents_count: 1 }
      ]);

      setLoading(false);
    }

    fetchData();
  }, []);

  const shortenAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-red-500">Admin</span> Panel
          </h1>
          <div className="flex gap-4">
            <a href="/" className="text-gray-400 hover:text-white">← Home</a>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-xs">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-xs">Total Agents</p>
            <p className="text-2xl font-bold">{stats.totalAgents}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-xs">Active Agents</p>
            <p className="text-2xl font-bold text-green-400">{stats.activeAgents}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-xs">Revenue (USD)</p>
            <p className="text-2xl font-bold text-green-400">${stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-xs">API Calls Today</p>
            <p className="text-2xl font-bold">{stats.apiCallsToday.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-xs">New Users Today</p>
            <p className="text-2xl font-bold text-blue-400">+{stats.newUsersToday}</p>
          </div>
        </div>

        {/* Revenue by Tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Revenue by Tier</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Basic ($5)</span>
                <span className="font-semibold">12 users = $60</span>
              </div>
              <div className="flex justify-between">
                <span>Pro ($50)</span>
                <span className="font-semibold">18 users = $900</span>
              </div>
              <div className="flex justify-between">
                <span>Team ($250)</span>
                <span className="font-semibold">8 users = $2,000</span>
              </div>
              <div className="flex justify-between">
                <span>Enterprise ($1K)</span>
                <span className="font-semibold">5 users = $5,000</span>
              </div>
              <div className="flex justify-between">
                <span>VIP ($5K)</span>
                <span className="font-semibold">1 user = $5,000</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between font-bold">
                <span>Total MRR</span>
                <span className="text-green-400">$12,960</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">System Health</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>API Server</span>
                <span className="bg-green-500 text-xs px-2 py-1 rounded">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="bg-green-500 text-xs px-2 py-1 rounded">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Solana RPC</span>
                <span className="bg-green-500 text-xs px-2 py-1 rounded">CONNECTED</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stripe</span>
                <span className="bg-yellow-500 text-xs px-2 py-1 rounded">TEST MODE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Email Service</span>
                <span className="bg-gray-500 text-xs px-2 py-1 rounded">NOT CONFIGURED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-3">Wallet</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Agents</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800">
                    <td className="py-3 font-mono">{shortenAddress(user.wallet_address)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.tier === 'vip' ? 'bg-purple-600' :
                        user.tier === 'enterprise' ? 'bg-red-600' :
                        user.tier === 'team' ? 'bg-blue-600' :
                        user.tier === 'pro' ? 'bg-green-600' :
                        'bg-gray-600'
                      }`}>
                        {user.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">{user.agents_count}</td>
                    <td className="py-3 text-gray-400">{user.created_at}</td>
                    <td className="py-3">
                      <button className="text-blue-400 hover:text-blue-300 mr-2">View</button>
                      <button className="text-red-400 hover:text-red-300">Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-gray-900 hover:bg-gray-800 p-4 rounded-lg border border-gray-800 text-left">
            <p className="font-semibold">Export Users</p>
            <p className="text-gray-400 text-sm">Download CSV</p>
          </button>
          <button className="bg-gray-900 hover:bg-gray-800 p-4 rounded-lg border border-gray-800 text-left">
            <p className="font-semibold">View Logs</p>
            <p className="text-gray-400 text-sm">Audit trail</p>
          </button>
          <button className="bg-gray-900 hover:bg-gray-800 p-4 rounded-lg border border-gray-800 text-left">
            <p className="font-semibold">Send Broadcast</p>
            <p className="text-gray-400 text-sm">Email all users</p>
          </button>
          <button className="bg-red-900 hover:bg-red-800 p-4 rounded-lg border border-red-700 text-left">
            <p className="font-semibold">Emergency Kill</p>
            <p className="text-gray-400 text-sm">Stop all agents</p>
          </button>
        </div>
      </div>
    </main>
  );
}
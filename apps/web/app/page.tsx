export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="bg-red-600/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold">
                82/82 Tests Passing • Production Ready
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-red-500">$KILLSWITCH</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Because every AI needs an off switch.
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Real-time monitoring and instant termination for AI agents. 
              Protect your systems with enterprise-grade safety controls.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/agents"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition text-lg"
              >
                Launch Dashboard
              </a>
              <a 
                href="https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent border-2 border-red-500 text-red-400 hover:bg-red-500/10 font-bold py-4 px-8 rounded-lg transition text-lg"
              >
                Buy $KILLSWITCH
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Enterprise-Grade <span className="text-red-500">AI Safety</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-red-500/50 transition">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-3">Runtime Fence</h3>
            <p className="text-gray-400">
              Monitor every action your AI agents take in real-time. 
              Set boundaries and get instant alerts.
            </p>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-red-500/50 transition">
            <div className="text-4xl mb-4">🔴</div>
            <h3 className="text-xl font-semibold mb-3">Instant Kill Switch</h3>
            <p className="text-gray-400">
              One-click termination when things go wrong. 
              Stop rogue agents before they cause damage.
            </p>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-red-500/50 transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Audit Logging</h3>
            <p className="text-gray-400">
              Complete audit trail of all agent actions. 
              Meet compliance requirements with ease.
            </p>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-red-500/50 transition">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-3">Sub-Second Response</h3>
            <p className="text-gray-400">
              Kill signals processed in under 100ms. 
              When safety matters, speed is everything.
            </p>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-red-500/50 transition">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-3">Easy Integration</h3>
            <p className="text-gray-400">
              One line of code to protect any Python or Node.js agent. 
              Works with OpenAI, Anthropic, and more.
            </p>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 hover:border-red-500/50 transition">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-xl font-semibold mb-3">Token Governance</h3>
            <p className="text-gray-400">
              Hold $KILLSWITCH to vote on protocol changes. 
              Shape the future of AI safety together.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-red-500">82</p>
              <p className="text-gray-400">Tests Passing</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-500">&lt;100ms</p>
              <p className="text-gray-400">Kill Latency</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-500">24/7</p>
              <p className="text-gray-400">Monitoring</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-500">100%</p>
              <p className="text-gray-400">Open Source</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 rounded-2xl p-8 md:p-12 border border-red-500/30">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Hold <span className="text-red-500">$KILLSWITCH</span>
              </h2>
              <p className="text-gray-300 mb-6">
                Token holders get exclusive benefits including subscription discounts, 
                governance voting rights, and premium support access.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>1,000+ tokens = Vote on proposals</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>10,000+ tokens = 10% subscription discount</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>100,000+ tokens = 20% discount</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>1,000,000+ tokens = 40% discount + 2x voting power</span>
                </div>
              </div>
              <a 
                href="https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Buy on Jupiter
              </a>
            </div>
            <div className="text-center">
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <p className="text-gray-400 text-sm mb-2">Contract Address</p>
                <p className="font-mono text-sm break-all text-red-400">
                  56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon
                </p>
                <p className="text-gray-400 text-sm mt-4">Network: Solana</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Secure Your AI Agents?</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Get started in minutes with our simple SDK integration. 
          Free tier available for personal projects.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/subscription" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition">
            View Pricing
          </a>
          <a href="/governance" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition">
            Governance
          </a>
          <a href="/agents" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition">
            Dashboard
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">
              © 2026 $KILLSWITCH. Because every AI needs an off switch.
            </p>
            <div className="flex gap-6">
              <a href="https://github.com/RunTimeAdmin/ai-agent-killswitch" target="_blank" className="text-gray-400 hover:text-white">
                GitHub
              </a>
              <a href="/governance" className="text-gray-400 hover:text-white">
                Governance
              </a>
              <a href="/subscription" className="text-gray-400 hover:text-white">
                Pricing
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
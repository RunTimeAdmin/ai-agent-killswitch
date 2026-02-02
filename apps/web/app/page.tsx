export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-red-500">$KILLSWITCH</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Because every AI needs an off switch.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-semibold mb-2">Runtime Fence</h3>
              <p className="text-gray-400">Real-time AI agent monitoring and control</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-semibold mb-2">82/82 Tests</h3>
              <p className="text-gray-400">Production-ready with full test coverage</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-semibold mb-2">Token Utility</h3>
              <p className="text-gray-400">Governance voting and subscription discounts</p>
            </div>
          </div>
          
          <div className="mt-12">
            <a 
              href="https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Buy on Jupiter
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

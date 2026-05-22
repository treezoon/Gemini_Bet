const { useState, useEffect, useRef } = React;

function SportsbookDashboard() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betSlip, setBetSlip] = useState([]);
  const [stake, setStake] = useState(10);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Automatically uses window.location to talk directly to your deployed backend
    const socket = io(window.location.origin);

    socket.on('match_updates', (data) => {
      setMatches(data);
      if (selectedMatch) {
        const updated = data.find(m => m.id === selectedMatch.id);
        setSelectedMatch(updated);
      } else if (data.length > 0) {
        setSelectedMatch(data[0]);
      }
    });

    return () => { socket.off('match_updates'); };
  }, [selectedMatch]);

  // 2D Match Field Animation Renderer
  useEffect(() => {
    if (!canvasRef.current || !selectedMatch) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Drawing basic green pitch grass background
    ctx.fillStyle = '#16a34a'; 
    ctx.fillRect(0, 0, 400, 200);
    
    // Outer pitch lines and boundary markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 380, 180);
    ctx.strokeRect(199, 10, 2, 180);
    
    // Penalty area boxes
    ctx.strokeRect(10, 50, 40, 100);
    ctx.strokeRect(350, 50, 40, 100);

    // Center pitch circle marking
    ctx.beginPath();
    ctx.arc(200, 100, 30, 0, 2 * Math.PI);
    ctx.stroke();

    // Attacking Momentum Tracking Ball
    const ballX = 200 + (selectedMatch.momentum * 1.7); 
    ctx.beginPath();
    ctx.arc(ballX, 100, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#facc15'; 
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }, [selectedMatch]);

  const addToSlip = (match, market, selection, odds) => {
    const filtered = betSlip.filter(item => !(item.matchId === match.id && item.market === market));
    setBetSlip([...filtered, { matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, market, selection, odds }]);
  };

  const calculateTotalOdds = () => {
    return betSlip.reduce((acc, item) => acc * item.odds, 1).toFixed(2);
  };

  return (
    <div class="p-6">
      <header class="mb-6 border-b border-slate-800 pb-4">
        <h1 class="text-2xl font-black text-indigo-400 tracking-wider">⚽ ACCUMULATOR STRIKE SIMULATOR</h1>
      </header>
      
      <div class="grid grid-cols-12 gap-6">
        
        {/* MATCH SELECTION GRID */}
        <div class="col-span-12 lg:col-span-5 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h2 class="text-lg font-bold mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
            <span class="animate-pulse text-red-500 text-xl">●</span> Live In-Play Markets
          </h2>
          {matches.map(match => (
            <div 
              key={match.id} 
              onClick={() => setSelectedMatch(match)}
              class={`p-4 rounded-lg cursor-pointer mb-3 transition-colors ${selectedMatch?.id === match.id ? 'bg-indigo-950 border border-indigo-500' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <div class="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>{match.league}</span>
                <span class="text-amber-400 font-mono">{match.minute}' MIN</span>
              </div>
              <div class="flex justify-between items-center my-3 font-extrabold text-md md:text-lg">
                <span>{match.homeTeam} vs {match.awayTeam}</span>
                <span class="bg-slate-900 px-3 py-1 rounded-md text-emerald-400 font-mono tracking-widest">{match.score.home} - {match.score.away}</span>
              </div>
              
              {match.odds['1X2'] && (
                <div class="grid grid-cols-3 gap-2 mt-2 text-xs text-center" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => addToSlip(match, '1X2', '1', match.odds['1X2']['1'])} class="bg-slate-800 p-2 rounded border border-slate-700 hover:border-indigo-500 transition">
                    <span class="text-slate-400 font-bold block">1</span>
                    <span class="font-mono text-indigo-400 text-sm font-bold">{match.odds['1X2']['1'].toFixed(2)}</span>
                  </button>
                  <button onClick={() => addToSlip(match, '1X2', 'X', match.odds['1X2']['X'])} class="bg-slate-800 p-2 rounded border border-slate-700 hover:border-indigo-500 transition">
                    <span class="text-slate-400 font-bold block">X</span>
                    <span class="font-mono text-indigo-400 text-sm font-bold">{match.odds['1X2']['X'].toFixed(2)}</span>
                  </button>
                  <button onClick={() => addToSlip(match, '1X2', '2', match.odds['1X2']['2'])} class="bg-slate-800 p-2 rounded border border-slate-700 hover:border-indigo-500 transition">
                    <span class="text-slate-400 font-bold block">2</span>
                    <span class="font-mono text-indigo-400 text-sm font-bold">{match.odds['1X2']['2'].toFixed(2)}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* TRACKING STREAM VISUALIZER & COMMENTARY */}
        <div class="col-span-12 md:col-span-7 lg:col-span-4 flex flex-col gap-6">
          {selectedMatch ? (
            <React.Fragment>
              <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 class="text-sm font-bold tracking-wider uppercase text-slate-400 mb-3">🎯 Attacking Momentum Vector Radar</h3>
                <canvas ref={canvasRef} width={400} height={200} class="w-full rounded-lg shadow-2xl border border-slate-900" />
                <div class="flex justify-between text-xs mt-2 font-bold text-slate-400 px-1">
                  <span>◀ Attacking: {selectedMatch.homeTeam}</span>
                  <span>{selectedMatch.awayTeam} :Attacking ▶</span>
                </div>
              </div>

              <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 min-h-[250px] max-h-[350px] flex flex-col overflow-hidden">
                <h3 class="text-sm font-bold tracking-wider uppercase text-slate-400 mb-3">🎙️ Live Commentary Stream</h3>
                <div class="overflow-y-auto flex-1 pr-1 flex flex-col gap-2">
                  {selectedMatch.commentary.map((log, index) => (
                    <div key={index} class={`p-3 rounded-lg text-xs font-mono border ${log.includes('GOAL') ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold' : 'bg-slate-900/50 border-slate-800 text-slate-300'}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ) : (
            <div class="text-center text-slate-500 mt-12 font-bold">Select an in-play fixture to load streaming visualization telemetry.</div>
          )}
        </div>

        {/* ACCUMULATOR MULTI-BET SLIP */}
        <div class="col-span-12 md:col-span-5 lg:col-span-3 bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between min-h-[450px]">
          <div>
            <h2 class="text-lg font-bold border-b border-slate-700 pb-2 mb-4 flex justify-between items-center">
              <span>🎫 Accumulator Slip</span>
              {betSlip.length > 0 && <span class="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-mono">{betSlip.length}</span>}
            </h2>
            {betSlip.length === 0 ? (
              <p class="text-center text-slate-500 text-sm py-12 font-medium">Click matching market event odds on the dashboard to build your combined multi-bet slip.</p>
            ) : (
              <div class="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
                {betSlip.map((bet, idx) => (
                  <div key={idx} class="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs relative group">
                    <button onClick={() => setBetSlip(betSlip.filter((_, i) => i !== idx))} class="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition font-bold">✕</button>
                    <p class="font-bold text-slate-400 mb-1">{bet.homeTeam} v {bet.awayTeam}</p>
                    <div class="flex justify-between items-center mt-2">
                      <span class="bg-indigo-950/80 text-indigo-400 font-bold px-2 py-1 rounded border border-indigo-900/60 uppercase text-[10px] tracking-wider">{bet.market}: {bet.selection}</span>
                      <span class="text-amber-400 font-mono font-black text-sm">@{bet.odds.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {betSlip.length > 0 && (
            <div class="border-t border-slate-700 pt-4 mt-4 space-y-4">
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-400 font-bold">Combined Accumulator Odds:</span>
                <span class="text-amber-400 font-mono font-black text-xl tracking-wide">{calculateTotalOdds()}</span>
              </div>
              <div>
                <label class="block text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Stake Amount (USD):</label>
                <input 
                  type="number" 
                  value={stake} 
                  onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                  class="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-black p-3 rounded-lg text-right focus:outline-none focus:border-indigo-500 tracking-wider"
                />
              </div>
              <div class="flex justify-between items-center text-sm font-bold bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span class="text-slate-400">Potential Payout:</span>
                <span class="text-emerald-400 font-mono text-xl font-black">${(stake * Number(calculateTotalOdds())).toFixed(2)}</span>
              </div>
              <button class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-98 tracking-wider uppercase text-xs">
                Submit Accumulator Ticket
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const root = destructuredReactDOM || ReactDOM;
root.createRoot(document.getElementById('root')).render(<SportsbookDashboard />);

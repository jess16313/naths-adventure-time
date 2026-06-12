import React, { useState } from 'react';

export default function Thief({ playerState }) {
  const [hasUnlocked, setHasUnlocked] = useState(false);

  // 🛡️ CRITICAL SAFETY GUARD: If playerState hasn't loaded yet from Supabase,
  // return a clean loading screen instead of crashing with a white screen.
  if (!playerState) {
    return <div className="text-amber-500 font-mono text-center py-8">Synchronizing Thief Terminal Link...</div>;
  }

  // Hardcoded array of your 4 unique sequential crystal hints
  const CRYSTAL_POOL = [
    { level: 1, name: 'Crystal Hint 1', hint_text: 'The frozen vault holds your answer.', image_url: null },
    { level: 2, name: 'Crystal Hint 2', hint_text: 'Look beneath the grandfather clock floorboards.', image_url: null },
    { level: 3, name: 'Crystal Hint 3', hint_text: 'The third key resides where shadows pool.', image_url: null },
    { level: 4, name: 'Crystal Hint 4', hint_text: 'Analyze the grid sectors marked in red on this blueprint.', image_url: '/images/map_hint_4.png' }
  ];

  // Safely extract currentLevel using your data variables
  const currentLevel = playerState.thief_number ? Number(playerState.thief_number) : 1;

  // Find the exact matching hint from our pool based on the GM's database update
  const activeHint = CRYSTAL_POOL.find(hint => hint.level === currentLevel) || CRYSTAL_POOL[0];

  // If the GM updates the number past the total pool size, they win or finish the mission
  if (currentLevel > CRYSTAL_POOL.length) {
    return (
      <div className="text-center py-8 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 p-6 space-y-3">
        <span className="text-4xl block animate-bounce">💎</span>
        <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-wider">All Crystals Extracted</h3>
        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
          Go talk to Jake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 🔴 READ-ONLY STATUS HEADER */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">Operational Status</span>
          {/* 🛠️ FIXED: Changed from activeRiddle.title to activeHint.name */}
          <h4 className="text-sm font-black text-white uppercase tracking-wider">{activeHint?.name || 'Loading Protocol...'}</h4>
        </div>
        {/* 🛠️ FIXED: Changed from currentStage to currentLevel */}
        <span className="bg-amber-500 text-slate-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
          STG {currentLevel}
        </span>
      </div>

      {!hasUnlocked ? (
        // STATE A: Immersive local interaction screen to unlock the text display locally
        <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            The Game Master has routed an active intel feed to your terminal node. Secure the decrypted link to read your coordinates.
          </p>
          <button 
            onClick={() => setHasUnlocked(true)} 
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-600/20"
          >
            Decrypt Live Transmission
          </button>
        </div>
           ) : (
        // STATE B: Displaying ONLY the active text stream pushed by the GM down through real-time states
        <div className="bg-slate-900/80 border border-emerald-500/20 p-5 rounded-2xl space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-black">
            <span>// Live Infiltration Stream</span>
            {activeHint?.name && (
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-gray-300">
                {activeHint.name}
              </span>
            )}
          </div>

          {/* 🛠️ ADDED BACK: Dynamic Clue Text Content */}
          <p className="text-sm text-gray-200 font-medium leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 font-mono">
            "{activeHint?.hint_text || 'Awaiting transmission parameters...'}"
          </p>

          {/* Conditional Image Rendering for Phase 4 or custom visual hints */}
          {activeHint?.image_url && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-xs text-slate-400 mb-2 italic">Intercepted architectural grid schematic:</p>
              <img src={activeHint.image_url} alt="Active Target Blueprint Layout" className="w-full h-auto rounded-xl border border-white/10 max-h-60 object-contain bg-black/40 shadow-md" />
            </div>
          )}

          {/* Locked Status Notice explicitly declaring that players are passive observers */}
          <div className="text-center pt-2 text-[10px] font-mono text-slate-500 tracking-wider uppercase">
            🔒 Feed Locked. Next coordinate sector unlocks via Game Master confirmation.
          </div>
        </div>
      )}
    </div>
  );  
}
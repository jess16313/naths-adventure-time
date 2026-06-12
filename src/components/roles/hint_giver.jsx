import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import MinigameOverlay from '../minigame';

export default function HintGiver({currentGmId}) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gmTestingLevel, setGmTestingLevel] = useState(0);
  // 1. Fetch the full list of players and listen for live updates
  useEffect(() => {
    const fetchAllPlayers = async () => {
      let { data } = await supabase
        .from('player')
        .select('*')
        .order('character_name', { ascending: true });
      if (data) setPlayers(data);
      setLoading(false);
    };

    fetchAllPlayers();

    // Subscribe to a global update channel to watch everyone's scores change live
    const globalChannel = supabase
      .channel('gm_global_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player' }, (payload) => {
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) => (p.id === payload.new.id ? payload.new : p))
        );
      })
      .subscribe();

    return () => supabase.removeChannel(globalChannel);
  }, []);

const updateThiefHintLevel = async (playerId, currentLevel, action) => {
  // 1. Force the value to a real number. If it is null or undefined, default to 1
  let cleanLevel = currentLevel !== null && currentLevel !== undefined ? Number(currentLevel) : 1;
  
  // 2. Double check safety fallback to prevent NaN errors
  if (isNaN(cleanLevel)) {
    cleanLevel = 1;
  }

  // 3. Compute the next step value
  let nextLevel = action === 'next' ? cleanLevel + 1 : cleanLevel - 1;
  if (nextLevel < 1) nextLevel = 1;

  console.log(`Attempting to update player ${playerId} to level:`, nextLevel);

  // 4. Run the update and catch errors explicitly
  const { error } = await supabase
    .from('player')
    .update({ thief_number: nextLevel })
    .eq('id', playerId);

  if (error) {
    console.error("Supabase Error:", error);
    alert(`Database Error: ${error.message} \nCode: ${error.code}`);
  } else {
    console.log("Database updated successfully!");
  }
};

  const initializeGlobalGameTimer = async () => {
  // Calculate exactly 15 minutes from the exact millisecond of clicking
  const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60000).toISOString();

  // Update ALL players who are actively in the game match
  const { error } = await supabase
    .from('player')
    .update({ 
      next_game_at: fifteenMinutesFromNow,
      game_timer_status: 'waiting_initial'
    })
    .not('role', 'eq', 'hint giver'); // Don't give the GM minigames

  if (error) {
    alert("Failed to initialize system clock: " + error.message);
  } else {
    alert("🚀 Match Clock Initialized! First wave of minigames triggers in 15 minutes.");
  }
};


  // 2. Administrative Database Command Hooks
  const triggerMinigame = async (playerId, levelId) => {
    await supabase
      .from('player')
      .update({ current_active_minigame: levelId })
      .eq('id', playerId);
  };

const toggleKidnap = async (playerId, currentStatus) => {
  try {
    const { data, error } = await supabase
      .from('player')
      .update({ is_kidnapped: !currentStatus })
      .eq('id', playerId)
      .select(); // Forces Supabase to return the newly updated data

    if (error) {
      alert(`Supabase Error: ${error.message}`);
    } else {
      alert(`Success! Player kidnapping status flipped to: ${!currentStatus}`);
    }
  } catch (err) {
    alert(`System Error: ${err.message}`);
  }
};


  const freezePlayer = async (playerId) => {
    // Freezes a player's interface for exactly 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60000).toISOString();
    await supabase
      .from('player')
      .update({ is_paused: true, paused_until: fiveMinutesFromNow })
      .eq('id', playerId);
  };

  const resetPlayer = async (playerId) => {
    await supabase
      .from('player')
      .update({ is_paused: false, paused_until: null, is_kidnapped: false })
      .eq('id', playerId);
  };

  if (loading) return <div className="text-amber-400 font-mono text-center">Loading Party Data Stream...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="border-b border-amber-500/20 pb-2">
        <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">👑 GAME MASTER CONTROL TERMINAL</h3>
        <p className="text-xs text-gray-400 mt-1">You are the Hint Giver. Use this grid tool to orchestrate the Ooo party mechanics live.</p>
      </div>

          <div>
          <button
            onClick={async () => {
              // Target YOUR OWN row ID to inject Level 1 and open the game layout screen
              setGmTestingLevel(1);
            }}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black tracking-widest px-4 py-2.5 rounded-xl uppercase shadow-lg shadow-amber-500/15 transition-all"
          >
            🎮 Play / Test Puzzle #1
          </button>
        </div>

      {/* --- PLAYER DATABASE GRID MAP --- */}
      <div className="space-y-4">
        {players.map((p) => {
          // Skip showing the Game Master to themselves in the list
          if (p.role === 'hint giver') return null;

          return (
            <div 
              key={p.id} 
              className={`p-4 rounded-2xl border transition-all ${
                p.is_kidnapped 
                  ? 'bg-rose-950/40 border-rose-500/40 shadow-md shadow-rose-500/5' 
                  : p.is_paused 
                    ? 'bg-purple-950/40 border-purple-500/40'
                    : 'bg-slate-900/60 border-white/5'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-lg">
                    {p.character_name} <span className="text-xs text-gray-500 font-normal">({p.player_name || 'Guest'})</span>
                  </h4>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-amber-400 font-semibold uppercase">{p.role || 'Unassigned'}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">Bravery: <strong>{p.minigame_count || 0} PTS</strong></span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1 text-xs">
  <span className="text-amber-400 font-semibold uppercase">{p.role || 'Unassigned'}</span>
  <span className="text-gray-500">•</span>
  <span className="text-gray-400">Bravery: <strong>{p.minigame_count || 0} PTS</strong></span>
</div>

                {/* 🔮 RESPONSIVE CONTROLS PANEL FOR THIEVES ONLY */}
                {p.role === 'thief' && (
                  <div className="mt-3 bg-black/30 p-3 rounded-xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-left">
                      <span className="text-emerald-400 font-mono font-black uppercase tracking-widest block text-[9px]">
                        Syndicate Track Feed
                      </span>
                      <p className="text-slate-300 font-medium text-sm mt-0.5">
                        Current Crystal Active: <strong className="text-white font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Phase {p.thief_number || 1}</strong>
                      </p>
                    </div>
                    
                    {/* Grid forces the buttons to look balanced and be full-width on phone viewports */}
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-1.5">
                      <button
                        onClick={() => updateThiefHintLevel(p.id, p.thief_number, 'prev')}
                        className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs sm:text-[10px] font-black px-3 py-2 sm:py-1 rounded-md uppercase text-center transition-all border border-white/5"
                      >
                        ◀ Back
                      </button>
                      <button
                        onClick={() => updateThiefHintLevel(p.id, p.thief_number, 'next')}
                        className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-[10px] font-black px-3 py-2 sm:py-1 rounded-md uppercase tracking-wider text-center transition-all shadow-md shadow-emerald-600/10"
                      >
                        Advance ▶
                      </button>
                    </div>
                  </div>
                )}

                {/* 🛠️ SYSTEM TIME DEBUGGER CONTROLS */}
<div className="mt-3 bg-slate-950/40 p-2.5 rounded-xl border border-dashed border-amber-500/20 flex items-center justify-between gap-2">
  <div className="text-left text-[10px] font-mono">
    <span className="text-amber-500 block uppercase font-bold">⏱️ Clock Debugger</span>
    <span className="text-slate-400">
      Target: {p.next_game_at ? new Date(p.next_game_at).toLocaleTimeString() : 'STOPPED'}
    </span>
  </div>
  
  <div className="flex gap-1">
    {/* TEST BUTTON 1: Force game to happen instantly */}
    <button
      onClick={async () => {
        // Set their database target time to 10 seconds ago so their phone triggers a game layout jump immediately
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        await supabase
          .from('player')
          .update({ next_game_at: tenSecondsAgo, game_timer_status: 'active_countdown' })
          .eq('id', p.id);
      }}
      className="bg-amber-600/20 hover:bg-amber-500 hover:text-slate-950 text-[9px] font-mono font-bold px-2 py-1 rounded text-amber-400 transition-all"
    >
      ⚡ Force Game Now
    </button>

    {/* TEST BUTTON 2: Simulate complete loop cycle */}
    <button
      onClick={async () => {
        // Simulates what happens when they complete a game: sets time forward 10 minutes
        const tenMinutesFromNow = new Date(Date.now() + 10 * 60000).toISOString();
        await supabase
          .from('player')
          .update({ next_game_at: tenMinutesFromNow, game_timer_status: 'active_countdown' })
          .eq('id', p.id);
      }}
      className="bg-blue-600/20 hover:bg-blue-500 text-blue-400 text-[9px] font-mono font-bold px-2 py-1 rounded transition-all"
    >
      ⏩ Fast-Forward 10m
    </button>
  </div>
</div>


                {/* Status Badges */}
                <div className="flex gap-1.5">
                  {p.is_kidnapped && (
                    <span className="bg-red-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Kidnapped</span>
                  )}
                  {p.is_paused && (
                    <span className="bg-purple-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Frozen</span>
                  )}
                </div>
              </div>

              {/* --- ACTION GRID CONTROLS --- */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5">
                
                {/* 1. Puzzle Injection Control */}
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => triggerMinigame(p.id, 1)}
                    className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-black uppercase text-gray-300 py-1.5 px-2 rounded-lg transition-all"
                  >
                    🚀 Trigger Puzzle
                  </button>
                </div>

                {/* 2. Kidnapping Toggle Action */}
                <button 
                  onClick={() => toggleKidnap(p.id, p.is_kidnapped)}
                  className={`text-[11px] font-black uppercase py-1.5 px-2 rounded-lg transition-all ${
                    p.is_kidnapped 
                      ? 'bg-rose-500 text-black font-bold' 
                      : 'bg-slate-800 hover:bg-rose-600 text-gray-300'
                  }`}
                >
                  {p.is_kidnapped ? '🔓 Release' : '👺 Kidnap'}
                </button>

                {/* 3. Freeze Status Intercept */}
                <button 
                  onClick={() => freezePlayer(p.id)}
                  disabled={p.is_paused}
                  className="bg-slate-800 hover:bg-purple-600 disabled:opacity-30 text-[11px] font-black uppercase text-gray-300 py-1.5 px-2 rounded-lg transition-all"
                >
                  🥶 Freeze (5m)
                </button>

                {/* 4. Complete Status Cleanup Reset */}
                <button 
                  onClick={() => resetPlayer(p.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-[11px] font-black uppercase text-gray-400 hover:text-white py-1.5 px-2 rounded-lg transition-all"
                >
                  🔄 Reset Status
                </button>

              </div>
            </div>
          );
        })}
      </div>
                   {/* 🧩 ENHANCED GM PUZZLE TESTING SUITE */}
      {/* UPDATE THIS BLOCK AT THE ABSOLUTE BOTTOM OF HINT_GIVER.JSX */}
        {gmTestingLevel > 0 && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col pt-16">
            
            {/* Admin Command Strip across the top of your test screen */}
            <div className="bg-slate-900 border-b border-white/10 p-3 flex justify-between items-center px-6">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black uppercase">GM Debug</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Testing Level {gmTestingLevel} / 20</h4>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const current = gmTestingLevel;
                    setGmTestingLevel(0);
                    setTimeout(() => setGmTestingLevel(current), 10);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all"
                >
                  🔄 Reset Map
                </button>

                <button 
                  onClick={() => {
                    if (gmTestingLevel < 20) {
                      setGmTestingLevel(prev => prev + 1);
                    } else {
                      setGmTestingLevel(0);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all"
                >
                  ⏩ Skip Level
                </button>

                {/* Emergency Close window helper */}
                <button 
                  onClick={() => setGmTestingLevel(0)}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* The gameplay viewport area */}
            <div className="flex-1 relative bg-slate-950">
              <MinigameOverlay 
                minigameId={gmTestingLevel} 
                userId={currentGmId} 
                onComplete={() => {
                  if (gmTestingLevel < 20) {
                    setGmTestingLevel(prev => prev + 1);
                  } else {
                    setGmTestingLevel(0);
                  }
                }} 
                // 💥 ADD THIS NEW TRACKING HOOK PROP RIGHT HERE:
                onExit={() => setGmTestingLevel(0)} 
              />
            </div>

          </div>
        )}

    </div>
  );
}

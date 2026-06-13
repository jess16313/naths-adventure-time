import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function HintGiver({ currentGmId }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch full user registry to populate target selections
  const fetchAllPlayers = async () => {
    let { data } = await supabase
      .from('player')
      .select('*')
      .order('character_name', { ascending: true });
    if (data) setPlayers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllPlayers();

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
    let cleanLevel = currentLevel !== null && currentLevel !== undefined ? Number(currentLevel) : 1;
    if (isNaN(cleanLevel)) cleanLevel = 1;

    let nextLevel = action === 'next' ? cleanLevel + 1 : cleanLevel - 1;
    if (nextLevel < 1) nextLevel = 1;

    const { error } = await supabase
      .from('player')
      .update({ thief_number: nextLevel })
      .eq('id', playerId);

    if (error) {
      alert(`Database Error: ${error.message}`);
    }
  };

  const initializeGlobalGameTimer = async () => {
    // Calculate exactly 15 minutes from the exact millisecond of clicking
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60000).toISOString();

    try {
      // 1. First update the GM profile row itself so it has a reference point
      await supabase
        .from('player')
        .update({ game_timer_status: 'active' })
        .eq('id', currentGmId);

      // 2. 🛠️ FIXED: Target rows where the ID is greater than 0. 
      // This satisfies Supabase's "WHERE clause" requirement while still applying it to everyone!
      const { error } = await supabase
        .from('player')
        .update({ 
          next_game_at: fifteenMinutesFromNow, 
          game_timer_status: 'waiting_initial' 
        })
        .gt('id', 0); // Triggers a safe "where id > 0" filter matching all valid database records

      if (error) {
        alert("Failed to initialize system clock: " + error.message);
      } else {
        alert("🚀 Master Match Clock Initialized! First wave of minigames triggers in exactly 15 minutes.");
      }
    } catch (err) {
      alert("System Exception: " + err.message);
    }
  };


  const togglePlayerStatusFlag = async (playerId, currentStatus, columnName) => {
    try {
      const { error } = await supabase
        .from('player')
        .update({ [columnName]: !currentStatus }) // Dynamically targets the specific column clicked
        .eq('id', playerId);

      if (error) {
        alert(`Failed to update ${columnName}: ` + error.message);
      }
    } catch (err) {
      alert("System Exception: " + err.message);
    }
  };


  const triggerMinigame = async (playerId, levelId) => {
    await supabase.from('player').update({ current_active_minigame: levelId }).eq('id', playerId);
  };

  const toggleKidnap = async (playerId, currentStatus) => {
    await supabase.from('player').update({ is_kidnapped: !currentStatus }).eq('id', playerId);
  };

  const freezePlayer = async (playerId) => {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60000).toISOString();
    await supabase.from('player').update({ is_paused: true, paused_until: fiveMinutesFromNow }).eq('id', playerId);
  };

  const resetPlayer = async (playerId) => {
    await supabase.from('player').update({ is_paused: false, paused_until: null, is_kidnapped: false, game_timer_status: null, next_game_at: null, current_active_minigame: null }).eq('id', playerId);
  };

  if (loading) return <div className="text-amber-500 font-mono text-center">Loading Tactical Command Feed...</div>;

  const gmRow = players.find(p => p.id === currentGmId);
  const isGameRunning = players.some(p => p.game_timer_status === 'waiting_initial' || p.game_timer_status === 'active');

  return (
    <div className="space-y-6 text-gray-200 animate-fadeIn">
      {/* 🛠️ GLOBAL SYSTEM CONTROLS CARD BANNER */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-mono font-black text-amber-400 uppercase tracking-widest">// Administrative Mainframe Controls</h3>
          <p className="text-xs text-gray-400 mt-1">Initialize or force cycle status elements globally over active connections.</p>
        </div>

        <button
          onClick={initializeGlobalGameTimer}
          disabled={isGameRunning}
          className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all text-center border ${
            isGameRunning 
              ? 'bg-slate-800 text-gray-500 border-white/5 cursor-not-allowed' 
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10'
          }`}
        >
          {isGameRunning ? "🔒 Neural Game Loop Active" : "🚀 Start Global 15-Min Match Countdown"}
        </button>
      </div>

      {/* 👥 PLAYER FEED DASHBOARD VIEW LIST */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-1">Active Client Network Node Registry</h4>
        {players.map((p) => {
          if (p.id === currentGmId) return null;
          const roleLower = p.role?.toLowerCase();

          return (
            <div key={p.id} className={`p-4 rounded-xl border transition-all ${p.is_kidnapped ? 'bg-red-950/20 border-red-500/30' : 'bg-black/30 border-white/5'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-white uppercase text-sm">{p.character_name} <span className="text-[10px] text-gray-500 font-mono normal-case">({p.player_name || 'Guest'})</span></h5>
                  <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Role: {p.role || 'Unassigned'} | Pts: {p.minigame_count || 0}</p>
                  
                  {/* Status Badges */}
                                    {/* Status Badges Row */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.is_kidnapped && <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">👺 Kidnapped</span>}
                    {p.is_paused && <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">🧊 Frozen</span>}
                    {p.current_active_minigame && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase animate-bounce">🎮 In Minigame ({p.current_active_minigame})</span>}
                    {p.game_timer_status === 'waiting_initial' && <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">⏳ Waiting Match Start</span>}
                    
                    {/* Live Tracker Indicators for Endgame Loops */}
                    {p.has_all_crystals && <span className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">💎 Has Crystals</span>}
                    {p.has_solved_cypher && <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">🔑 Cypher Cleared</span>}
                  </div>
                </div>

                {/* Individual Actions grid wrapper dropdown block button */}
                <div className="flex flex-col gap-1.5 text-right">
                  {roleLower === 'thief' && (
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 mb-1 justify-end">
                      <span className="text-[9px] font-mono text-gray-400 uppercase mr-1">Hint Level:</span>
                      <button onClick={() => updateThiefHintLevel(p.id, p.thief_number, 'prev')} className="bg-slate-800 text-white px-2 py-0.5 rounded font-black text-xs hover:bg-slate-700">-</button>
                      <span className="font-mono text-xs font-bold text-amber-400 min-w-[16px] text-center">{p.thief_number || 1}</span>
                      <button onClick={() => updateThiefHintLevel(p.id, p.thief_number, 'next')} className="bg-slate-800 text-white px-2 py-0.5 rounded font-black text-xs hover:bg-slate-700">+</button>
                    </div>
                  )}
                </div>
              </div>

              {/* 🛠️ UPDATED: Action Buttons Matrix Footbar containing our easy toggle triggers */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                
                {/* Toggle 1: All Crystals Status */}
                <button 
                  onClick={() => togglePlayerStatusFlag(p.id, p.has_all_crystals, 'has_all_crystals')}
                  className={`text-[10px] font-black uppercase py-2 rounded-xl transition-all border ${
                    p.has_all_crystals 
                      ? 'bg-teal-600 border-teal-400 text-white shadow-md shadow-teal-600/10' 
                      : 'bg-slate-800 border-white/5 text-gray-400 hover:border-white/10 hover:bg-slate-700'
                  }`}
                >
                  {p.has_all_crystals ? "💎 Crystals: Collected" : "💎 Give Cypher (Got Crystals)"}
                </button>

                {/* Toggle 2: Solved Cypher Status */}
                <button 
                  onClick={() => togglePlayerStatusFlag(p.id, p.has_solved_cypher, 'has_solved_cypher')}
                  className={`text-[10px] font-black uppercase py-2 rounded-xl transition-all border ${
                    p.has_solved_cypher 
                      ? 'bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-600/10' 
                      : 'bg-slate-800 border-white/5 text-gray-400 hover:border-white/10 hover:bg-slate-700'
                  }`}
                >
                  {p.has_solved_cypher ? "🔑 Cypher: Decoded" : "🔑 Unlock Final Riddle Video"}
                </button>

              </div>

              {/* Rest of administrative options panel (Force Game, Kidnap, Freeze, etc) */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <button onClick={() => triggerMinigame(p.id, (p.minigame_count || 0) + 1)} className="bg-slate-900 border border-white/5 hover:bg-emerald-600 text-[9px] font-bold uppercase py-1.5 rounded transition-all">Force Game</button>
                <button onClick={() => toggleKidnap(p.id, p.is_kidnapped)} className="bg-slate-900 border border-white/5 hover:bg-red-600 text-[9px] font-bold uppercase py-1.5 rounded transition-all">{p.is_kidnapped ? "Release" : "Kidnap"}</button>
                <button onClick={() => freezePlayer(p.id)} className="bg-slate-900 border border-white/5 hover:bg-purple-600 text-[9px] font-bold uppercase py-1.5 rounded transition-all">Freeze 5m</button>
                <button onClick={() => resetPlayer(p.id)} className="bg-slate-950 border border-white/5 hover:bg-rose-900 text-[9px] font-bold uppercase py-1.5 rounded transition-all text-gray-500">Reset All</button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

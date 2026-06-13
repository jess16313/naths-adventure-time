import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Interrogator({ completedCount }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // 📊 CHANGED: Updated maximum sabotage capacity pool limit up to 7 points
  const totalSabotageBank = 7;
  const [sabotageSpent, setSabotageSpent] = useState(0);
  const [secretsCount, setSecretsCount] = useState(0);

  // 🧠 CHANGED: Formatted tracking thresholds accurately for levels 3 and 7
  const interrogationsEarned = completedCount >= 8 ? 2 : completedCount >= 4 ? 1 : 0;


  const fetchGameTelemetry = async () => {
    let { data } = await supabase
      .from('player')
      .select('*')
      .order('character_name', { ascending: true });

    if (data) {
      setPlayers(data);
      
      // Locate the current logged-in interrogator profile directly within the synchronized registry packet
      const self = data.find(p => p.role?.toLowerCase() === 'interrogator');
      if (self) {
        setSabotageSpent(self.dynamic_sabotage_spent || 0);
        setSecretsCount(self.secrets_unlocked_count || 0);
      }
    }
    setLoading(false);
  };

  // ⚡ FIXED REALTIME SUBSCRIPTION EFFECT: Listens reliably without dropping frame state render triggers
  useEffect(() => {
    fetchGameTelemetry();

    const channel = supabase
      .channel('interrogator_global_sync')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'player' 
        }, 
        () => {
          fetchGameTelemetry(); // Clean recalculation pull for all network updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array ensures subscription channel isolates cleanly on mount

  // --- INTERACTION ACTION HANDLERS ---
  const handleSecretInterrogation = async (player) => {
    if (secretsCount >= interrogationsEarned) return;

    // Open dossier visibility display modal window card layout locally
    setSelectedPlayer(player);

    const self = players.find(p => p.role?.toLowerCase() === 'interrogator');
    if (self) {
      const nextSecretCount = (self.secrets_unlocked_count || 0) + 1;
      
      // Optimistic Local UI Update to prevent latency desync display delays
      setSecretsCount(nextSecretCount);

      await supabase
        .from('player')
        .update({ secrets_unlocked_count: nextSecretCount })
        .eq('id', self.id);
    }
  };

  const executeSabotage = async (targetId, currentPoints) => {
    if (sabotageSpent >= totalSabotageBank) {
      alert("Operational Block: You've used all your manipulation tactics. Now focus on solving riddles!");
      return;
    }
    if (currentPoints <= 0) return;

    const self = players.find(p => p.role?.toLowerCase() === 'interrogator');
    if (self) {
      const nextSabotageSpent = (self.dynamic_sabotage_spent || 0) + 1;
      
      // Optimistic Local UI Update to keep screens accurately rendering immediately when pressed
      setSabotageSpent(nextSabotageSpent);

      // 1. Deduct 1 point from target player's minigame counter score balance safely
      await supabase
        .from('player')
        .update({ minigame_count: Math.max(0, currentPoints - 1) })
        .eq('id', targetId);

      // 2. Increment Interrogator's spent tally counter bucket row record column
      await supabase
        .from('player')
        .update({ dynamic_sabotage_spent: nextSabotageSpent })
        .eq('id', self.id);
    }
  };

  if (loading) return <div className="text-emerald-400 font-mono text-center">Booting Interrogation Grid Matrix...</div>;

  return (
    <div className="space-y-6 animate-fadeIn text-gray-200">
      {/* 📊 SABOTAGE BANK TRACKER HUD PANEL */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-mono font-black text-gray-400 uppercase">Bravery Sabotage Pool</h4>
          <span className="text-2xl font-black text-rose-400 tracking-wider block mt-0.5">
            {Math.max(0, totalSabotageBank - sabotageSpent)} / {totalSabotageBank} PTS REMAINING
          </span>
        </div>
        <span className="text-xs font-mono bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full font-bold uppercase">Active Bank</span>
      </div>

      {/* 🧠 SECRET INTEL REVEAL CREDIT METER TRACKER */}
      <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-mono font-black text-gray-400 uppercase">Interrogations Discovered</h4>
          <span className="text-lg font-bold text-sky-400 block mt-0.5">
            {secretsCount} / {interrogationsEarned} Actions Executed
          </span>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">
            Earned automatically at Levels 4 and 8 (Your Level: {completedCount})
          </p>
        </div>
        <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold uppercase ${interrogationsEarned > secretsCount ? 'bg-sky-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-gray-500'}`}>
          {interrogationsEarned > secretsCount ? '⚠️ Core Ready' : 'Standby'}
        </span>
      </div>

      {/* TARGET LIST CONTAINER STACK */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-1">Player Assessment Feed</h4>
        {players.map((p) => {
          const roleLower = p.role?.toLowerCase();
          if (roleLower === 'interrogator' || roleLower === 'hint giver') return null;

          return (
            <div key={p.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h5 className="font-bold text-white text-md uppercase tracking-wide">{p.character_name}</h5>
                <span className="text-xs text-gray-400 block font-mono mt-0.5">
                  Current Bravery: <strong className="text-gray-200">{p.minigame_count || 0} PTS</strong>
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {/* INTERROGATION RADIAL RADAR BUTTON */}
                <button 
                  disabled={secretsCount >= interrogationsEarned} 
                  onClick={() => handleSecretInterrogation(p)} 
                  className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 disabled:opacity-20 disabled:hover:bg-sky-600 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                >
                  Uncover Player Role
                </button>
                <button 
                  disabled={sabotageSpent >= totalSabotageBank || (p.minigame_count || 0) <= 0} 
                  onClick={() => executeSabotage(p.id, p.minigame_count || 0)} 
                  className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-500 disabled:opacity-20 disabled:hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                >
                  Remove -1 PT
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== 🧐 SECRET ROLE INVESTIGATION DOSSIER INTERRUPT MODAL POPUP ============================================================== */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs border-2 border-sky-500/30 bg-slate-900 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-scaleUp">
            <h4 className="text-xl font-black text-sky-400 tracking-wider uppercase">SECRET KNOWLEDGE CHAMBER</h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 font-mono block uppercase">Identity Profile :</span>
              <p className="text-white text-lg font-bold tracking-wide uppercase">{selectedPlayer.character_name}</p>
              <span className="text-xs font-black bg-amber-500/10 text-amber-400 px-3 py-0.5 rounded-full inline-block uppercase tracking-widest mt-1"> 
                True Role: {selectedPlayer.role || 'Unassigned'} 
              </span>
            </div>
            <button 
              onClick={() => setSelectedPlayer(null)} 
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2.5 rounded-xl uppercase tracking-widest text-xs transition-all" 
            >
              Burn Dossier & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

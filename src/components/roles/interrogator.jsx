import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Interrogator({ completedCount }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Tracking local variables derived from the prop and db schema counters
  const totalSabotageBank = 15;
  const [sabotageSpent, setSabotageSpent] = useState(0);
  const [secretsCount, setSecretsCount] = useState(0);
  
  // Tracks how many interrogation opportunities have been earned mathematically
  const interrogationsEarned = completedCount >= 7 ? 2 : completedCount >= 3 ? 1 : 0;

  useEffect(() => {
    // 1. Fetch full user registry to populate target selections
    const fetchGameTelemetry = async () => {
      let { data } = await supabase.from('player').select('*').order('character_name', { ascending: true });
      if (data) {
        setPlayers(data);
        // Find current logged in interrogator's data structure inside the packet to set limits
        const self = data.find(p => p.role === 'Interrogator' || p.role === 'interrogator');
        if (self) {
          setSabotageSpent(self.dynamic_sabotage_spent || 0);
          setSecretsCount(self.secrets_unlocked_count || 0);
        }
      }
      setLoading(false);
    };

    fetchGameTelemetry();

    const channel = supabase
      .channel('interrogator_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player' }, () => {
        fetchGameTelemetry();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [completedCount]);

  // --- INTERACTION ACTION HANDLERS ---
  const handleSecretInterrogation = async (player) => {
    if (secretsCount >= interrogationsEarned) return;

    // Reveal role locally to the user in a pop-up state trigger card
    setSelectedPlayer(player);

    // Update database to note that an investigation credit slot has been consumed
    const { data: self } = await supabase.from('player').select('id, secrets_unlocked_count').or('role.eq.Interrogator,role.eq.interrogator').single();
    if (self) {
      await supabase
        .from('player')
        .update({ secrets_unlocked_count: (self.secrets_unlocked_count || 0) + 1 })
        .eq('id', self.id);
    }
  };

  const executeSabotage = async (targetId, currentPoints) => {
    if (sabotageSpent >= totalSabotageBank) return;
    if (currentPoints <= 0) return;

    // Deduct 1 point from target player's minigame counter score balance
    await supabase.from('player').update({ minigame_count: Math.max(0, currentPoints - 1) }).eq('id', targetId);

    // Increment Interrogator's spent tally counter bucket row record column
    const { data: self } = await supabase.from('player').select('id, dynamic_sabotage_spent').or('role.eq.Interrogator,role.eq.interrogator').single();
    if (self) {
      await supabase
        .from('player')
        .update({ dynamic_sabotage_spent: (self.dynamic_sabotage_spent || 0) + 1 })
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
          <span className="text-2xl font-black text-rose-400 tracking-wider">
            {totalSabotageBank - sabotageSpent} / {totalSabotageBank} PTS REMAINING
          </span>
        </div>
        <span className="text-xs font-mono bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full font-bold uppercase">Active Bank</span>
      </div>

      {/* 🧠 SECRET INTEL REVEAL CREDIT METER TRACKER */}
      <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-mono font-black text-gray-400 uppercase">Interrogations Discovered</h4>
          <span className="text-lg font-bold text-sky-400">
            {secretsCount} / {interrogationsEarned} Actions Executed
          </span>
          <p className="text-[10px] text-gray-500 mt-0.5">Earned automatically at Levels 3 and 7 (Your Level: {completedCount + 1})</p>
        </div>
        <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold uppercase ${interrogationsEarned > secretsCount ? 'bg-sky-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-gray-500'}`}>
          {interrogationsEarned > secretsCount ? '⚠️ Core Ready' : 'Standby'}
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-1">Target Assessment Feed</h4>
        
        {players.map((p) => {
          if (p.role === 'Interrogator' || p.role === 'interrogator' || p.role === 'hint giver' || p.role === 'Hint Giver') return null;

          return (
            <div key={p.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h5 className="font-bold text-white text-md uppercase tracking-wide">{p.character_name}</h5>
                <span className="text-xs text-gray-400 block font-mono">Current Bravery: <strong className="text-gray-200">{p.minigame_count || 0} PTS</strong></span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* INTERROGATION RADIAL RADAR BUTTON */}
                <button
                  disabled={secretsCount >= interrogationsEarned}
                  onClick={() => handleSecretInterrogation(p)}
                  className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 disabled:opacity-20 disabled:hover:bg-sky-600 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                >
                  🔍 Assess Role
                </button>

                {/* SABOTAGE POINT DEDUCTION ACTION TRIGGER BUTTON */}
                <button
                  disabled={sabotageSpent >= totalSabotageBank || (p.minigame_count || 0) <= 0}
                  onClick={() => executeSabotage(p.id, p.minigame_count || 0)}
                  className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-500 disabled:opacity-20 disabled:hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                >
                  💥 Siphon -1 PT
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==============================================================
          🧐 SECRET ROLE INVESTIGATION DOSSIER INTERRUPT MODAL POPUP
          ============================================================== */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs border-2 border-sky-500/30 bg-slate-900 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-scaleUp">
            <span className="text-5xl block animate-pulse">🕵️‍♂️</span>
            <h4 className="text-xl font-black text-sky-400 tracking-wider uppercase">INTELLIGENCE LOGGED</h4>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 font-mono block uppercase">Identity Profile Snapshot:</span>
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

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Kidnapper({ currentGmId }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('interviews'); // 'interviews' or 'accusations'
  
  // Game states
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTarget, setActiveTarget] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);

  // Selection states for accusations
  const [suspectedThieves, setSuspectedThieves] = useState([]);
  const [accusationResult, setAccusationResult] = useState(null);

  // Fetch data on mount and listen to changes
  useEffect(() => {
    const fetchKidnapperData = async () => {
      let { data } = await supabase.from('player').select('*').order('character_name', { ascending: true });
      if (data) {
        setPlayers(data);
        
        // Locate kidnapper profile records to cache current actions
        const self = data.find(p => p.role === 'Kidnapper' || p.role === 'kidnapper');
        if (self) {
          if (self.active_interview_target_id) {
            const currentKidnapped = data.find(p => p.id === self.active_interview_target_id);
            setActiveTarget(currentKidnapped);
          } else {
            setActiveTarget(null);
          }
          
          // Parse historical comma-separated array strings safely
          const pastIds = self.history_interview_ids 
            ? self.history_interview_ids.split(',').map(id => parseInt(id, 10)) 
            : [];
          setInterviewHistory(pastIds);
        }
      }
      setLoading(false);
    };

    fetchKidnapperData();

    const channel = supabase
      .channel('kidnapper_live_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player' }, () => {
        fetchKidnapperData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- ACTIONS ENGINE HANDLERS ---
  const handleStartInterview = async (player) => {
    const confirmChoice = window.confirm(`Are you absolutely sure you want to capture and interview ${player.character_name}? Remember, you can only capture each target ONCE.`);
    if (!confirmChoice) return;

    // 1. Lock the target's app and set their kidnapping status flag to true
    await supabase.from('player').update({ is_kidnapped: true }).eq('id', player.id);

    // 2. Set the kidnapper's active target tracker pointer
    const { data: self } = await supabase.from('player').select('id, history_interview_ids').or('role.eq.Kidnapper,role.eq.kidnapper').single();
    if (self) {
      const updatedHistory = self.history_interview_ids 
        ? `${self.history_interview_ids},${player.id}` 
        : `${player.id}`;

      await supabase
        .from('player')
        .update({ 
          active_interview_target_id: player.id,
          history_interview_ids: updatedHistory
        })
        .eq('id', self.id);
    }
  };

  const handleEndInterview = async () => {
    if (!activeTarget) return;
    const confirmRelease = window.confirm(`Are you sure you want to conclude the interview and release ${activeTarget.character_name}?`);
    if (!confirmRelease) return;

    // 1. Release target and resume their normal timer loops
    await supabase.from('player').update({ is_kidnapped: false }).eq('id', activeTarget.id);

    // 2. Clear out active target pointer on kidnapper record
    const { data: self } = await supabase.from('player').select('id').or('role.eq.Kidnapper,role.eq.kidnapper').single();
    if (self) {
      await supabase
        .from('player')
        .update({ active_interview_target_id: null })
        .eq('id', self.id);
    }
  };

  const toggleThiefSelection = (playerId) => {
    setSuspectedThieves((prev) => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleVerifyAccusation = () => {
    if (suspectedThieves.length !== 4) return;

    // Find the true Thieves in our pulled guest array roster data
    const trueThievesIds = players
      .filter(p => p.role === 'Thief' || p.role === 'thief')
      .map(p => p.id);

    // Check if every single selected ID matches a true thief
    const isPerfectMatch = suspectedThieves.every(id => trueThievesIds.includes(id));

    if (isPerfectMatch) {
      setAccusationResult('SUCCESS');
    } else {
      // Find how many they got right (Mastermind logic challenge)
      const correctCount = suspectedThieves.filter(id => trueThievesIds.includes(id)).length;
      setAccusationResult(`FAIL:${correctCount}`);
    }
  };

  if (loading) return <div className="text-amber-500 font-mono text-center">Booting Kidnapper Control Interface...</div>;

  return (
    <div className="space-y-6 text-gray-200 animate-fadeIn">
      
      {/* 🧭 NAVIGATION TAB CARD HEADER BAR */}
      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
        <button 
          onClick={() => setActiveTab('interviews')}
          className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'interviews' ? 'bg-amber-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'}`}
        >
          🕵️‍♂️ Interviews Room
        </button>
        <button 
          disabled={activeTarget !== null}
          onClick={() => setActiveTab('accusations')}
          className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-20 ${activeTab === 'accusations' ? 'bg-amber-500 text-slate-950 font-black' : 'text-gray-400 hover:text-white'}`}
        >
          🗡️ Final Accusations ({suspectedThieves.length}/4)
        </button>
      </div>

      {/* ==============================================================
          🔴 TAB 1: INTERVIEWS INTERFACE MODE
          ============================================================== */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          
          {/* Active Interview Status Banner Tracker */}
          {activeTarget ? (
            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-5 text-center space-y-3 animate-pulse">
              <span className="text-4xl block">👺</span>
              <h4 className="text-lg font-black text-red-400 uppercase tracking-wider">INTERVIEW RUNNING IN THE NIGHTOSPHERE</h4>
              <p className="text-xs text-gray-300">
                You are currently holding <strong>{activeTarget.character_name}</strong>. Their app game timer is paused.
              </p>
              <button
                onClick={handleEndInterview}
                className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase py-2.5 rounded-xl transition-all"
              >
                🔓 Conclude Interview & Release Player
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl text-center text-xs text-gray-400">
              ⚡ All interrogation modules open. Select a guest below to trap their terminal and start an interview session.
            </div>
          )}

          {/* Player Feed Select Stack */}
          {!activeTarget && (
            <div className="space-y-2">
              <h5 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Available Targets</h5>
              {players.map((p) => {
                if (p.role === 'Kidnapper' || p.role === 'kidnapper' || p.role === 'hint giver' || p.role === 'Hint Giver') return null;
                
                const alreadyInterviewed = interviewHistory.includes(p.id);

                return (
                  <div key={p.id} className={`bg-black/20 border border-white/5 p-3 rounded-xl flex justify-between items-center ${alreadyInterviewed ? 'opacity-30' : ''}`}>
                    <div>
                      <span className="font-bold block text-sm uppercase tracking-wide">{p.character_name}</span>
                      <span className="text-[10px] text-gray-500">{alreadyInterviewed ? 'Previously Investigated' : 'Ready'}</span>
                    </div>
                    
                    <button
                      disabled={alreadyInterviewed}
                      onClick={() => handleStartInterview(p)}
                      className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-0 disabled:pointer-events-none text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    >
                      ⛓️ Intercept
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          🔵 TAB 2: ACCUSATIONS INTERFACE MODE (Only open if not holding anyone)
          ============================================================== */}
      {activeTab === 'accusations' && !activeTarget && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            Select the 4 characters you suspect are the true secret Thieves. Your selection grid will feed diagnostic feedback matching core Mastermind mechanics puzzle algorithms.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => {
              if (p.role === 'Kidnapper' || p.role === 'kidnapper' || p.role === 'hint giver' || p.role === 'Hint Giver') return null;
              
              const isSelected = suspectedThieves.includes(p.id);

              return (
                <button
                  key={p.id}
                  onClick={() => toggleThiefSelection(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs font-bold uppercase tracking-wide flex justify-between items-center ${isSelected ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md' : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/10'}`}
                >
                  <span>{p.character_name}</span>
                  {isSelected && <span>✓</span>}
                </button>
              );
            })}
          </div>

          <button
            disabled={suspectedThieves.length !== 4}
            onClick={handleVerifyAccusation}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-98 disabled:opacity-20 text-slate-950 font-black tracking-widest py-3 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/10 transition-all mt-4"
          >
            🔥 Execute Override Judgment
          </button>

          {/* ==============================================================
              📢 INTERACTIVE OVERRIDE RESULTS FEEDBACK BOX
              ============================================================== */}
          {accusationResult && (
            <div className="mt-4 animate-scaleUp">
              {accusationResult === 'SUCCESS' ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-2">
                  <span className="text-4xl block animate-bounce">🏆</span>
                  <h4 className="text-xl font-black text-emerald-400 tracking-widest uppercase">JUDGMENT CORROBORATED</h4>
                  <p className="text-xs text-gray-300">You identified all 4 thieves perfectly! Here are the last two numbers of your code sequence:</p>
                  <p className="font-mono text-3xl text-white tracking-widest bg-black/60 py-2 rounded-xl border border-emerald-500/20 font-black">
                    XX-19
                  </p>
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-xl text-center">
                  <span className="text-xl block">❌</span>
                  <h4 className="text-sm font-black text-rose-400 uppercase tracking-wider mt-1">JUDGMENT ERROR DETECTED</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Your assessment group contains exactly <strong className="text-white text-sm px-1 font-mono">{accusationResult.split(':')[1]}</strong> correct Thief profiles. Keep searching!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

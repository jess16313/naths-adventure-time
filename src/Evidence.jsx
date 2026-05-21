import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function EvidencePage({ currentCharacter }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(currentCharacter.hints_used || 0);
  const [activeHint, setActiveHint] = useState(null);

  // 1. FETCH & LISTEN TO EVIDENCE CHANGES (REALTIME)
  useEffect(() => {
    fetchEvidence();

    // Listen for updates from the host panel live!
    const sub = supabase
      .channel('evidence-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evidence' }, () => {
        fetchEvidence();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const fetchEvidence = async () => {
    const { data } = await supabase.from('evidence').select('*').order('id', { ascending: true });
    if (data) setEvidenceList(data);
  };

  // 2. REVEAL HINT LOGIC
  const handleRevealHint = async (evidenceId, hintNum, hintText) => {
    if (hintsUsed >= 6) {
      alert("⚠️ Maximum hint limit reached! Your detective team must solve the rest alone.");
      return;
    }

    const nextHintCount = hintsUsed + 1;
    setHintsUsed(nextHintCount);
    setActiveHint(hintText);

    // Update the player's counter in Supabase
    await supabase.from('players').update({ hints_used: nextHintCount }).eq('id', currentCharacter.id);
  };

  const isDetective = currentCharacter.role !== 'murderer';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">Evidence Vault</h1>
          <p className="text-xs text-slate-500 mt-1">Uncover all 8 pieces of evidence to open final voting.</p>
        </div>
        {isDetective && (
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
            <p className="text-[9px] uppercase font-bold text-slate-500">Hints Spent</p>
            <p className="text-sm font-black text-amber-500">{hintsUsed} / 6</p>
          </div>
        )}
      </div>

      {/* EVIDENCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceList.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                item.is_discovered ? 'bg-indigo-900 text-indigo-400 border border-indigo-700/50' : 'bg-slate-950 text-slate-700 border border-slate-900'
              }`}>
                {item.id}
              </div>
              <h3 className={`text-base font-bold ${item.is_discovered ? 'text-white' : 'text-slate-600 tracking-widest font-mono'}`}>
                {item.is_discovered ? item.evidence_name : '❓❓❓❓❓❓'}
              </h3>
            </div>

            {item.is_discovered ? (
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-900">
                {item.description}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 italic">This evidence has not been recovered yet.</p>
                
                {/* HINTS FOR DETECTIVES ONLY */}
                {isDetective && (
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleRevealHint(item.id, 1, item.hint_1)}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1.5 px-2 rounded-md text-slate-400 border border-slate-700/50"
                    >
                      Hint 1
                    </button>
                    <button 
                      onClick={() => handleRevealHint(item.id, 2, item.hint_2)}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1.5 px-2 rounded-md text-slate-400 border border-slate-700/50"
                    >
                      Hint 2
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* HINT POP-UP MODAL */}
      {activeHint && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-2xl">
            <div className="text-2xl">🕵️‍♂️ Clue Discovered</div>
            <p className="text-sm text-slate-300 font-serif leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900">
              "{activeHint}"
            </p>
            <button onClick={() => setActiveHint(null)} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wide">
              Close File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function EvidencePage({ currentCharacter }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [imposterTeammates, setImposterTeammates] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(currentCharacter.hints_used || 0);
  const [activeHint, setActiveHint] = useState(null);

  const isDetective = currentCharacter.role === 'detective';
  const isImposter = currentCharacter.role === 'imposter';

  // IMPOSTER RULE: Max 2 hints allowed per person total
  const imposterHintsRemaining = Math.max(0, 2 - hintsUsed);

  // 1. FETCH INITIAL DATA ON COMPONENT MOUNT
  useEffect(() => {
    fetchEvidence();
    if (isImposter) {
      fetchImposterTeammates();
    }
  }, []);

  // 2. STABLE FAIL-SAFE REALTIME SUBSCRIPTION
  useEffect(() => {
    let sub = null;
    try {
      const uniqueChannelName = `evidence-room-${Math.random().toString(36).substring(7)}`;
      sub = supabase
        .channel(uniqueChannelName)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evidence' }, (payload) => {
          setEvidenceList((prevList) =>
            prevList.map((item) => (item.id === payload.new.id ? payload.new : item))
          );
        });

      if (sub && typeof sub.subscribe === 'function') {
        sub.subscribe();
      }
    } catch (err) {
      console.warn("Supabase channel collision safely caught & bypassed:", err.message);
    }

    return () => {
      if (sub) {
        supabase.removeChannel(sub).catch(() => {});
      }
    };
  }, []);

  const fetchEvidence = async () => {
    const { data } = await supabase.from('evidence').select('*').order('id', { ascending: true });
    if (data) setEvidenceList(data);
  };

  const fetchImposterTeammates = async () => {
    const { data } = await supabase
      .from('players')
      .select('character_name')
      .eq('role', 'imposter');
    
    if (data) {
      // Filter out self so you only see the other imposters
      setImposterTeammates(data.filter(p => p.character_name !== currentCharacter.character_name));
    }
  };

  // 3. REVEAL HINT LOGIC
  const handleRevealHint = async (evidenceId, hintNum, hintText) => {
    // Detective Rule Enforcement
    if (isDetective && hintsUsed >= 6 && currentCharacter.role !== 'host') {
      alert("⚠️ Maximum hint limit reached! Your detective team must solve the rest alone.");
      return;
    }

    // Imposter Rule Enforcement
    if (isImposter && imposterHintsRemaining <= 0) {
      alert("⚠️ Encryption Limit Reached! You can only use a maximum of 2 hints total.");
      return;
    }

    if (!hintText) {
      alert("🔒 No data found in this clue matrix slot.");
      return;
    }

    const nextHintCount = hintsUsed + 1;
    setHintsUsed(nextHintCount);
    setActiveHint(hintText);

    // Persist to user record counter permanently
    await supabase.from('players').update({ hints_used: nextHintCount }).eq('id', currentCharacter.id);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. IMPOSTER TEAM HEADER PANEL */}
      {isImposter && (
        <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-center space-y-2 animate-fade-in">
          <h3 className="text-[10px] font-black tracking-widest text-red-500 uppercase">
            🚨 Syndicate Communications Open
          </h3>
          <p className="text-xs text-slate-400">Your fellow imposter operatives:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {imposterTeammates.length > 0 ? (
              imposterTeammates.map((teammate, i) => (
                <span key={i} className="bg-red-900/30 text-red-400 px-3 py-1 rounded-md font-mono font-bold text-xs border border-red-900/40">
                  {teammate.character_name}
                </span>
              ))
            ) : (
              <span className="text-xs italic text-slate-500">Working completely solo...</span>
            )}
          </div>
        </div>
      )}

      {/* 2. DYNAMIC CONTROLS DISPLAY HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">Evidence Vault</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isImposter ? "Syndicate Intel Log — 1 Hint Available Per Clue." : "Uncover all pieces of evidence to open final voting."}
          </p>
        </div>

        {/* DETECTIVES COUNTER BANNER */}
        {isDetective && (
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center min-w-[90px]">
            <p className="text-[9px] uppercase font-bold text-slate-500">Hints Spent</p>
            <p className="text-sm font-black text-amber-500">{hintsUsed} / 6</p>
          </div>
        )}

        {/* IMPOSTERS COUNTER BANNER */}
        {isImposter && (
          <div className="bg-red-950/20 border border-red-900/40 p-2 rounded-xl text-center min-w-[90px]">
            <p className="text-[9px] uppercase font-bold text-red-500">Your Hints</p>
            <p className="text-sm font-black text-red-400">{imposterHintsRemaining} / 2 Left</p>
          </div>
        )}
      </div>

      {/* 3. EVIDENCE DISPLAY TILES GRID */}
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
                <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-900">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                  {item.image_url && (
                    <div className="pt-2 border-t border-slate-900 space-y-2">
                      <p className="text-[9px] uppercase font-black tracking-wider text-indigo-400 font-mono">
                        📎 Case File Attachment:
                      </p>
                      

                      {item.image_url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img 
                          src={supabase.storage.from('evidence-files').getPublicUrl(item.image_url).data.publicUrl} 
                          alt={item.evidence_name} 
                          className="w-full h-32 object-cover rounded-lg border border-slate-800 shadow-inner"
                        />
                      ) : null}

                      {/* Universal Document Download/View button for PDFs or general file extensions */}
                      <a 
                          href={supabase.storage.from('evidence-files').getPublicUrl(item.image_url).data.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] uppercase font-bold text-slate-300 px-2.5 py-1.5 rounded-md transition"
                        >
                        📂 Open Full Document / Asset File
                      </a>
                    </div>
                  )}
                </div>
              ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 italic">This evidence has not been recovered yet.</p>
                
                {/* DETECTIVE ROUTING: SEES BOTH HINTS */}
                {isDetective && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleRevealHint(item.id, 1, item.hint_1)} className="flex-1 bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1.5 px-2 rounded-md text-slate-400 border border-slate-700/50" >
                      Hint 1
                    </button>
                    <button onClick={() => handleRevealHint(item.id, 2, item.hint_2)} className="flex-1 bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1.5 px-2 rounded-md text-slate-400 border border-slate-700/50" >
                      Hint 2
                    </button>
                  </div>
                )}

                {/* IMPOSTER ROUTING: SEES ONLY ONE HINT TOTAL PER OBJECT */}
                {isImposter && (
                  <div className="pt-1">
                    <button onClick={() => handleRevealHint(item.id, 1, item.hint_1)} className="w-full bg-red-950/40 hover:bg-red-900/30 text-[10px] uppercase font-bold py-2 px-2 rounded-md text-red-400 border border-red-900/30 tracking-wide transition" >
                      Decrypt Clue Location 👁️
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. MODAL DETAILED EXPANSION DRAWER */}
      {activeHint && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-2xl">
            <div className="text-2xl">{isImposter ? "🕵️‍♂️ Syndicate Intelligence" : "🕵️‍♂️ Clue Discovered"}</div>
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

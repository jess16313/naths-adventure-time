import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function ImposterDash({ currentCharacter }) {
  const [sabotageList, setSabotageList] = useState([]);
  const [hintsViewed, setHintsViewed] = useState(currentCharacter.imposter_hints_viewed || 0);
  const [activeDeception, setActiveDeception] = useState(null);

  useEffect(() => {
    async function fetchSabotageLogs() {
      const { data } = await supabase
        .from('imposter_hints')
        .select('*')
        .order('evidence_id', { ascending: true });
      if (data) setSabotageList(data);
    }
    fetchSabotageLogs();
  }, []);

  const handleRevealDeception = async (hintText) => {
    if (hintsViewed >= 2) {
      alert("⚠️ Operational Limit: You have spent your 2 tactical deception setups!");
      return;
    }

    const nextCount = hintsViewed + 1;
    setHintsViewed(nextCount);
    setActiveDeception(hintText);

    // Save calculation limit back to user profile row cell
    await supabase
      .from('players')
      .update({ imposter_hints_viewed: nextCount })
      .eq('id', currentCharacter.id);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-yellow-500">Sabotage Vault</h1>
          <p className="text-xs text-slate-500 mt-1">Intercepted file slots. Use these scripts to derail detective focus.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
          <p className="text-[9px] uppercase font-bold text-slate-500">Intel Left</p>
          <p className="text-sm font-black text-yellow-500">{2 - hintsViewed} / 2</p>
        </div>
      </div>

      {/* 8-ITEM COMPONENT GRID MAPPING (Mirrors Detective Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sabotageList.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg bg-slate-950 text-yellow-600 border border-slate-900">
                {item.evidence_id}
              </div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                {item.evidence_label}
              </h3>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 italic">Select a deception angle to deploy for this file node.</p>
              
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => handleRevealDeception(item.deceptive_hint_1)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1.5 px-2 rounded-md text-yellow-500/70 border border-slate-700/50 transition-colors"
                >
                  Deception 1
                </button>
                <button 
                  onClick={() => handleRevealDeception(item.deceptive_hint_2)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-[10px] uppercase font-bold py-1.5 px-2 rounded-md text-yellow-500/70 border border-slate-700/50 transition-colors"
                >
                  Deception 2
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* OVERLAY POPUP LAYER */}
      {activeDeception && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-2xl">
            <div className="text-xl font-bold text-yellow-500 tracking-wide uppercase font-mono">🎭 Intercepted Script</div>
            <p className="text-xs text-slate-300 font-serif leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900 text-left">
              "{activeDeception}"
            </p>
            <button 
              onClick={() => setActiveDeception(null)} 
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold py-2 rounded-lg text-xs uppercase tracking-wide transition-colors"
            >
              Destroy Protocol Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

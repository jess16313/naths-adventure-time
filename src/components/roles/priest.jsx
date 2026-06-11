import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// --- THE SECRET CRYSTAL CLUES CORE DATA DECK ---
const CRYSTAL_HINTS = {
  crystal_1: {
    name: "💎 Ruby Crystal",
    hint: "The crimson gem rests inside the Candy Kingdom Treasury, hidden completely behind the large canvas painting of Princess Bubblegum."
  },
  crystal_2: {
    name: "🟢 Emerald Crystal",
    hint: "Look deep beneath the roots of the tree house venue where the green glowing neon lights wrap around the lower deck pipeline frame."
  },
  crystal_3: {
    name: "🟡 Topaz Crystal",
    hint: "Suspended in plain sight inside the Ice King's domain. Check inside the transparent glass cabinet sitting adjacent to the main drink station console."
  },
  crystal_4: {
    name: "🔮 Amethyst Crystal",
    hint: "Carried secretly by Marcelline. To claim it, you must present her with a completed visual drawing signature or trade it for a riddle answer token."
  },
  crystal_5: {
    name: "🔮 bruh Crystal",
    hint: "Carried secretly by Marcelline. To claim it, you must present her with a completed visual drawing signature or trade it for a riddle answer token."
  },
  crystal_6: {
    name: "🔮 yamama Crystal",
    hint: "Carried secretly by Marcelline. To claim it, you must present her with a completed visual drawing signature or trade it for a riddle answer token."
  }
};

export default function Priest({ playerState }) {
  const [unlockedHints, setUnlockedHints] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 1. Calculate earned hint tokens: 1 hint credit token for every 2 minigames solved
  const totalTokensEarned = Math.floor((playerState.minigame_count || 0) / 2);
  const tokensSpent = unlockedHints.length;
  const availableTokens = totalTokensEarned - tokensSpent;

  useEffect(() => {
    // Synchronize which string keys have been stored in their database record
    if (playerState.unlocked_crystal_hints) {
      const hintKeys = playerState.unlocked_crystal_hints.split(',').filter(Boolean);
      setUnlockedHints(hintKeys);
    } else {
      setUnlockedHints([]);
    }
  }, [playerState]);

  // 2. Database Purchase Handshake Trigger
  const handleUnlockHint = async (crystalKey) => {
    if (availableTokens <= 0 || unlockedHints.includes(crystalKey) || submitting) return;

    const confirmUnlock = window.confirm(`Spend 1 Intel Token to decode the file location rules for the ${CRYSTAL_HINTS[crystalKey].name}?`);
    if (!confirmUnlock) return;

    setSubmitting(false);
    
    // Construct new comma-separated cache string append
    const updatedHintsArray = [...unlockedHints, crystalKey];
    const updatedHintsString = updatedHintsArray.join(',');

    const { error } = await supabase
      .from('player')
      .update({ unlocked_crystal_hints: updatedHintsString })
      .eq('id', playerState.id);

    if (error) {
      console.error("Failed to unlock secret data channel:", error.message);
    }
  };

  return (
    <div className="space-y-6 text-gray-200 animate-fadeIn">
      
      {/* 📊 PRIEST COOLDOWN INTEL HOVER DISPLAY METER */}
      <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-mono font-black text-gray-400 uppercase">Theological Credit Tokens</h4>
          <span className="text-2xl font-black text-sky-400 tracking-wider">
            {availableTokens} / {totalTokensEarned} TOKENS OPEN
          </span>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Earned automatically for every 2 completed minigames (Your total puzzles: {playerState.minigame_count || 0})
          </p>
        </div>
        <span className="text-xs font-mono bg-sky-500/10 text-sky-400 px-2.5 py-1 rounded-full font-bold uppercase">Priest Hub</span>
      </div>

      <div className="border-t border-white/5 pt-4 space-y-4">
        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Crystal Intelligence Registry</h4>
        
        {/* Loop through our 4 custom crystal keys block maps */}
        {Object.entries(CRYSTAL_HINTS).map(([key, data]) => {
          const isUnlocked = unlockedHints.includes(key);

          return (
            <div 
              key={key} 
              className={`p-4 rounded-xl border transition-all ${
                isUnlocked 
                  ? 'bg-slate-900/40 border-emerald-500/20' 
                  : 'bg-black/20 border-white/5'
              }`}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                <span className="font-bold text-sm uppercase tracking-wide text-white">{data.name}</span>
                
                {isUnlocked ? (
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold uppercase px-2 py-0.5 rounded-full">Decoded</span>
                ) : (
                  <button
                    disabled={availableTokens <= 0 || submitting}
                    onClick={() => handleUnlockHint(key)}
                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-20 disabled:hover:bg-sky-600 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all"
                  >
                    🔓 Decode Clue
                  </button>
                )}
              </div>

              {/* RENDER HINT LOG CONTENT CONDITIONALLY */}
              {isUnlocked ? (
                <p className="text-xs text-gray-300 leading-relaxed font-sans italic p-2 bg-black/30 rounded-lg border border-white/5">
                  "{data.hint}"
                </p>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed italic select-none">
                  🔒 Data stream locked. Spend 1 Theological Credit Token to unlock the coordinates of this magical crystal artifact.
                </p>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}

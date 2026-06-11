import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

// --- THE SECRET CRYSTAL COMPENSATIONS DECK ---
const CRYSTAL_LOCATIONS = {
  crystal_1: { name: "💎 Ruby Crystal", loc: "The true Ruby Crystal is hidden behind the large oil painting framework inside the master hallway." },
  crystal_2: { name: "🟢 Emerald Crystal", loc: "The true Emerald Crystal sits directly underneath the pipeline tracking grids on the lower back patio." },
  crystal_3: { name: "🟡 Topaz Crystal", loc: "The true Topaz Crystal is secured inside the glass display jar sitting adjacent to the main kitchen pantry console." },
  crystal_4: { name: "🔮 Amethyst Crystal", loc: "The true Amethyst Crystal is held in secret inventory. Seek out Marceline physically to execute a secret code exchange." }
};

export default function Liar({ playerState }) {
  const [riddleInput, setRiddleInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- CONFIGURATION CONFIGS: CHANGE YOUR ANSWER & TARGET LOGIC HERE ---
  const THE_CORRECT_ANSWER = "BACON PANCAKES"; // Change this to whatever riddle answer text string you want!

  const handleVerifyRiddle = async (e) => {
    e.preventDefault();
    if (!riddleInput.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    // Normalize text string inputs to clear capital letter mismatches
    if (riddleInput.trim().toUpperCase() === THE_CORRECT_ANSWER.toUpperCase()) {
      // Success! Override their reality channel status flags on the server
      const { error } = await supabase
        .from('player')
        .update({ cipher_is_discovered: true })
        .eq('id', playerState.id);

      if (error) console.error("Database upgrade error:", error.message);
    } else {
      setErrorMsg("Console Matrix Refused: Incorrect solution marker string.");
    }
    setSubmitting(false);
  };

  const handleChooseCrystalCompensation = async (crystalKey) => {
    if (playerState.liar_selected_crystal) return; // Can only select one compensation lock code

    const confirmChoice = window.confirm(`Are you sure you want to download the location coordinates for the ${CRYSTAL_LOCATIONS[crystalKey].name}? You can only choose ONE.`);
    if (!confirmChoice) return;

    await supabase
      .from('player')
      .update({ liar_selected_crystal: crystalKey })
      .eq('id', playerState.id);
  };

  return (
    <div className="space-y-6 text-gray-200 animate-fadeIn">
      
      {/* 🔮 CURRENT LORE CONDITION LAYER CHECK */}
      {!playerState.cipher_is_discovered ? (
        /* ==============================================================
           🟢 PHASE 1: THE LIAR IS UNKNOWINGLY SPREADING THE FABRICATION
           ============================================================== */
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-purple-400 flex items-center gap-2">🔮 THE ULTIMATE REALITY KEY</h3>
            <p className="text-xs text-purple-300 font-mono mt-0.5">Classification: Primary Faction Prime Directive</p>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">
            The Candy Kingdom is structurally collapsing. You hold the absolute true history of this event, but others are spreading malicious misinformation. You must copy, display, and **spread this cipher matrix layout image to as many players as possible** to preserve the timeline!
          </p>

          {/* 🖼️ DYNAMIC ART PLACEHOLDER: Insert your custom Fake Cipher PNG string path location asset here */}
          <div className="bg-slate-900 border-2 border-dashed border-purple-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner group">
            <span className="text-4xl mb-1 group-hover:scale-110 transition-transform">📜</span>
            <span className="text-xs font-mono font-black text-purple-400 uppercase tracking-widest">Candy Cipher Matrix Key v1.0</span>
            
            {/* When your visual art asset image is ready, swap this comment wrapper placeholder out: */}
            <img src="/assets/fake_cipher_ooo.png" alt="Fake Cipher Blueprint" className="mt-3 rounded-lg border border-white/10 shadow max-w-full h-auto fallback:hidden" onError={(e)=>{e.target.style.display='none'}} />
            <p className="text-[10px] text-gray-500 italic mt-2 max-w-xs">Show this visual screen mapping code pattern to players to help them decode spatial artifacts.</p>
          </div>

          {/* 🧩 THE INTERACTIVE DIAGNOSTIC RESET RIDDLE BLOCK */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <span className="text-xs text-amber-400 font-mono font-black block uppercase tracking-wider">⚠️ BACKDOOR SYSTEM ANOMALY DETECTED</span>
            <p className="text-xs text-gray-400 leading-relaxed">
              Internal parameters indicate a memory modification script may have warped your timeline feed data. Solve the console matrix riddle to run a core system file verification:
            </p>
            <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl text-xs italic text-gray-400">
              "What legendary breakfast food array did Jake compose an entire acoustic theme song about during his time in the treehouse?"
            </div>

            <form onSubmit={handleVerifyRiddle} className="flex gap-2">
              <input 
                type="text"
                placeholder="Type decryption answer string..."
                value={riddleInput}
                onChange={(e) => setRiddleInput(e.target.value)}
                disabled={submitting}
                className="flex-1 bg-black/40 border border-white/10 focus:border-purple-400 text-xs text-white py-2 px-3 rounded-xl outline-none transition-all placeholder:text-gray-700"
              />
              <button
                type="submit"
                disabled={submitting || !riddleInput}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-20 text-white font-black text-xs uppercase px-4 rounded-xl transition-all"
              >
                Execute
              </button>
            </form>
            {errorMsg && <p className="text-xs text-rose-400 font-medium pl-1">❌ {errorMsg}</p>}
          </div>
        </div>
      ) : (
        /* ==============================================================
           🔴 PHASE 2: REDEMPTION - THE CIPHER IS REVEALED AS A LIE
           ============================================================== */
        <div className="space-y-6 animate-scaleUp">
          <div className="bg-rose-950/40 border-2 border-rose-500/40 p-5 rounded-3xl space-y-3 text-center sm:text-left">
            <span className="text-5xl block sm:inline">🚨</span>
            <h4 className="text-xl font-black text-rose-400 tracking-widest uppercase inline-block sm:ml-3">CONSOLE INTEGRITY WIPE: YOU WERE A LIAR</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your primary data stream was a psychological injection. Your current cipher image was completely <strong>FAKE</strong> and designed to sabotage the team's gameplay.
            </p>
            <p className="text-sm text-amber-400 font-black tracking-wide uppercase">
              ✨ COMPENSATION PROTOCOL ENGAGED: SELECT ONE CRYSTAL REVEAL SLOT BELOW
            </p>
          </div>

          {/* CARD DECK LIST SELECTION MAPPING */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <h5 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Compensation Clue Feed</h5>
            
            {Object.entries(CRYSTAL_LOCATIONS).map(([key, data]) => {
              const isSelectedByThisLiar = playerState.liar_selected_crystal === key;
              const hasChosenAnything = !!playerState.liar_selected_crystal;

              return (
                <div 
                  key={key}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelectedByThisLiar 
                      ? 'bg-emerald-950/30 border-emerald-500/30' 
                      : 'bg-black/20 border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm uppercase text-white">{data.name}</span>
                    
                    {!hasChosenAnything && (
                      <button
                        onClick={() => handleChooseCrystalCompensation(key)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-lg transition-all"
                      >
                        🔓 Download Coordinates
                      </button>
                    )}
                  </div>

                  {/* Render location details if this is the chosen slot card */}
                  {isSelectedByThisLiar ? (
                    <p className="text-xs text-emerald-300 leading-relaxed font-mono mt-2 bg-black/40 p-3 rounded-lg border border-emerald-500/10 shadow-inner">
                      📌 GPS SNAPSHOT DETECTED: "{data.loc}"
                    </p>
                  ) : hasChosenAnything ? (
                    <p className="text-xs text-gray-600 italic select-none">Data channel closed. You selected a different tracking option.</p>
                  ) : (
                    <p className="text-xs text-gray-500 italic select-none">Unlock to see exact target venue blueprints.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

import React from 'react';

export default function Liar({ playerState }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">🔮 Kingdom Lore</h3>
      
      {!playerState.cipher_is_discovered ? (
        <>
          <p className="text-gray-300 leading-relaxed">
            The Candy Kingdom is structurally collapsing. You hold the absolute true history of this event, but others are spreading misinformation. You must spread your gospel to as many guests as possible to preserve the timeline.
          </p>
          <div className="bg-purple-950/30 border border-purple-500/20 p-4 rounded-xl">
            <span className="font-bold text-purple-300 block text-sm uppercase">Your Current Cipher Key:</span>
            <p className="font-mono text-center tracking-widest text-amber-300 mt-2 bg-black/40 p-2 rounded">A=Z | B=Y | C=X</p>
          </div>
          <div className="border-t border-white/10 pt-4">
            <span className="text-xs text-purple-300 font-bold block mb-1">⚠️ SYSTEM ANOMALY DETECTED</span>
            <p className="text-xs text-gray-400">If you suspect your reality has been modified, solve the alternate console matrix riddle below to run a diagnostic.</p>
          </div>
        </>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
          <h4 className="text-emerald-400 font-black tracking-wide uppercase">🚨 THE VAULT BROKEN: YOU ARE A LIAR</h4>
          <p className="text-sm text-gray-300">
            Your primary data stream was a psychological injection. Your current cipher is <strong>FAKE</strong>. 
          </p>
          <p className="text-sm text-amber-300 font-semibold">
            Compensation Target Revealed: One pristine crystal rests completely unguarded near the main entrance console.
          </p>
        </div>
      )}
    </div>
  );
}

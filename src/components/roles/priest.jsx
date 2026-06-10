import React from 'react';

export default function Priest({ playerState }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">⛪ Council of Priests</h3>
      <p className="text-gray-300 leading-relaxed">
        You are the theological anchors of Ooo. Be warned: a deep psychological infection has created **Liars** among the guests who are completely unaware their knowledge base is fake.
      </p>
      <div className="bg-slate-900 border border-sky-500/20 p-4 rounded-xl flex justify-between items-center">
        <div>
          <span className="text-xs text-gray-400 block">Riddles Settled:</span>
          <span className="text-lg font-bold text-white">{playerState.riddles_solved ?? 0} / 3</span>
        </div>
        <span className="text-xs bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full uppercase font-bold tracking-wide">
          {(playerState.riddles_solved ?? 0) >= 3 ? "👑 Hint Unlocked" : "Locked"}
        </span>
      </div>
      {(playerState.riddles_solved ?? 0) >= 3 && (
        <div className="bg-sky-950/30 border border-sky-500/30 p-4 rounded-xl text-sm italic text-sky-200">
          "The individual claiming to be the righteous savior holding the yellow cipher tool is actively distributing fabrications."
        </div>
      )}
    </div>
  );
}

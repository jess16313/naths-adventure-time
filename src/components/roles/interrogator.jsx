import React from 'react';

export default function Interrogator({ completedCount }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">⚖️ Grand Interrogator Panel</h3>
      <p className="text-gray-300 leading-relaxed">
        Complete structural minigames to build administrative authorization. Once your query pool is full, you can choose any physical player to run a digital diagnostic assessment on, or target them to sabotage their progress.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl text-center">
          <span className="text-xs text-gray-400 block mb-1">Authorization Status</span>
          <span className="text-lg font-black text-emerald-400">
            {completedCount >= 5 ? "READY TO CHARGE" : `${completedCount} / 5 Games`}
          </span>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl text-center">
          <span className="text-xs text-gray-400 block mb-1">Bravery Sabotage Ability</span>
          <span className="text-lg font-black text-rose-400">-15 MINIGAMES</span>
        </div>
      </div>
    </div>
  );
}

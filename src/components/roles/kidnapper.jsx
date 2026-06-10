import React from 'react';

export default function Kidnapper() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">👺 The Kidnapper's Terminal</h3>
      <p className="text-gray-300 leading-relaxed">
        Your prime directive is to target players, remove them from physical gameplay space, and subject them to psychological assessment. You must successfully list **all four thieves simultaneously** to override the system and claim victory.
      </p>
      <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-300 space-y-1">
        <span className="font-bold block uppercase text-amber-400">Kidnapper Execution Rules:</span>
        <p>• You may only trap any single unique target once during the party window.</p>
        <p>• Executing a kidnapping pauses their digital story feed and halts their minigame timers completely.</p>
      </div>
    </div>
  );
}

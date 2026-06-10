import React from 'react';

export default function Thief() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">🗡️ Thief Operations</h3>
      <p className="text-gray-300 leading-relaxed">
        Your presence must remain completely hidden from the Kidnapper and Detectives. Solve your internal riddles to locate the master book, which contains the spatial keys to the 4 hidden crystals.
      </p>
      <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-xl space-y-2">
        <span className="font-bold text-red-300 block text-sm uppercase">Active Thief Riddle:</span>
        <p className="text-sm italic text-gray-300">"Where the yellow dog rests beneath the kingdom's highest shelf, look behind the visual canvas."</p>
      </div>
    </div>
  );
}

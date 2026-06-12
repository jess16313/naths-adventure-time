import React, { useState } from 'react';

// Hardcoded array of your 4 unique crystal hints
const CRYSTAL_POOL = [
  { id: 1, name: 'Crystal 1', hint_text: '"Ian Rule Sea", learn from how it sounds. Once you know the word and abandon your lethargy, be the first person to speak to starchy.', image_url: null },
  { id: 2, name: 'Crystal 2', hint_text: 'Once you know the word your mind is running free so, take your newfound knowledge and give it to BMO.', image_url: '../assets/chia_seeds.png' },
  { id: 3, name: 'Crystal 3', hint_text: 'On the sailors most trusted device, Ive circled the promised land. There lies a lovely bird, only you can understand. Once you know the word, you have raked through the fog, bide your time all the while and find Jake the dog.', image_url: null },
  { id: 4, name: 'Crystal 4', hint_text: '"THE REACH SKY POINT THE YOULL TELL TIME KNOW NOT" Once you know the world, be quick in your spree. With no hesitation find the player, Marshal Lee.', image_url:null }
];

export default function Thief({ playerState }) {
  // Pull the assigned 0, 1, 2, or 3 from your player state object
  // Fallback to 0 if it hasn't loaded or isn't set yet
  const assignedNumber = playerState.thief_number !== undefined && playerState.thief_number !== null 
    ? playerState.thief_number 
    : 0;

  // Use modulo arithmetic as a safety guard so it never breaks if you add more thieves than hints
  const startingCrystalIndex = assignedNumber % CRYSTAL_POOL.length;
  
  // Track which crystal index the player is currently viewing
  const [currentCrystalIndex, setCurrentCrystalIndex] = useState(startingCrystalIndex);
  const [hasUnlocked, setHasUnlocked] = useState(false);

  const activeHint = CRYSTAL_POOL[currentCrystalIndex];

  const handleNextHint = () => {
    setCurrentCrystalIndex((prevIndex) => (prevIndex + 1) % CRYSTAL_POOL.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-2">
        <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-wider">
          Thief Syndicate Feeds
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Assigned Vector ID: <span className="text-emerald-400 font-mono font-bold">#00{assignedNumber}</span> (Starting Crystal {startingCrystalIndex + 1})
        </p>
      </div>

      {!hasUnlocked ? (
        // STATE A: Initial lock screen before intercepting
        <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your dynamic node terminal has isolated an independent starting target. Intercept the network stream to lock your frequencies.
          </p>
          <button
            onClick={() => setHasUnlocked(true)}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-600/20"
          >
            Intercept Assigned Target
          </button>
        </div>
      ) : (
        // STATE B: Displaying the hint layout cleanly
        <div className="bg-slate-900/80 border border-emerald-500/20 p-5 rounded-2xl space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-black">
            <span>// Decryption Stream Active</span>
            <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-gray-300">
              {activeHint.name}
            </span>
          </div>
          
          {/* Text Content */}
          <p className="text-sm text-gray-200 font-medium leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 font-mono">
            "{activeHint.hint_text}"
          </p>

          {/* Conditional Image */}
          {activeHint.image_url && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-xs text-slate-400 mb-2 italic">Intercepted structural layout schematic:</p>
              <img 
                src={activeHint.image_url} 
                alt="Secret Crystal Coordinate Blueprint" 
                className="w-full h-auto rounded-xl border border-white/10 max-h-60 object-contain bg-black/40 shadow-md"
              />
            </div>
          )}

          {/* Navigation Button to Cycle Data */}
          <button
            onClick={handleNextHint}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl uppercase tracking-wider transition-all border border-white/5"
          >
            Cycle Next Network Frequency →
          </button>
        </div>
      )}
    </div>
  );
}

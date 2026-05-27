import { useState } from 'react';

// 1. VIEW IF THE MEDIUM IS ALIVE
export function LivingMediumView() {
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-purple-400">The Séance Room</h1>
        <p className="text-xs text-slate-500 mt-1">You are the tether between worlds. The dead will seek your guidance.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider">Your Secret Archives</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          When a ghost approaches you physically and asks for their next trial, read them this final riddle:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-serif text-xs text-indigo-300 leading-relaxed">
          "The more of them you take, the more you leave behind. What are they?"
        </div>
        <p className="text-[10px] text-slate-500 italic">
          *Note: The correct answer to this riddle is "footsteps". Once they type that into their app, their soul will be permanently freed!
        </p>
      </div>
    </div>
  );
}

// 2. VIEW IF THE MEDIUM IS DEAD (The Limbo mirror shifts)
export function DeadMediumView() {
  const [solved, setSolved] = useState(false);
  const [input, setInput] = useState('');

  const handleSolve = (e) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === 'mirror') {
      setSolved(true);
    } else {
      alert("The mirror remains clouded.");
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto text-center">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-rose-500">The Shattered Mirror</h1>
        <p className="text-xs text-slate-500 mt-1">The bridge has fractured. You are trapped inside your own looking glass.</p>
      </div>

      {solved ? (
        <div className="bg-rose-950/30 border border-rose-900 p-5 rounded-2xl text-xs text-slate-300 leading-relaxed">
          ✨ You have shattered the confinement glass. Your energy returns to the mansion layout as a free spirit.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left space-y-4">
          <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider">The Medium's Ultimate Paradox</h3>
          <p className="text-xs text-slate-400 font-serif bg-slate-950 p-4 rounded-xl border border-slate-850 leading-relaxed">
            "Look in my face and I am somebody; look at my back and I am nobody. What am I?"
          </p>
          <form onSubmit={handleSolve} className="space-y-3">
            <input 
              type="text" 
              placeholder="Your final answer..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-850 text-xs rounded-lg text-slate-200 focus:outline-none"
            />
            <button type="submit" className="w-full bg-rose-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wide">
              Shatter Confinement
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
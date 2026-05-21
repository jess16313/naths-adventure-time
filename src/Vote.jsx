import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function VotingBooth({ currentCharacter }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [players, setPlayers] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);

  // Form States
  const [murdererInput, setMurdererInput] = useState('');
  const [selectedAccomplices, setSelectedAccomplices] = useState([]);
  const [selectedImposters, setSelectedImposters] = useState([]);

  useEffect(() => {
    checkLockStatus();
    fetchPlayers();

    // Set up a real-time stream so it unlocks the split-second the host reveals the last evidence item!
    const sub = supabase.channel('voting-lock-stream')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evidence' }, () => {
        checkLockStatus();
      }).subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const checkLockStatus = async () => {
    const { data } = await supabase.from('evidence').select('is_discovered');
    if (data) {
      // It only unlocks if EVERY SINGLE piece of evidence has is_discovered === true
      const allFound = data.every(item => item.is_discovered === true);
      setIsUnlocked(allFound);
    }
  };

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('character_name').order('character_name');
    if (data) setPlayers(data.filter(p => p.character_name !== currentCharacter.character_name)); // Remove yourself from suspect pools
  };

  // Helper checkbox handlers
  const handleCheckboxToggle = (name, list, setList) => {
    if (list.includes(name)) {
      setList(list.filter(item => item !== name));
    } else {
      setList([...list, name]);
    }
  };

  const handleSubmitBallot = async (e) => {
    e.preventDefault();
    if (!murdererInput) return alert("You must choose a Prime Murderer Suspect!");

    const { error } = await supabase.from('ballots').insert([
      {
        voter_name: currentCharacter.character_name,
        accused_murderer: murdererInput,
        suspected_accomplices: selectedAccomplices,
        suspected_imposters: selectedImposters
      }
    ]);

    if (!error) {
      setHasVoted(true);
      alert("🔒 Verdict submitted securely to the archives!");
    }
  };

  // 1. LOCKED VIEW
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto mt-12 shadow-2xl">
        <div className="text-4xl animate-bounce">🚧</div>
        <h2 className="text-lg font-black uppercase tracking-wider text-red-500">Voting Protocols Locked</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The local authorities have barricaded the voting ledger. You must discover and verify all **8 key pieces of evidence** across the mansion grounds before the final execution window opens.
        </p>
      </div>
    );
  }

  // 2. ALREADY VOTED VIEW
  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto mt-12 shadow-2xl">
        <div className="text-4xl text-emerald-500">📥</div>
        <h2 className="text-lg font-black uppercase tracking-wider text-emerald-400">Ballot Confirmed</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your files have been stamped and zipped. Awaiting remaining guest verdicts... Keep your composure.
        </p>
      </div>
    );
  }

  // 3. THE DYNAMIC ACCUSATION BALLOT FORM
  return (
    <form onSubmit={handleSubmitBallot} className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">The Grand Jury</h1>
        <p className="text-xs text-slate-500 mt-1">Fill out your official summary verdict below. Choose wisely.</p>
      </div>

      {/* QUESTION 1: THE MURDERER */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
        <label className="text-xs font-black uppercase text-red-400 tracking-wider block">1. Who is the Prime Murderer?</label>
        <select 
          value={murdererInput}
          onChange={(e) => setMurdererInput(e.target.value)}
          className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">-- Select a suspect --</option>
          {players.map(p => <option key={p.character_name} value={p.character_name}>{p.character_name}</option>)}
        </select>
      </div>

      {/* QUESTION 2: ACCOMPLICES (Checkboxes) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div>
          <label className="text-xs font-black uppercase text-orange-400 tracking-wider block">2. Who are the Accomplices?</label>
          <span className="text-[10px] text-slate-500 italic block">Check as many individuals as you think apply.</span>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-850">
          {players.map(p => (
            <label key={p.character_name} className="flex items-center space-x-2 text-xs text-slate-300 p-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedAccomplices.includes(p.character_name)}
                onChange={() => handleCheckboxToggle(p.character_name, selectedAccomplices, setSelectedAccomplices)}
                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span>{p.character_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* QUESTION 3: IMPOSTERS (Checkboxes) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div>
          <label className="text-xs font-black uppercase text-yellow-500 tracking-wider block">3. Who are the Imposters?</label>
          <span className="text-[10px] text-slate-500 italic block">Check as many individuals as you think apply.</span>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-850">
          {players.map(p => (
            <label key={p.character_name} className="flex items-center space-x-2 text-xs text-slate-300 p-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedImposters.includes(p.character_name)}
                onChange={() => handleCheckboxToggle(p.character_name, selectedImposters, setSelectedImposters)}
                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span>{p.character_name}</span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs border border-red-500/50 shadow-lg transition">
        Submit Final Verdict 🗳️
      </button>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function NursePanel({ currentCharacter }) {
  const [players, setPlayers] = useState([]);
  const [riddle, setRiddle] = useState(null);
  const [riddleInput, setRiddleInput] = useState('');
  const [antidotesHeld, setAntidotesHeld] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState('');

  useEffect(() => {
    fetchLivingRoster();
    fetchNextMedicalRiddle();
  }, []);

  const fetchLivingRoster = async () => {
    const { data } = await supabase.from('players').select('*').eq('is_alive', true).order('character_name');
    if (data) setPlayers(data.filter(p => p.id !== currentCharacter.id));
  };

  const fetchNextMedicalRiddle = async () => {
    const { data } = await supabase.from('nurse_riddles').select('*').limit(1); // Pulls a diagnostic challenge
    if (data && data.length > 0) setRiddle(data[0]);
  };

  const handleSynthesizeAntidote = (e) => {
    e.preventDefault();
    if (riddleInput.trim().toLowerCase() === riddle?.correct_key.toLowerCase()) {
      setAntidotesHeld(prev => prev + 1);
      setRiddleInput('');
      alert("🩺 ANTIDOTE SYNTHESIZED: You have gained 1 protective antidote charge!");
    } else {
      alert("❌ CHEMICAL FAILURE: The compound collapsed. Try again.");
    }
  };

  const handleDeployAntidote = async (e) => {
    e.preventDefault();
    if (!selectedPatient || antidotesHeld <= 0) return;

    // Grant player chemical immunity against the murderer's next strike vector
    await supabase.from('players').update({ nurse_immune: true }).eq('id', selectedPatient);

    // Broadcast deployment warning to the room
    const patientName = players.find(p => p.id === selectedPatient)?.character_name;
    await supabase.from('active_broadcast').update({
      message_text: `🩺 MEDICAL WARD ACTIVE: The Nurse has secretly deployed an antidote vaccine to a guest...`
    }).eq('id', 1);

    setAntidotesHeld(prev => prev - 1);
    setSelectedPatient('');
    alert(`🛡️ IMMUNITY APPLIED: ${patientName} is safe from the next murder attempt.`);
  };

  if (!currentCharacter.is_alive) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md mx-auto text-center font-serif text-slate-400">
        💀 Your vital systems have flatlined. Your medical bag has been confiscated by the house entity.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">The Infirmary</h1>
          <p className="text-xs text-slate-500 mt-1">Synthesize serums to safeguard the innocent.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
          <p className="text-[9px] uppercase font-bold text-slate-500">Antidotes</p>
          <p className="text-sm font-black text-emerald-400">{antidotesHeld}</p>
        </div>
      </div>

      {/* SYNTHESIS FIELD */}
      <form onSubmit={handleSynthesizeAntidote} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <h2 className="text-xs font-black text-emerald-400 uppercase tracking-wide">Synthesize Protective Compounds</h2>
        <p className="text-slate-400 font-serif text-xs bg-slate-950 p-4 rounded-xl border border-slate-850">
          "{riddle?.riddle_text}"
        </p>
        <input 
          type="text" 
          placeholder="Type riddle key..." 
          value={riddleInput}
          onChange={(e) => setRiddleInput(e.target.value)}
          className="w-full p-2.5 bg-slate-950 border border-slate-850 text-xs rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
        />
        <button type="submit" className="w-full bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider">
          Synthesize Serum
        </button>
      </form>

      {/* DEPLOYMENT FIELD */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wide">Administer Patient Dosage</h2>
        {antidotesHeld > 0 ? (
          <form onSubmit={handleDeployAntidote} className="space-y-3">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="">-- Choose Target to Immunize --</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.character_name}</option>)}
            </select>
            <button type="submit" className="w-full bg-slate-800 text-emerald-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide">
              Inject Shield Serum
            </button>
          </form>
        ) : (
          <p className="text-[11px] text-slate-500 italic text-center py-2 bg-slate-950 rounded-lg border border-slate-850">
            🔒 Locked. Crack a medical formula above to charge your needle injector.
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AfterlifePage({ currentCharacter }) {
  const [playerState, setPlayerState] = useState(currentCharacter);
  const [suspectList, setSuspectList] = useState([]);
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [riddle, setRiddle] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  const [localAlert, setLocalAlert] = useState(null);

  useEffect(() => {
    fetchSuspects();
    if (playerState.medium_discovered) {
      fetchGhostRiddle();
    }
  }, [playerState.medium_discovered, playerState.afterlife_stage]);

  const fetchSuspects = async () => {
    // Get all other characters for the dropdown menu
    const { data } = await supabase.from('players').select('character_name').order('character_name');
    if (data) setSuspectList(data.filter(p => p.character_name !== currentCharacter.character_name));
  };

  const fetchGhostRiddle = async () => {
    // Stage 1 = Riddle to help find out secrets, Stage 2 = The final soul freeing riddle
    const { data } = await supabase.from('dead_riddles').select('*').eq('id', playerState.afterlife_stage).maybeSingle();
    if (data) setRiddle(data);
  };

  // HANDLER 1: DISCOVERING LUKE THE MEDIUM
  const handleIdentifyMedium = async (e) => {
    e.preventDefault();
    if (!selectedSuspect) return;

    const { data: target } = await supabase
      .from('players')
      .select('role')
      .eq('character_name', selectedSuspect)
      .single();

    if (target?.role === 'medium') {
      const { data: updatedProfile } = await supabase
        .from('players')
        .update({ medium_discovered: true })
        .eq('id', currentCharacter.id)
        .select()
        .single();

      if (updatedProfile) setPlayerState(updatedProfile);
      setLocalAlert({ type: 'success', text: '🔮 THE VEIL TEARS: You have correctly aligned with the Medium! Your trials are now accessible.' });
    } else {
      setLocalAlert({ type: 'error', text: '❌ FALSE FREQUENCY: That individual has no psychic link to the afterlife. Keep searching.' });
    }
    setSelectedSuspect('');
  };

  // HANDLER 2: CRACKING THE RIDDLES
  const handleCheckAnswer = async (e) => {
    e.preventDefault();
    if (!riddle) return;

    if (answerInput.trim().toLowerCase() === riddle.correct_answer.toLowerCase()) {
      let nextStage = playerState.afterlife_stage + 1;
      let updatePayload = { afterlife_stage: nextStage };

      if (playerState.afterlife_stage === 2) {
        updatePayload.soul_freed = true;
        setLocalAlert({ type: 'success', text: '✨ ASCENSION: Your soul bursts from containment! You are free!' });
      } else {
        setLocalAlert({ type: 'success', text: '🔓 CORRECT: The mist clears slightly. Proceed to your final trial.' });
      }

      const { data: updatedProfile } = await supabase
        .from('players')
        .update(updatePayload)
        .eq('id', currentCharacter.id)
        .select()
        .single();

      if (updatedProfile) setPlayerState(updatedProfile);
      setAnswerInput('');
    } else {
      setLocalAlert({ type: 'error', text: '❌ INCORRECT: The underworld shadows drag you down. Try again.' });
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-cyan-400">The Underworld Echo</h1>
        <p className="text-xs text-slate-500 mt-1">Your mortal frame has expired. Navigate the spectral plane.</p>
      </div>

      {/* LOCAL IN-APP ALERT BANNER */}
      {localAlert && (
        <div className={`p-3 rounded-xl text-xs font-medium border relative animate-fade-in ${
          localAlert.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-red-950/80 border-red-900 text-red-300'
        }`}>
          <p>{localAlert.text}</p>
          <button onClick={() => setLocalAlert(null)} className="absolute top-2 right-2 opacity-50">✕</button>
        </div>
      )}

      {/* STATE 1: SOUL COMPLETELY FREED */}
      {playerState.soul_freed ? (
        <div className="bg-cyan-950/20 border border-cyan-900/40 p-6 rounded-2xl text-center space-y-3">
          <div className="text-4xl animate-pulse">🕊️</div>
          <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wide">Transcended Spirit</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-serif">
            Your energy is completely untethered. You may now roam the mansion floors freely as an omniscient observer. Do not compromise the live database by leaking answers to the living.
          </p>
        </div>
      ) : !playerState.medium_discovered ? (
        
        /* STATE 2: LOCKED GHOST DATA (NEED TO FIND LUKE) */
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex gap-2 items-center text-amber-500 text-xs font-black uppercase tracking-wider">
            <span>🔒</span> 🕒 Spectral Intercept Scrambled
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-serif bg-slate-950 p-4 rounded-xl border border-slate-850">
            "The spirit realm is static. A message whispers through the fog: You must locate the mansion's physical Medium to anchor your frequency. **Look closely for a living guest who frequently leaves the group to execute solo scavenger missions...**"
          </p>
          
          <form onSubmit={handleIdentifyMedium} className="space-y-3">
            <select
              value={selectedSuspect}
              onChange={(e) => setSelectedSuspect(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Identify The Medium --</option>
              {suspectList.map(s => <option key={s.character_name} value={s.character_name}>{s.character_name}</option>)}
            </select>
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition">
              Link Ethereal Connection
            </button>
          </form>
        </div>
      ) : (

        /* STATE 3: MEDIUM FOUND -> UNLOCKED TRIALS PANEL */
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              Trial {playerState.afterlife_stage}: {playerState.afterlife_stage === 1 ? "Decryption Sync" : "The Medium's Verse"}
            </h3>
            <span className="text-[9px] bg-cyan-950 border border-cyan-800 px-1.5 py-0.5 rounded text-cyan-400 font-bold uppercase">Unlocked</span>
          </div>

          {playerState.afterlife_stage === 2 && (
            <p className="text-[11px] text-slate-400 bg-purple-950/20 border border-purple-900/30 p-3 rounded-lg">
              🔮 <strong>Physical Directive:</strong> Walk up to the Medium in the real world. Ask them face-to-face for the <em>"Sacred Verse Riddle"</em>. Type the correct answer below.
            </p>
          )}

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-serif text-xs text-slate-300 leading-relaxed shadow-inner">
            {riddle?.riddle_text || "Downloading afterlife ledger matrix..."}
          </div>

          <form onSubmit={handleCheckAnswer} className="space-y-3">
            <input 
              type="text" 
              placeholder="Type lowercase answer..." 
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-850 text-xs rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide transition">
              Submit Trial Verdict
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

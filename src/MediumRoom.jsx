import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function MediumRoom({ currentCharacter }) {
  const [yesNoBank, setYesNoBank] = useState([]);
  const [riddle, setRiddle] = useState(null);
  const [riddleInput, setRiddleInput] = useState('');
  
  // LIVE TRACKED PROGRESS
  const [questCount, setQuestCount] = useState(currentCharacter.seance_riddles_solved || 0);
  const [credits, setCredits] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState({}); // Stores unlocked answers locally

  // Cooldown States
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchStagedQuestions();
    if (currentCharacter.is_alive) {
      fetchCurrentQuest();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questCount]);

  const fetchStagedQuestions = async () => {
    // Dynamically calculate which clue stage to fetch based on current riddles solved
    const currentStage = Math.max(1, questCount + 1);
    const { data } = await supabase
      .from('medium_yes_no_questions')
      .select('*')
      .eq('clue_stage', currentStage)
      .order('id', { ascending: true });
    if (data) setYesNoBank(data);
  };

  const fetchCurrentQuest = async () => {
    // 1. FRESH PROFILE SCHEMA SYNC
    const { data: freshMe } = await supabase
      .from('players')
      .select('seance_riddles_solved, last_quest_timestamp, hints_used')
      .eq('id', currentCharacter.id)
      .single();

    if (freshMe) {
      const liveSolved = freshMe.seance_riddles_solved || 0;
      const liveSpent = freshMe.hints_used || 0;
      setQuestCount(liveSolved);
      setCredits(Math.max(0, liveSolved - liveSpent));

      if (liveSolved >= 10) return;

      // 2. FETCH CORRESPONDING RIDDLE
      const { data: allRiddles } = await supabase.from('medium_riddles').select('*').order('id', { ascending: true });
      if (allRiddles && allRiddles.length > 0) {
        const index = liveSolved % allRiddles.length;
        setRiddle(allRiddles[index]);
      }

      // 3. CALCULATE TIMEOUT
      if (freshMe.last_quest_timestamp) {
        const lastQuestTime = new Date(freshMe.last_quest_timestamp).getTime();
        const currentTime = new Date().getTime();
        const fifteenMinutesInMs = 15 * 60 * 1000;
        const msElapsed = currentTime - lastQuestTime;

        if (msElapsed < fifteenMinutesInMs) {
          const remainingSeconds = Math.ceil((fifteenMinutesInMs - msElapsed) / 1000);
          startCooldownTimer(remainingSeconds);
        }
      }
    }
  };

  const startCooldownTimer = (seconds) => {
    setCooldownLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSolveRiddle = async (e) => {
    e.preventDefault();
    if (!riddleInput.trim() || cooldownLeft > 0) return;

    if (riddleInput.trim().toLowerCase() !== riddle.correct_key.toLowerCase()) {
      alert("❌ The psychic vision faded. That is incorrect.");
      setRiddleInput('');
      return;
    }

    const nextQuestTotal = questCount + 1;
    setQuestCount(nextQuestTotal);
    setCredits(prev => prev + 1);

    await supabase.from('players').update({
      seance_riddles_solved: nextQuestTotal,
      last_quest_timestamp: new Date().toISOString()
    }).eq('id', currentCharacter.id);

    alert("✨ SUCCESS! A spiritual veil lifts. You have gained 1 Interrogation Token and unlocked the next clue tier.");
    setRiddleInput('');
    setRevealedAnswers({}); 
  };

  const handleRevealAnswer = async (e) => {
    e.preventDefault();
    if (!selectedQuestion || credits <= 0) return;

    const selectedObj = yesNoBank.find(q => q.id === parseInt(selectedQuestion));
    if (!selectedObj) return;

    setCredits(prev => prev - 1);

    const { data: freshMe } = await supabase.from('players').select('hints_used').eq('id', currentCharacter.id).single();
    const nextSpent = (freshMe?.hints_used || 0) + 1;
    await supabase.from('players').update({ hints_used: nextSpent }).eq('id', currentCharacter.id);

    setRevealedAnswers(prev => ({ ...prev, [selectedQuestion]: selectedObj.correct_answer }));
    alert(`👁️ ANSWER REVEALED: Truth logs updated!`);
    setSelectedQuestion('');
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-purple-400">
          {currentCharacter.is_alive ? "The Seer's Lounge" : "The Shattered Mirror"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {currentCharacter.is_alive ? `Active Clue Level: Clue ${questCount + 1} / 10` : "Your aura has dissolved."}
        </p>
      </div>

      {!currentCharacter.is_alive ? (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
          <p className="text-xs text-slate-400 font-serif">Psychic Interface Severed.</p>
        </div>
      ) : (
        <>
          {/* TOKEN BALANCE */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Interrogation Tokens</span>
            <span className="bg-purple-950 border border-purple-800 text-purple-300 font-mono font-bold text-xs px-3 py-1 rounded-md">
              {credits} Available
            </span>
          </div>

          {/* RIDDLE CHALLENGE */}
          {questCount >= 10 ? (
            <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl text-center text-xs text-slate-300">
              👁️ All clues unlocked.
            </div>
          ) : cooldownLeft > 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Next vision in:</p>
              <div className="text-xl font-mono font-black text-purple-400 bg-slate-950 px-4 py-1 rounded-lg border border-slate-900 inline-block">
                {formatTime(cooldownLeft)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSolveRiddle} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h2 className="text-xs font-black text-purple-400 uppercase tracking-wide">Vision Quest {questCount + 1}</h2>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-serif text-xs text-slate-300 shadow-inner">
                {riddle?.riddle_text || "Downloading spiritual tracks..."}
              </div>
              <input type="text" placeholder="Type answer..." value={riddleInput} onChange={(e) => setRiddleInput(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 text-xs rounded-xl text-slate-200 focus:outline-none" />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition"> Unlock Vision Channel </button>
            </form>
          )}

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wide">Stage {questCount + 1} Question Vault</h2>
              <span className="text-[9px] text-amber-500 font-mono uppercase bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/30"> Clue Filter Active </span>
            </div>

            {credits > 0 ? (
              <form onSubmit={handleRevealAnswer} className="space-y-3">
                <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none" >
                  <option value="">-- Spend 1 Token to Reveal Stage {questCount + 1} Answer --</option>
                  {yesNoBank.map(q => (
                    <option key={q.id} value={q.id} disabled={revealedAnswers[q.id] !== undefined}>
                      {q.question_text} {revealedAnswers[q.id] ? "✅ (Unlocked)" : ""}
                    </option>
                  ))}
                </select>
                <button type="submit" className="w-full bg-slate-800 border border-slate-700 text-purple-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition"> Reveal Truth Matrix </button>
              </form>
            ) : (
              <p className="text-[11px] text-slate-500 italic text-center py-2 bg-slate-950 rounded-lg border border-slate-850"> 🔒 Vault Sealed. Crack Vision Quest {questCount + 1} to gain tokens for this stage. </p>
            )}
            {Object.keys(revealedAnswers).length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h3 className="text-[10px] font-black uppercase text-amber-500">Decoded Revelations:</h3>
                {Object.entries(revealedAnswers).map(([id, ans]) => {
                  const qText = yesNoBank.find(q => q.id === parseInt(id))?.question_text;
                  return (
                    <div key={id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs text-slate-300 font-mono flex justify-between items-center">
                      <span className="text-slate-400 font-serif pr-2">"{qText || "Unknown Question"}"</span>
                      <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${ans === 'YES' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-900'}`}> {ans} </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

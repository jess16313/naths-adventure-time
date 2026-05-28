import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function MediumRoom({ currentCharacter }) {
  const [questionBank, setQuestionBank] = useState([]);
  const [riddle, setRiddle] = useState(null);
  const [riddleInput, setRiddleInput] = useState('');
  const [credits, setCredits] = useState(currentCharacter.question_credits || 0);
  const [questCount, setQuestCount] = useState(currentCharacter.total_quests_solved || 0);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [transmissionStatus, setTransmissionStatus] = useState('');

  // Cooldown States
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuestions();
    if (currentCharacter.is_alive) {
      fetchCurrentQuest();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questCount]);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('preapproved_questions')
      .select('*')
      .order('id', { ascending: true })
      .limit(5);
    if (data) setQuestionBank(data);
  };

  const fetchCurrentQuest = async () => {
    if (questCount >= 10) return;

    const { data: riddleData } = await supabase
      .from('medium_riddles')
      .select('*')
      .eq('id', questCount + 1)
      .maybeSingle();
    if (riddleData) setRiddle(riddleData);

    const { data: freshMe } = await supabase
      .from('players')
      .select('last_quest_timestamp')
      .eq('id', currentCharacter.id)
      .single();

    if (freshMe?.last_quest_timestamp) {
      const lastQuestTime = new Date(freshMe.last_quest_timestamp).getTime();
      const currentTime = new Date().getTime();
      const fifteenMinutesInMs = 15 * 60 * 1000;
      const msElapsed = currentTime - lastQuestTime;

      if (msElapsed < fifteenMinutesInMs) {
        const remainingSeconds = Math.ceil((fifteenMinutesInMs - msElapsed) / 1000);
        startCooldownTimer(remainingSeconds);
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
    const nextCredits = credits + 1;
    
    setQuestCount(nextQuestTotal);
    setCredits(nextCredits);

    await supabase.from('players').update({
      total_quests_solved: nextQuestTotal,
      question_credits: nextCredits,
      last_quest_timestamp: new Date().toISOString()
    }).eq('id', currentCharacter.id);

    alert("✨ SUCCESS! A spiritual veil lifts. You have gained 1 Question Credit.");
    setRiddleInput('');
  };

  const handleTransmitInquiry = async (e) => {
    e.preventDefault();
    if (!selectedQuestion || credits <= 0) return;

    const nextCredits = credits - 1;
    setCredits(nextCredits);

    await supabase.from('players').update({ question_credits: nextCredits }).eq('id', currentCharacter.id);

    const selectedText = questionBank.find(q => q.id === parseInt(selectedQuestion))?.question_text;
    
    await supabase.from('active_broadcast').update({
      message_text: `🔮 MEDIUM INQUIRY: "${selectedText}" — Host verdict pending.`
    }).eq('id', 1);

    setTransmissionStatus("📡 Transmitted! Look at the Host for a silent head nod or shake.");
    setSelectedQuestion('');
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-purple-400">
          {currentCharacter.is_alive ? "The Seer's Lounge" : "The Shattered Mirror"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {currentCharacter.is_alive ? `Quests Resolved: ${questCount} / 10` : "Your aura has dissolved. The link between dimensions is broken."}
        </p>
      </div>

      {transmissionStatus && (
        <div className="p-3 bg-purple-950/40 border border-purple-900 rounded-xl text-xs text-purple-300 text-center animate-fade-in">
          {transmissionStatus}
        </div>
      )}

      {!currentCharacter.is_alive ? (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="text-3xl text-center">🪞</div>
          <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider text-center">Psychic Interface Severed</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-serif bg-slate-950 p-4 rounded-xl border border-slate-850">
            Because you have split from the physical world, your scavenger hunt blueprints are gone. You can no longer interrogate the Game Master, and the deceased players can no longer read clues from your terminal. 
          </p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Interrogation Balance</span>
            <span className="bg-purple-950 border border-purple-800 text-purple-300 font-mono font-bold text-xs px-3 py-1 rounded-md">
              {credits} Tokens
            </span>
          </div>

          {questCount >= 10 ? (
            <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl text-center text-xs text-slate-300">
              👁️ Your mind has fully transitioned. All 10 vision realms have been conquered.
            </div>
          ) : cooldownLeft > 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">Psychic distortion clearing. Next vision in:</p>
              <div className="text-xl font-mono font-black text-purple-400 bg-slate-950 px-4 py-1 rounded-lg inline-block border border-slate-900">
                {formatTime(cooldownLeft)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSolveRiddle} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h2 className="text-xs font-black text-purple-400 uppercase tracking-wide">Vision Quest {questCount + 1}</h2>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-serif text-xs text-slate-300 leading-relaxed shadow-inner">
                {riddle?.riddle_text || "Downloading spiritual code sequences..."}
              </div>
              <input
                type="text"
                placeholder="Type your deciphered lowercase answer..."
                value={riddleInput}
                onChange={(e) => setRiddleInput(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-850 text-xs rounded-xl text-slate-200 focus:outline-none"
              />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition">
                Unlock Vision Channel
              </button>
            </form>
          )}

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wide">Project Ledger Interrogation</h2>
            {credits > 0 ? (
              <form onSubmit={handleTransmitInquiry} className="space-y-3">
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">-- Select Question Bank (Max 5 Available) --</option>
                  {questionBank.map(q => (
                    <option key={q.id} value={q.id}>{q.question_text}</option>
                  ))}
                </select>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-purple-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition">
                  Submit Inquiry to Game Master
                </button>
              </form>
            ) : (
              <p className="text-[11px] text-slate-500 italic text-center py-2 bg-slate-950 rounded-lg border border-slate-850">
                🔒 Interrogation desk locked. Solve the active vision quest riddle to earn question tokens.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

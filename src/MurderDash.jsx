import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function MurdererDash({ currentCharacter }) {
  const [targetPool, setTargetPool] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [riddle, setRiddle] = useState(null);
  const [riddleInput, setRiddleInput] = useState('');
  const [killCount, setKillCount] = useState(currentCharacter.total_kills_executed || 0);

  // Cooldown States
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchGameContext();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [killCount]);

  const fetchGameContext = async () => {
    // 1. Fetch current live, vulnerable players (Good team members who are alive)
    const { data: allPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('is_alive', true)
      .eq('team', 'good')
      .order('character_name', { ascending: true });

    if (allPlayers) {
      // ADAPTIVE LOGIC: Slice the array based on execution history
      if (killCount === 0) {
        setTargetPool(allPlayers.slice(0, 5)); // First 5 people bank
      } else if (killCount === 1) {
        setTargetPool(allPlayers.slice(0, 8)); // Expands to 8 people bank
      } else {
        setTargetPool(allPlayers); // Everyone else unlocked
      }
    }

    // 2. Fetch the corresponding riddle level
    const riddleLevel = (killCount % 5) + 1; // Loops riddles back if they get past 5 kills
    const { data: riddleData } = await supabase
      .from('murderer_riddles')
      .select('*')
      .eq('id', riddleLevel)
      .maybeSingle();
    if (riddleData) setRiddle(riddleData);

    // 3. Calculate 5-minute cooldown safety parameters
    const { data: freshMe } = await supabase
      .from('players')
      .select('last_kill_timestamp')
      .eq('id', currentCharacter.id)
      .single();

    if (freshMe?.last_kill_timestamp) {
      const lastKillTime = new Date(freshMe.last_kill_timestamp).getTime();
      const currentTime = new Date().getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;
      const msElapsed = currentTime - lastKillTime;

      if (msElapsed < fiveMinutesInMs) {
        const remainingSeconds = Math.ceil((fiveMinutesInMs - msElapsed) / 1000);
        startCooldownTimer(remainingSeconds);
      }
    }
  };

  const startCooldownTimer = (seconds) => {
    setCooldownTimeLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCooldownTimeLeft((prev) => {
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

  const handleStrike = async (e) => {
    e.preventDefault();
    if (!selectedTarget || !riddleInput.trim()) return;

    // 1. Validate Riddle Answer Key
    if (riddleInput.trim().toLowerCase() !== riddle.correct_key.toLowerCase()) {
      alert("❌ INCORRECT VERSE. The blueprint lock failed. Disperse immediately.");
      setRiddleInput('');
      return;
    }

    // 2. Double Check Cooldown Safety
    if (cooldownTimeLeft > 0) {
      alert("⚠️ Your adrenaline is too high! Wait for the tracking cooldown to clear.");
      return;
    }

    // 3. Query Target to check for Nurse Antidote/Immunity
    const { data: targetProfile } = await supabase
      .from('players')
      .select('*')
      .eq('id', selectedTarget)
      .single();

    if (targetProfile.nurse_immune) {
      alert("🛡️ CRISIS: Your attack vector was neutralized by a medical antidote! Escape the room!");
      // Consume the kill timestamp to trigger cooldown even on failure, giving the nurse strategy weight
      await supabase.from('players').update({ last_kill_timestamp: new Date().toISOString() }).eq('id', currentCharacter.id);
      await supabase.from('players').update({ nurse_immune: false }).eq('id', selectedTarget); // Pop immunity
      fetchGameContext();
      return;
    }

    // 4. EXECUTE ASSASSINATION TRANSACTION
    const nextKillTotal = killCount + 1;
    
    // Mark target as dead
    await supabase.from('players').update({ is_alive: false }).eq('id', selectedTarget);
    
    // Update murderer counters and time marks
    await supabase.from('players').update({
      total_kills_executed: nextKillTotal,
      last_kill_timestamp: new Date().toISOString()
    }).eq('id', currentCharacter.id);

    alert(`💀 Target Terminated. ${targetProfile.character_name} has been dropped from active logs.`);
    setKillCount(nextKillTotal);
    setRiddleInput('');
    setSelectedTarget('');
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-red-500">The Execution Deck</h1>
        <p className="text-xs text-slate-500 mt-1">Isolate your proximity targets, crack the algorithms, and clean up the board.</p>
      </div>

      {cooldownTimeLeft > 0 ? (
        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl text-center space-y-3">
          <div className="text-3xl animate-spin inline-block">⏳</div>
          <h3 className="text-base font-black text-red-400 uppercase tracking-wider">Adrenaline Cooldown Active</h3>
          <p className="text-xs text-slate-400">The mansion lines are tracing your energy. Stay low for:</p>
          <div className="text-2xl font-mono font-black text-white bg-slate-950 p-2 rounded-xl inline-block px-6 border border-slate-900">
            {formatTime(cooldownTimeLeft)}
          </div>
        </div>
      ) : (
        <form onSubmit={handleStrike} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          {/* Target Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Select Target Parameter</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-600"
            >
              <option value="">-- Choose Vulnerable Guest ({killCount === 0 ? "Bank of 5" : killCount === 1 ? "Bank of 8" : "All Unlocked"}) --</option>
              {targetPool.map(p => (
                <option key={p.id} value={p.id}>{p.character_name} ({p.real_name})</option>
              ))}
            </select>
          </div>

          {/* Riddle Lock Container */}
          <div className="space-y-2 pt-2 border-t border-slate-850">
            <label className="text-[10px] uppercase font-black tracking-wider text-amber-500 block">System Decryption Challenge Lock</label>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-serif text-xs text-slate-300 leading-relaxed shadow-inner">
              {riddle?.riddle_text || "Gathering decryption logs..."}
            </div>
            <input
              type="text"
              placeholder="Type decrypted lowercase key..."
              value={riddleInput}
              onChange={(e) => setRiddleInput(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-850 text-xs rounded-xl text-slate-200 focus:outline-none focus:border-red-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs border border-red-500/40 shadow-lg transition"
          >
            Authorize Fatal Strike Vector 🔪
          </button>
        </form>
      )}
    </div>
  );
}

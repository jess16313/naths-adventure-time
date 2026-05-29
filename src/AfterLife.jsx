import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function AfterlifePage({ currentCharacter }) {
  const [playerState, setPlayerState] = useState(currentCharacter);
  const [suspectList, setSuspectList] = useState([]);
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [unlockedHint, setUnlockedHint] = useState('');
  const [localAlert, setLocalAlert] = useState(null);
  
  // Realtime system tracking states
  const [isMediumDead, setIsMediumDead] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchSuspects();
    checkMediumVitalSigns();
    checkGuessCooldown();

    if (playerState.medium_discovered) {
      fetchTeamHint();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playerState.medium_discovered]);

  const fetchSuspects = async () => {
    const { data } = await supabase.from('players').select('character_name').order('character_name');
    if (data) setSuspectList(data.filter(p => p.character_name !== currentCharacter.character_name));
  };

  // FETCH STRATEGIC TEAM HINT DIRECTLY FROM TARGET TABLE
  const fetchTeamHint = async () => {
    // Determine target table based on player's team schema column
    const targetTable = currentCharacter.team === 'evil' ? 'ghost_evil_hints' : 'ghost_good_hints';
    
    const { data, error } = await supabase.from(targetTable).select('hint_text');
    
    if (error) {
      console.error("Hint load failure:", error.message);
      return;
    }

    if (data && data.length > 0) {
      // Deterministically pick a hint using the user's ID so it stays consistent across refreshes
      const hintIndex = currentCharacter.id % data.length;
      setUnlockedHint(data[hintIndex].hint_text);
    }
  };

  const checkMediumVitalSigns = async () => {
    const { data: mediumUser } = await supabase
      .from('players')
      .select('is_alive')
      .eq('role', 'medium')
      .maybeSingle();

    if (mediumUser && !mediumUser.is_alive) {
      setIsMediumDead(true);
    }
  };

  const checkGuessCooldown = async () => {
    const { data: freshMe } = await supabase
      .from('players')
      .select('last_kill_timestamp') 
      .eq('id', currentCharacter.id)
      .single();

    if (freshMe?.last_kill_timestamp) {
      const lastGuessTime = new Date(freshMe.last_kill_timestamp).getTime();
      const currentTime = new Date().getTime();
      const thirtyMinutesInMs = 30 * 60 * 1000;
      const msElapsed = currentTime - lastGuessTime;

      if (msElapsed < thirtyMinutesInMs) {
        const remainingSeconds = Math.ceil((thirtyMinutesInMs - msElapsed) / 1000);
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

  const handleIdentifyMedium = async (e) => {
    e.preventDefault();
    if (!selectedSuspect || cooldownTimeLeft > 0 || isMediumDead) return;

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
      setLocalAlert({ type: 'success', text: '🔮 LINK STABLE: Connection established. Your team hint manifests below.' });
    } else {
      const currentTimestamp = new Date().toISOString();
      await supabase.from('players').update({ last_kill_timestamp: currentTimestamp }).eq('id', currentCharacter.id);
      
      setLocalAlert({ type: 'error', text: '❌ JAMMED: That guest has no psychic link. Communications offline.' });
      startCooldownTimer(30 * 60); 
    }
    setSelectedSuspect('');
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* GLOBAL HEADERS AND RESTRICTIONS */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-cyan-400">The Underworld Echo</h1>
        <p className="text-xs text-slate-500 mt-1">Your mortal frame has expired. Navigate the spectral plane.</p>
        <p className="text-[10px] text-red-500 font-bold uppercase mt-2">
          🚫 Voter Restriction: Deceased players cannot vote in final deliberations.
        </p>
      </div>

      {localAlert && (
        <div className={`p-3 rounded-xl text-xs font-medium border relative animate-fade-in ${
          localAlert.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-red-950/80 border-red-900 text-red-300'
        }`}>
          <p>{localAlert.text}</p>
          <button onClick={() => setLocalAlert(null)} className="absolute top-2 right-2 opacity-50">✕</button>
        </div>
      )}

      {/* CASE 1: MEDIUM IS DEAD (PERMANENT LOSS OF HINT) */}
      {isMediumDead && !playerState.medium_discovered ? (
        <div className="bg-red-950/40 border border-red-900/50 p-6 rounded-2xl text-center space-y-2">
          <div className="text-4xl">🪦</div>
          <h3 className="text-base font-bold text-red-400 uppercase tracking-wide">Psychic Link Extinguished</h3>
          <p className="text-xs text-slate-400 font-serif leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900">
            The Medium has flatlined in the living world before you could align frequencies. The ethereal bridge is broken, and your hint is lost to the fog forever.
          </p>
        </div>
      ) : !playerState.medium_discovered ? (
        /* CASE 2: SEARCHING FOR THE MEDIUM (30 MIN COOLDOWN ACTIVE) */
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex gap-2 items-center text-amber-500 text-xs font-black uppercase tracking-wider">
            <span>🔒</span> Spectral Intercept Scrambled
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-serif bg-slate-950 p-4 rounded-xl border border-slate-850">
            "The spirit realm is static. You must locate the mansion's physical Medium to anchor your frequency and unlock your team's tactical hint ledger."
          </p>

          {cooldownTimeLeft > 0 ? (
            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-900 space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-500">Static Ethereal Jamming. Next alignment in:</p>
              <div className="text-xl font-mono font-black text-cyan-400">
                {formatTime(cooldownTimeLeft)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleIdentifyMedium} className="space-y-3">
              <select value={selectedSuspect} onChange={(e) => setSelectedSuspect(s.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500" >
                <option value="">-- Identify The Medium --</option>
                {suspectList.map(s => <option key={s.character_name} value={s.character_name}>{s.character_name}</option>)}
              </select>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide transition shadow-md">
                Link Ethereal Connection
              </button>
            </form>
          )}
        </div>
      ) : (
        /* CASE 3: MEDIUM DISCOVERED -> SHOW CLUE & ROAM NOTIFICATION */
        <div className="space-y-4">
          {/* THE MANIFESTED TEAM HINT */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                Manifested {currentCharacter.team === 'evil' ? 'Syndicate' : 'Detective'} Intel Clue
              </h3>
              <span className="text-[9px] bg-cyan-950 border border-cyan-800 px-1.5 py-0.5 rounded text-cyan-400 font-bold uppercase">
                {currentCharacter.team} hint unlocked
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-serif text-xs text-slate-300 leading-relaxed shadow-inner">
              "{unlockedHint || "Decrypting ancestral matrix ledger..."}"
            </div>
          </div>

          {/* OMNISCIENT OBSERVER CARD */}
          <div className="bg-cyan-950/20 border border-cyan-900/40 p-5 rounded-2xl text-center space-y-2">
            <div className="text-3xl">🕊️</div>
            <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider">Omniscient Observer Protocols</h4>
            <p className="text-xs text-slate-400 font-serif leading-relaxed">
              Your spectral anchors are fixed. You are now free to roam the mansion floors, assist your teammates verbally, or track game mechanics. Just remember, your voting card is destroyed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function AccompliceBox({ currentCharacter }) {
  const [playerList, setPlayerList] = useState([]);
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [sharedState, setSharedState] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const [localAlert, setLocalAlert] = useState(null);

  // 1. INITIAL LOADER MOUNT
  useEffect(() => {
    fetchRoster();
    fetchSharedState();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 2. REALTIME STATE WATCHER (Keeps all Accomplices synced instantly)
  useEffect(() => {
    const channelName = `accomplice-sync-${Math.random().toString(36).substring(7)}`;
    
    const sub = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'accomplice_state', filter: 'id=eq.1' },
        (payload) => {
          setSharedState(payload.new);
          calculateCooldown(payload.new.last_guess_timestamp);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchRoster = async () => {
    const { data } = await supabase.from('players').select('character_name').neq('role', 'accomplice');
    if (data) setPlayerList(data);
  };

  const fetchSharedState = async () => {
    const { data } = await supabase.from('accomplice_state').select('*').eq('id', 1).maybeSingle();
    if (data) {
      setSharedState(data);
      calculateCooldown(data.last_guess_timestamp);
    }
  };

  const calculateCooldown = (timestamp) => {
    if (!timestamp) return;
    const lastGuessTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const msElapsed = currentTime - lastGuessTime;

    if (msElapsed < thirtyMinutesInMs) {
      const remainingSeconds = Math.ceil((thirtyMinutesInMs - msElapsed) / 1000);
      setCooldown(remainingSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCooldown(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    if (!selectedSuspect || cooldown > 0) return;

    const { data: suspectProfile } = await supabase
      .from('players')
      .select('role')
      .eq('character_name', selectedSuspect)
      .single();

    const isCorrect = suspectProfile?.role === 'murderer';

    await supabase.from('accomplice_state').update({
      last_guess_timestamp: new Date().toISOString(),
      murderer_uncovered: isCorrect,
      latest_guess_text: `Latest Guess: ${selectedSuspect} — ${isCorrect ? 'SUCCESS ✅' : 'WRONG ❌'}`
    }).eq('id', 1);

    if (isCorrect) {
      setLocalAlert({ type: 'success', text: '🔥 CONSPIRACY ALIGNED: You found your master! Coordinate with them to clear the remaining targets.' });
    } else {
      setLocalAlert({ type: 'error', text: '❌ MISDIRECTION: That individual is not the killer. The transmission channel has jammed.' });
    }
    setSelectedSuspect('');
    fetchSharedState();
  };

  if (!sharedState) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
        Syncing encrypted communication links...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-orange-400">The Secret Channel</h1>
          <p className="text-xs text-slate-500 mt-1">Shared uplink portal pool.</p>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border h-fit ${
          sharedState.murderer_uncovered ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-red-950 text-red-400 border-red-900'
        }`}>
          {sharedState.murderer_uncovered ? "Linked to Killer" : "Unlinked"}
        </span>
      </div>

      {/* LOCAL ALERTS ROW */}
      {localAlert && (
        <div className={`p-3 rounded-xl text-xs font-medium border relative animate-fade-in ${
          localAlert.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-red-950/80 border-red-900 text-red-300'
        }`}>
          <p>{localAlert.text}</p>
          <button onClick={() => setLocalAlert(null)} className="absolute top-2 right-2 text-[10px] opacity-50">✕</button>
        </div>
      )}

      {/* TRANSMISSION TERMINAL PANEL */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[11px] text-center text-slate-400 font-mono">
          {sharedState.latest_guess_text || "Awaiting initial frequencies..."}
        </div>

        {sharedState.murderer_uncovered ? (
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl text-xs text-slate-300 leading-relaxed font-serif text-center space-y-2">
            <p>🎭 <strong>Transmission Secure:</strong> Your syndicate has successfully identified the killer.</p>
            <p className="text-[11px] text-slate-400">Coordinate silently in the room to back them up and protect their target sweeps.</p>
          </div>
        ) : cooldown > 0 ? (
          <div className="text-center py-4 space-y-2 bg-slate-950 rounded-xl border border-slate-850">
            <p className="text-[10px] uppercase font-bold text-slate-500">Static Interference. Channel opens in:</p>
            <div className="text-xl font-mono font-black text-orange-400">
              {formatTime(cooldown)}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitGuess} className="space-y-3">
            <select value={selectedSuspect} onChange={(e) => setSelectedSuspect(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500" >
              <option value="">-- Pinpoint The Killer --</option>
              {playerList.map(p => (
                <option key={p.character_name} value={p.character_name}>{p.character_name}</option>
              ))}
            </select>
            <button type="submit" className="w-full bg-orange-700 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wide transition shadow-md">
              Transmit Identification Frequency
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

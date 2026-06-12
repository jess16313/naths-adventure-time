import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/login';
import MinigameOverlay from './components/minigame';
import Thief from './components/roles/thief';
import Liar from './components/roles/liar';
import Priest from './components/roles/priest';
import Kidnapper from './components/roles/kidnapper';
import Interrogator from './components/roles/interrogator';
import HintGiver from './components/roles/hint_giver';

export default function App() {
  const [userId, setUserId] = useState(() => {
    const savedSession = localStorage.getItem('ooo_party_session');
    return savedSession ? parseInt(savedSession, 10) : null;
  });

  const [playerState, setPlayerState] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  
  // 🔔 FLOATING IN-APP NOTIFICATION NOTIFIER STATES
  const [notification, setNotification] = useState(null);

  const handleCustomLogin = async (submittedName, submittedPassword, callback) => {
    setLoading(true);
    let { data, error } = await supabase
      .from('player')
      .select('id')
      .ilike('character_name', submittedName)
      .eq('password', submittedPassword)
      .maybeSingle();

    if (data) {
      localStorage.setItem('ooo_party_session', data.id.toString());
      setUserId(data.id);
      if (typeof callback === 'function') callback(true);
    } else {
      setLoading(false);
      if (typeof callback === 'function') callback(false);
    }
  };

  // --- AUTOMATED TIMELINE INJECTOR COOLDOWN RULES ---
  const evaluateCooldownState = async (playerProfile) => {
    if (!playerProfile) return;
    
    const currentRole = playerProfile.role?.toLowerCase();
    if (currentRole === 'hint giver') return;
    
    if (
      playerProfile.current_active_minigame || 
      playerProfile.is_kidnapped || 
      playerProfile.is_paused
    ) return;

    if ((playerProfile.minigame_count || 0) >= 10) {
      setShowVictoryModal(true);
      return;
    }

    // ⏳ STARTUP DELAY LOGIC CHECK
    // If game_timer_status says 'waiting_initial', they are locked in the 15-minute start room!
    if (playerProfile.game_timer_status === 'waiting_initial') {
      if (!playerProfile.next_game_at) return;

      const targetTriggerTime = new Date(playerProfile.next_game_at).getTime();
      const currentTime = new Date().getTime();

      // If the countdown time is in the past, the 15-minute buffer is cleared! Launch level 1
      if (currentTime >= targetTriggerTime) {
        await supabase
          .from('player')
          .update({ 
            current_active_minigame: 1,
            game_timer_status: 'active',
            last_minigame_completed: new Date().toISOString()
          })
          .eq('id', playerProfile.id);
      }
      return;
    }

    // Standard 15-minute cooldown loop tracker for post-game intervals
    if (!playerProfile.last_minigame_completed) return;

    const lastFinishedTime = new Date(playerProfile.last_minigame_completed).getTime();
    const currentTime = new Date().getTime();
    const minutesElapsed = (currentTime - lastFinishedTime) / (1000 * 60);

    if (minutesElapsed >= 15) {
      const nextLevelId = (playerProfile.minigame_count || 0) + 1;
      await supabase
        .from('player')
        .update({ current_active_minigame: nextLevelId })
        .eq('id', playerProfile.id);
    }
  };

  // Automated cron polling check loop to monitor delays while app tab remains open passively
  useEffect(() => {
    if (!playerState || playerState.role?.toLowerCase() === 'hint giver') return;
    
    const interval = setInterval(() => {
      evaluateCooldownState(playerState);
    }, 10000); // Pulse check database state logic arrays internally every 10 seconds

    return () => clearInterval(interval);
  }, [playerState]);

  // Handle auto-clear timing for our beautiful floating app headers
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const fetchPlayerState = async () => {
      let { data, error } = await supabase
        .from('player')
        .select(`*`)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        setDbError(error.message);
      } else if (data) {
        setPlayerState(data);
        setCompletedCount(data.minigame_count || 0);
        evaluateCooldownState(data);
      }
      setLoading(false);
    };

    fetchPlayerState();

    const stateChannel = supabase
      .channel(`live_game_global_sync`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player' }, (payload) => {
        if (payload.new && payload.new.id === userId) {
          console.log('Realtime global payload segment update received:', payload.new);
          
          // 🔔 CONVERT HARD ALERTS TO SYSTEM NOTIFICATION BANNERS
          if (payload.new.is_kidnapped && !playerState?.is_kidnapped) {
            setNotification({ message: "⚠️ TERMINAL HIJACK! You have been captured by the Kidnapper!", type: "error" });
          } else if (!payload.new.is_kidnapped && playerState?.is_kidnapped) {
            setNotification({ message: "🔓 Connection Restored. You have been released.", type: "success" });
          } else if (payload.new.current_active_minigame && !playerState?.current_active_minigame) {
            setNotification({ message: "🎮 NEW INFILTRATION LOOP INJECTED! Access terminal code panels.", type: "info" });
          } else if (payload.new.thief_number !== playerState?.thief_number) {
            setNotification({ message: "💎 Mission Intel Updated. New Coordinate Sectors Logged.", type: "info" });
          }

          setPlayerState(payload.new);
          setCompletedCount(payload.new.minigame_count || 0);
          evaluateCooldownState(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
    };
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen w-full bg-cover bg-center bg-fixed flex items-center justify-center" style={{ backgroundImage: `url('/assets/default-ooo-background.png')` }}>
        <Login onLoginSuccess={(name, pass, cb) => handleCustomLogin(name, pass, cb)} />
      </div>
    );
  }

  if (loading && !playerState) return <div className="text-white text-center mt-20 font-mono text-xs tracking-widest animate-pulse">Decoding Profile Sync...</div>;
  if (dbError) return <div className="text-red-400 text-center mt-20 font-mono text-sm">💥 Connection Failed: {dbError}</div>;
  if (!playerState) return <div className="text-amber-400 text-center mt-20 font-mono text-xs tracking-widest">🕵️‍♂️ Connecting Terminal Node to Matrix...</div>;

  const currentRole = playerState.role?.toLowerCase();

  // ⏳ THEMED GAME NOT STARTED COUNTDOWN CARD BLOCK
  if (playerState.game_timer_status === 'waiting_initial' && currentRole !== 'hint giver') {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden select-none">
        <div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-10" style={{ backgroundImage: `url('/assets/default-ooo-background.png')` }} />
        <div className="max-w-sm space-y-5">
          <span className="text-6xl block animate-spin [animation-duration:4s]">⏳</span>
          <h2 className="text-2xl font-black text-sky-400 tracking-widest uppercase">TACTICAL UPLINK STAGED</h2>
          <div className="bg-slate-900/80 border border-sky-500/20 p-5 rounded-2xl shadow-2xl font-mono text-xs text-gray-400 leading-relaxed text-left space-y-2">
            <p className="text-emerald-400 font-bold animate-pulse">// SYSTEM: WAITING FOR STARTUP PROTOCOLS</p>
            <p>Your terminal credentials are verified. The Game Master has initialized your 15-minute synchronization timer buffer.</p>
            <p className="text-[10px] text-gray-500 pt-2 border-t border-white/5">Stay on this terminal node. Active riddle blueprints and minigame loops will stream down automatically when the countdown hits zero.</p>
          </div>
        </div>
      </div>
    );
  }

  // 👺 INTERCEPT ACTIVE LOCKOUT SCREEN OVERLAY
  if (playerState.is_kidnapped && currentRole !== 'kidnapper' && currentRole !== 'hint giver') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden animate-fadeIn">
        <div className="max-w-sm space-y-6 animate-pulse">
          <span className="text-8xl block filter drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">👺</span>
          <h2 className="text-3xl font-black text-rose-500 uppercase tracking-widest">TERMINAL HIJACKED</h2>
          <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <p className="font-mono text-[10px] text-rose-400 font-black uppercase tracking-widest">// Neural Link Captured //</p>
            <p className="text-sm text-gray-300 leading-relaxed">Your device link has been isolated and frozen in the Nightosphere. Your active game timers and module pipelines are entirely suspended.</p>
            <p className="text-xs text-gray-400 italic pt-2 border-t border-white/5">Acknowledge your captor physically. Await authorization protocols from the Kidnapper interface to release this terminal cluster.</p>
          </div>
        </div>
      </div>
    );
  }

  if (playerState.current_active_minigame) {
    return <MinigameOverlay minigameId={playerState.current_active_minigame} userId={userId} />;
  }
  if (playerState.current_active_minigame) {
    return <MinigameOverlay minigameId={playerState.current_active_minigame} userId={userId} />;
  }

  const backgroundUrl = playerState.player_background || '/assets/default-ooo-background.png';

  return (
    <div className="relative min-h-screen w-full overflow-y-auto text-gray-200 transition-all duration-500">
      
      <div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${backgroundUrl}')` }} />

      {/* 🔔 FLOATING IN-APP FLOATING NOTIFICATION BANNER HEADER ELEMENT */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm pointer-events-none animate-slideDown">
          <div className={`backdrop-blur-md px-4 py-3.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider text-center shadow-2xl flex items-center justify-center gap-2 ${
            notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-400' :
            notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400' :
            'bg-slate-950/90 border-amber-500/40 text-amber-400'
          }`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Dynamic Header Display Card */}
      <div className="h-[100dvh] w-full flex flex-col justify-between p-8 bg-gradient-to-b from-black/60 via-transparent to-black/80">
        <div className="backdrop-blur-md bg-black/40 p-6 rounded-2xl max-w-sm border border-white/10 mt-10">
          <h1 className="text-3xl font-extrabold text-white uppercase">{playerState.player_name}</h1>
          <p className="text-xl font-medium text-slate-300 mt-1 uppercase tracking-wider italic">Character: {playerState.character_name}</p>
          <p className="text-xl font-medium text-amber-400 mt-1 uppercase tracking-wider">Role: {playerState.role}</p>
          <div className="mt-4">
            <span className="bg-amber-500 text-slate-900 px-2.5 py-0.5 rounded-full font-bold text-sm">{completedCount} PTS</span>
          </div>
        </div>
        <div className="w-full text-center text-white/60 text-sm font-semibold tracking-widest animate-bounce mb-6">SCROLL DOWN FOR STORY ↓</div>
      </div>

      {/* Role Content Routers Box panel */}
      <div className="w-full max-w-2xl mx-auto px-6 pb-32">
        <div className="backdrop-blur-xl bg-slate-950/90 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8">
          <div className="border-b border-white/10 pb-4 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Your Mission</h2>
            {currentRole !== 'hint giver' && (
              <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">System Hijack loop active</span>
            )}
          </div>

          {currentRole === 'thief' && <Thief playerState={playerState} />}
          {currentRole === 'liar' && <Liar playerState={playerState} />}
          {currentRole === 'priest' && <Priest playerState={playerState} />}
          {currentRole === 'kidnapper' && <Kidnapper currentGmId={userId} />}
          {currentRole === 'interrogator' && <Interrogator completedCount={completedCount} />}
          {currentRole === 'hint giver' && <HintGiver currentGmId={userId}/>}

          <button 
            onClick={() => { localStorage.removeItem('ooo_party_session'); window.location.reload(); }} 
            className="mt-8 text-xs text-gray-500 hover:text-rose-400 underline uppercase tracking-widest block mx-auto pt-4 border-t border-white/5 w-full text-center" 
          >
            Logout / Reset Terminal
          </button>
        </div>
      </div>

      {/* Victory Modal */}
      {showVictoryModal && currentRole !== 'hint giver' && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm border-4 border-amber-500/30 bg-slate-900 rounded-3xl p-8 shadow-2xl text-center space-y-4 animate-fadeIn">
            <span className="text-6xl block animate-bounce">🏆</span>
            <h3 className="text-3xl font-black text-amber-400 tracking-widest uppercase">CORE OVERRIDE</h3>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide">All Cooldown Modules Settled!</p>
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl text-left mt-2 space-y-1">
              <span className="font-mono text-[10px] text-amber-300 font-bold block uppercase tracking-wider">%F0%9F%94%93 Vault Token Segment Decoded:</span>
              <p className="text-xs text-gray-300 leading-relaxed">You have proved your core capability. Here are the last two numbers of your four-digit final combinations key:</p>
              <p className="font-mono text-3xl text-center text-emerald-400 tracking-widest bg-black/80 py-3 rounded-xl border border-emerald-500/20 font-black mt-2"> XX-42 </p>
            </div>
            <button onClick={() => setShowVictoryModal(false)} className="mt-2 w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-500/10" > Close </button>
          </div>
        </div>
      )}
    </div>
  );
}


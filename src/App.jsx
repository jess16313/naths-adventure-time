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
  // Read session token memory directly out of device local settings
  const [userId, setUserId] = useState(() => {
    const savedSession = localStorage.getItem('ooo_party_session');
    return savedSession ? parseInt(savedSession, 10) : null;
  });

  const [playerState, setPlayerState] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Handshake route parsing values cleanly up from Login.jsx template
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
    
    // Guardrail: Never let automatic game triggers disrupt Hint Givers!
    if (playerProfile.role?.toLowerCase() === 'hint giver') return;
    
    if (
      playerProfile.current_active_minigame || 
      playerProfile.is_kidnapped || 
      playerProfile.is_paused
    ) return;

    // Open victory window if they hit 10 or more games, and stop timer injections
    if ((playerProfile.minigame_count || 0) >= 10) {
      setShowVictoryModal(true);
      return;
    }

    if (!playerProfile.last_minigame_completed) {
      await injectNextLevel(playerProfile.id, 1);
      return;
    }

    const lastFinishedTime = new Date(playerProfile.last_minigame_completed).getTime();
    const currentTime = new Date().getTime();
    const minutesElapsed = (currentTime - lastFinishedTime) / (1000 * 60);

    if (minutesElapsed >= 15) {
      const nextLevelId = (playerProfile.minigame_count || 0) + 1;
      await injectNextLevel(playerProfile.id, nextLevelId);
    }
  };

  const injectNextLevel = async (playerId, levelNumber) => {
    await supabase
      .from('player')
      .update({ current_active_minigame: levelNumber })
      .eq('id', playerId);
  };

  // --- REFACTOR FIXED DATA STORAGE ENGINE HANDLER ---
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const fetchPlayerState = async () => {
      let { data, error } = await supabase
        .from('player')
        .select(`id, player_name, character_name, role, is_paused, paused_until, is_kidnapped, last_minigame_completed, minigame_count, games_finished, player_background, current_active_minigame`)
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

    // ⚡ CLEAN COUPLING WEB-SOCKET SYNCHRONIZATION RUNTIME
    const stateChannel = supabase
      .channel(`live_game_global_sync`)
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'player' 
        }, 
        (payload) => {
          // If the broadcast updates our specific user profile row, save it
          if (payload.new && payload.new.id === userId) {
            console.log('Realtime global payload segment update received:', payload.new);
            setPlayerState(payload.new);
            setCompletedCount(payload.new.minigame_count || 0);
            evaluateCooldownState(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
    };
  }, [userId]);

  // --- 1. IF NO USER ID PIN ENTERED, SHOW LOGIN CARD ---
  if (!userId) {
    return (
      <div 
        className="min-h-screen w-full bg-cover bg-center bg-fixed flex items-center justify-center" 
        style={{ backgroundImage: `url('/assets/default-ooo-background.png')` }}
      >
        <Login onLoginSuccess={(name, pass, cb) => handleCustomLogin(name, pass, cb)} />
      </div>
    );
  }

  // --- 2. LOGISTICS STRUCTURAL SCREEN OVERLAYS ---
  if (loading && !playerState) return <div className="text-white text-center mt-20 font-mono text-xs tracking-widest animate-pulse">Decoding Profile Sync...</div>;
  if (dbError) return <div className="text-red-400 text-center mt-20 font-mono text-sm">💥 Connection Failed: {dbError}</div>;
  if (!playerState) return <div className="text-amber-400 text-center mt-20 font-mono text-xs tracking-widest">🕵️‍♂️ Connecting Terminal Node to Matrix...</div>;

  // System Hijack Overrides 
    // System Hijack Overrides 
  if (playerState.current_active_minigame) {
    return <MinigameOverlay minigameId={playerState.current_active_minigame} userId={userId} />;
  }

  // 🚨 NEW HACK: EXPLICIT REAL-TIME KIDNAPPED INTERCEPT TERMINAL SCREEN
  // If the database row flag drops to true, lock the player's canvas layer completely
  if (playerState.is_kidnapped && currentRole !== 'kidnapper' && currentRole !== 'hint giver') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden animate-fadeIn">
        {/* Animated Background Overlay elements (Placeholder grid for your custom art later) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-sm space-y-6 animate-pulse">
          {/* Main Visual Indicator */}
          <span className="text-8xl block filter drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">👺</span>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-rose-500 uppercase tracking-widest">
              TERMINAL HIJACKED
            </h2>
            <div className="h-0.5 w-24 bg-rose-600 mx-auto rounded-full" />
          </div>

          <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <p className="font-mono text-[10px] text-rose-400 font-black uppercase tracking-widest animate-pulse">
              // Neural Link Captured by Kidnapper //
            </p>
            
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              Your device link has been isolated and frozen in the Nightosphere. Your active game timers and module pipelines are entirely suspended.
            </p>

            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Current Objective:
              </p>
              <p className="text-xs text-gray-400 mt-1 italic">
                Acknowledge your captor physically. Await authorization protocols from the Kidnapper interface to release this terminal cluster.
              </p>
            </div>
          </div>

          {/* Locked status notice */}
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            🔒 Hardware Intercept Active. Escape routes unavailable.
          </p>
        </div>
      </div>
    );
  }

  // --- 3. DYNAMIC TIMELINE STREAM DISPLAY GRAPHICS ---
  const backgroundUrl = playerState.player_background || '/assets/default-ooo-background.png';
  
  // Normalize casing for role checks to prevent mismatch syntax errors
  const currentRole = playerState.role?.toLowerCase();

  return (
    <div className="relative min-h-screen w-full overflow-y-auto text-gray-200 transition-all duration-500">
      
      {/* FIXED BACKGROUND LAYER FIX */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: `url('${backgroundUrl}')` }} 
      />

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

      <div className="h-[60vh] w-full" />

      {/* Role Content Routers Box panel */}
      <div className="w-full max-w-2xl mx-auto px-6 pb-32">
        <div className="backdrop-blur-xl bg-slate-950/90 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8">
          <div className="border-b border-white/10 pb-4 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Your Mission</h2>
            {currentRole !== 'hint giver' && (
              <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">
                System Hijack loop active
              </span>
            )}
          </div>

          {/* Render conditions mapped precisely to lowercase values */}
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
              <span className="font-mono text-[10px] text-amber-300 font-bold block uppercase tracking-wider">%F0%9F%94%93 Vault Token Segment Decoded:</span>
              <p className="text-xs text-gray-300 leading-relaxed">You have proved your core capability. Here are the last two numbers of your four-digit final combinations key:</p>
              <p className="font-mono text-3xl text-center text-emerald-400 tracking-widest bg-black/80 py-3 rounded-xl border border-emerald-500/20 font-black mt-2"> XX-42 </p>
            </div>
            <button onClick={() => setShowVictoryModal(false)} className="mt-2 w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-500/10" >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

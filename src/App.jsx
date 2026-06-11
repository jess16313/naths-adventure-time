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
  const [showVictoryModal, setShowVictoryModal] = useState(false); // Tracks completion card reveal

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
    if (playerProfile.role === 'Hint Giver') return; 

    if ( 
      playerProfile.current_active_minigame || 
      playerProfile.is_kidnapped || 
      playerProfile.is_paused 
    ) return; 

    // Open victory window if they hit 10 or more games, and stop timer injections

    if ((playerProfile.minigame_count || 0) >= 10){
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

    // Open persistent live update synchronizing subscription channel socket
    const stateChannel = supabase 
      .channel(`live_game_${userId}`) 
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player', filter: `id=eq.${userId}` }, 
        (payload) => { 
          if (payload.new) { 
            setPlayerState(payload.new); 
            setCompletedCount(payload.new.minigame_count || 0); 
            evaluateCooldownState(payload.new); 
          } 
        }
      ).subscribe(); 

    return () => supabase.removeChannel(stateChannel); 
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
  if (loading) return <div className="text-white text-center mt-20">Decoding Profile Sync...</div>; 
  if (dbError) return <div className="text-red-400 text-center mt-20">💥 Connection Failed: {dbError}</div>; 
  if (!playerState) return <div className="text-amber-400 text-center mt-20">🕵️‍♂️ Sync Verification Error</div>; 

  // System Hijack Overrides
  if (playerState.current_active_minigame) { 
    return <MinigameOverlay minigameId={playerState.current_active_minigame} userId={userId} />; 
  } 

  // --- 3. DYNAMIC TIMELINE STREAM DISPLAY GRAPHICS ---
  const backgroundUrl = playerState.player_background || '/assets/default-ooo-background.png'; 

  return ( 
    <div 
      className="min-h-screen w-full overflow-y-auto bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500" 
      style={{ backgroundImage: `url('${backgroundUrl}')` }} 
    > 
      {/* Dynamic Header Display Card */} 
      <div className="h-screen w-full flex flex-col justify-between p-8 bg-gradient-to-b from-black/60 via-transparent to-black/80"> 
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
        <div className="backdrop-blur-xl bg-slate-950/90 border border-white/10 rounded-3xl p-8 shadow-2xl text-gray-200 space-y-8"> 
          <div className="border-b border-white/10 pb-4 flex justify-between items-center"> 
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Your Mission</h2> 
            {playerState.role !== 'Hint Giver' && (
              <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">
                System Hijack loop active
              </span>
            )}
          </div> 
          
          {playerState.role === 'thief' && <Thief />} 
          {playerState.role === 'liar' && <Liar playerState={playerState} />} 
          {playerState.role === 'priest' && <Priest playerState={playerState} />} 
          {playerState.role === 'kidnapper' && <Kidnapper />} 
          {playerState.role === 'interrogator' && <Interrogator completedCount={completedCount} />} 
          {playerState.role === 'hint giver' && <HintGiver currentGmId={userId}/>} 

          <button 
            onClick={() => { 
              localStorage.removeItem('ooo_party_session'); 
              window.location.reload(); 
            }} 
            className="mt-8 text-xs text-gray-500 hover:text-rose-400 underline uppercase tracking-widest block mx-auto pt-4 border-t border-white/5 w-full text-center" 
          > 
            Logout / Reset Terminal 
          </button> 
        </div> 
      </div>
      {showVictoryModal && playerState.role !== 'Hint Giver' && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm border-4 border-amber-500/30 bg-slate-900 rounded-3xl p-8 shadow-2xl text-center space-y-4 animate-fadeIn">
            <span className="text-6xl block animate-bounce">🏆</span>
            <h3 className="text-3xl font-black text-amber-400 tracking-widest uppercase">CORE OVERRIDE</h3>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide">All Cooldown Modules Settled!</p>
            
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl text-left mt-2 space-y-1">
              <span className="font-mono text-[10px] text-amber-300 font-bold block uppercase tracking-wider">🔓 Vault Token Segment Decoded:</span>
              <p className="text-xs text-gray-300 leading-relaxed">You have proved your core capability. Here are the last two numbers of your four-digit final combinations key:</p>
              <p className="font-mono text-3xl text-center text-emerald-400 tracking-widest bg-black/80 py-3 rounded-xl border border-emerald-500/20 font-black mt-2">
                XX-42
              </p>
            </div>
            <button 
              onClick={() => setShowVictoryModal(false)} 
              className="mt-2 w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-500/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div> 
  ); 
}
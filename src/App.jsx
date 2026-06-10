import React, { useState, useEffect } from 'react'; 
import { supabase } from './supabaseClient'; 
import Login from './components/Login'; // <-- Import the login card element
import MinigameOverlay from './components/minigame'; 
import Thief from './components/roles/Thief';
import Liar from './components/roles/Liar';
import Priest from './components/roles/Priest';
import Kidnapper from './components/roles/Kidnapper';
import Interrogator from './components/roles/Interrogator';
import HintGiver from './components/roles/hint_giver';

export default function App() { 
  // Initialize state variable as null instead of a hardcoded 1
  const [userId, setUserId] = useState(() => {
    const savedSession = localStorage.getItem('ooo_party_session');
  return savedSession ? parseInt(savedSession, 10) : null;
  }); 
  
  const [playerState, setPlayerState] = useState(null); 
  const [completedCount, setCompletedCount] = useState(0); 
  const [loading, setLoading] = useState(false); // Default to false initially
  const [dbError, setDbError] = useState(null); 

  // Handles real-time verification handshake from Login.jsx
  const handleCustomLogin = async (submittedName, submittedPassword, callback) => {
    setLoading(true);

    let { data, error } = await supabase
      .from('player')
      .select('id')
      .ilike('character_name', submittedName)
      .eq('password', submittedPassword)
      .maybeSingle();

    if (data) {
      localStorage.setItem('ooo_party_session', data.id.toString()); // Save session for persistence
      setUserId(data.id); // Triggers our database engine subscription hook below!
      callback(true); // Tell the login prompt it succeeded
    } else {
      setLoading(false);
      callback(false); // Tell the login prompt it failed
    }
  };

  useEffect(() => { 
    if (!userId) return; // Wait to execute until a numeric pin is input successfully

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
      } 
      setLoading(false); 
    }; 

    fetchPlayerState(); 

const stateChannel = supabase
  .channel(`live_game_${userId}`)
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'player', 
    filter: `id=eq.${userId}` 
  }, (payload) => { 
    if (payload.new) {
      setPlayerState(payload.new); 
      setCompletedCount(payload.new.minigame_count || 0); 
    }
  }) 
  .subscribe();


    return () => supabase.removeChannel(stateChannel); 
  }, [userId]); 

  // --- 1. IF NO USER ID PIN ENTERED, SHOW LOGIN CARD ---
  if (!userId) {
    return (
      <div 
        className="min-h-screen w-full bg-cover bg-center bg-fixed flex items-center justify-center"
        style={{ backgroundImage: `url('/assets/default-ooo-background.png')` }}
      >
        <Login onLoginSuccess={handleCustomLogin} />
      </div>
    );
  }

  // --- 2. STANDARD STATE RENDERING CONTINUES DOWN HERE --- 
  if (loading) return <div className="text-white text-center mt-20">Decoding Profile Sync...</div>; 
  if (dbError) return <div className="text-red-400 text-center mt-20">💥 Connection Failed: {dbError}</div>; 
  if (!playerState) return <div className="text-amber-400 text-center mt-20">🕵️‍♂️ Sync Verification Error</div>;

  if (playerState.current_active_minigame) { 
    return <MinigameOverlay minigameId={playerState.current_active_minigame} userId={userId} />; 
  } 

  return ( 
    <div 
      className="min-h-screen w-full overflow-y-auto bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500" 
      style={{ backgroundImage: `url('${playerState.player_background || ""}')` }} 
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

      {/* Role Content Routers */}
      <div className="w-full max-w-2xl mx-auto px-6 pb-32">
        <div className="backdrop-blur-xl bg-slate-950/90 border border-white/10 rounded-3xl p-8 shadow-2xl text-gray-200 space-y-8">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Your Mission</h2>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('ooo_party_session'); // Clear the browser vault
              window.location.reload(); // Hard-refresh the page to show the login screen again
            }}
            className="mt-8 text-xs text-gray-500 hover:text-rose-400 underline uppercase tracking-widest block mx-auto"
          >
            Logout / Reset Terminal
          </button>
          {playerState.role === 'Thief' && <Thief />}
          {playerState.role === 'Liar' && <Liar playerState={playerState} />}
          {playerState.role === 'Priest' && <Priest playerState={playerState} />}
          {playerState.role === 'Kidnapper' && <Kidnapper />}
          {playerState.role === 'Interrogator' && <Interrogator completedCount={completedCount} />}
          {playerState.role === 'hint giver' && <HintGiver currentGmId={userId}/>}
        </div>
      </div>
    </div> 
  ); 
}

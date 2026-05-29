import { useState, useEffect } from 'react' 
import NavBar from './nav-bar' 
import { supabase } from './supabaseClient'; 
import AttendeeList from './attendees'; 
import NotesPage from './notes'; 
import EvidencePage from './Evidence'; 
import HostPanel from './HostPanel'; 
import VotingBooth from './Vote'; 
import MurdererDash from './MurderDash'; 
import AfterlifePage from './AfterLife'; 
import AccompliceBox from './Accomplice'; 
import ImposterDash from './Imposter'; 
import MediumRoom from './MediumRoom'; 
import NursePanel from './NursePanel'; 
import { LivingMediumView, DeadMediumView } from './Medium';
import OneSignal from 'react-onesignal'; 

export default function App() { 
  const [character, setCharacter] = useState(null); 
  const [loginInput, setLoginInput] = useState(''); 
  const [pinInput, setPinInput] = useState(''); 
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [errorMsg, setErrorMsg] = useState(''); 
  const [broadcastMessage, setBroadcastMessage] = useState('Loading broadcast protocols...'); 
  const [globalBanner, setGlobalBanner] = useState(null);

  // Hook 8: Persistent storage authentication link check
  useEffect(() => { 
    const savedName = localStorage.getItem('mystery_character_name'); 
    const savedPin = localStorage.getItem('mystery_character_pin'); 
    
    if (savedName && savedPin) { 
      fetchUserProfile(savedName, savedPin); 
    } 
  }, []); 

  // Hook 9: Real-time system broadcast stream
  useEffect(() => { 
    // FIXED: Removed the early return statement from the trunk line
    if (character) {
      async function fetchCurrentAlert() { 
        const { data } = await supabase.from('active_broadcast').select('message_text').eq('id', 1).maybeSingle(); 
        if (data) setBroadcastMessage(data.message_text); 
      } 
      fetchCurrentAlert(); 

      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Push communications approved by user!');
            // Get the phone's hardware registration address token here to link to Supabase later
          }
        });
      }
      if (window.OneSignal) {
      useEffect(() => {
        OneSignal.init({ 
          appId: "97d83ae0-54b0-4bdf-9ced-69ceab157324",
          allowLocalhostAsSecureOrigin: true 
        });
      }, []);}
      else {
        console.log("OneSignal SDK hasn't loaded yet.");
      }

      const alertSub = supabase 
        .channel('live-alerts') 
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'active_broadcast' }, (payload) => { 
          setBroadcastMessage(payload.new.message_text); 
        }) 
        .subscribe(); 

      return () => supabase.removeChannel(alertSub); 
    }
  }, [character]); 

  // Hook 10: Global breakthrough and elimination watcher
  useEffect(() => { 
    // FIXED: Wrapped the logic inside the condition block, ensuring the hook executes safely
    if (character) {
      const globalSub = supabase.channel('mansion-pulse') 
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => { 
          if (payload.old.is_alive === true && payload.new.is_alive === false) { 
            triggerBanner(`🚨 MEDICAL EMERGENCY: ${payload.new.character_name} has flatlined.`); 
          } 
        }) 
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evidence' }, (payload) => { 
          if (payload.old.is_discovered === false && payload.new.is_discovered === true) { 
            triggerBanner(`🔍 BREAKTHROUGH: "${payload.new.evidence_name}" has been uncovered! Check your vault files.`); 
          } 
        }) 
        .subscribe(); 

      return () => supabase.removeChannel(globalSub); 
    }
  }, [character]); 

  // =========================================================================
  // 2. BACKEND LOGIC ACTIONS
  // =========================================================================
  async function fetchUserProfile(name, pin) { 
    const { data } = await supabase 
      .from('players') 
      .select('*') 
      .ilike('character_name', name) 
      .eq('passcode', pin) 
      .maybeSingle(); 

    if (data) { 
      setCharacter(data); 
      setActiveTab('dashboard'); 
      setErrorMsg(''); 
    } else { 
      setErrorMsg('Access Denied. Character name or security passcode is invalid.'); 
      localStorage.removeItem('mystery_character_name'); 
      localStorage.removeItem('mystery_character_pin'); 
    } 
  } 

  const triggerBanner = (msg) => {
    setGlobalBanner(msg);
    setTimeout(() => setGlobalBanner(null), 7000); 
  };

  const handleLogin = (e) => { 
    e.preventDefault(); 
    if (!loginInput.trim() || !pinInput.trim()) return; 

    localStorage.setItem('mystery_character_name', loginInput.trim()); 
    localStorage.setItem('mystery_character_pin', pinInput.trim()); 
    
    fetchUserProfile(loginInput.trim(), pinInput.trim()); 
  }; 

  const handleLogout = () => { 
    localStorage.removeItem('mystery_character_name'); 
    localStorage.removeItem('mystery_character_pin'); 
    setCharacter(null); 
    setLoginInput(''); 
    setPinInput(''); 
  }; 

  // =========================================================================
  // 3. INTERFACE SCREEN BLOCKS RENDER
  // =========================================================================
  if (!character) { 
    return ( 
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-6 text-white text-center"> 
        <div className="max-w-md w-full space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl"> 
          <h1 className="text-3xl font-extrabold text-red-500 tracking-wider uppercase">Mansion Mystery</h1> 
          <p className="text-slate-400 text-sm">Enter your assigned character name to access the case files.</p> 
          <form onSubmit={handleLogin} className="space-y-4"> 
            <div> 
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-left block mb-1">Character Alias Name</label> 
              <input type="text" placeholder="e.g., Lord Amber" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500" /> 
            </div> 
            <div> 
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-left block mb-1">4-Digit Security Passcode</label> 
              <input type="password" inputMode="numeric" placeholder="••••" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 tracking-widest font-mono text-center" /> 
            </div> 
            {errorMsg && <p className="text-red-500 text-xs font-semibold">{errorMsg}</p>} 
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg font-bold tracking-wide uppercase transition mt-2 text-xs"> 
              Decrypt Case Files 🔓
            </button> 
          </form> 
        </div> 
      </div> 
    ); 
  } 

  return ( 
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden"> 
      
      {/* FLOATING IN-APP POPUP NOTIFICATION DECK */}
      {globalBanner && (
        <div className="fixed top-4 left-4 right-4 bg-amber-600 p-3 rounded-xl border border-amber-500 shadow-2xl z-50 text-xs font-black text-center animate-slide-down">
          {globalBanner}
        </div>
      )}

      {/* SYSTEM FEED TAPE */}
      <div className="bg-red-600 p-3 text-center font-bold text-sm tracking-wide shadow-md"> 
        {broadcastMessage} 
      </div> 

      {/* CORE DISPLAY PORT CONTAINER */} 
      <main className="flex-1 overflow-y-auto p-6 pb-28"> 
        
        {activeTab === 'dashboard' && ( 
          <div className="space-y-6"> 
            <div className="flex justify-between items-center"> 
              <h1 className="text-xl font-bold tracking-widest uppercase text-slate-400">Case Files</h1> 
              <button onClick={handleLogout} className="text-xs text-red-400 bg-red-950/30 px-3 py-1 rounded-md border border-red-900/50">Leave Game</button> 
            </div> 
            
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"> 
              <p className="text-xs text-slate-500 uppercase font-bold">Logged In As</p> 
              <h2 className="text-2xl font-black text-indigo-400">{character.character_name}</h2> 
              
              <div className="mt-4 pt-4 border-t border-slate-800"> 
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ 
                  { 
                    murderer: 'bg-red-600 text-white', 
                    accomplice: 'bg-orange-600 text-white', 
                    imposter: 'bg-yellow-600 text-white', 
                    bystander: 'bg-green-600 text-white', 
                    medium: 'bg-purple-600 text-white' 
                  }[character.role] || 'bg-slate-800 text-slate-300' 
                }`}> 
                  Role: {character.role} 
                </span> 
              </div> 
            </div> 

            {/* LIVE DASHBOARD CARD CARUSELS */}
            {character.role === 'murderer' && character.is_alive && ( 
              <div className="mt-6 pt-6 border-t border-slate-800"> 
                <MurdererDash currentCharacter={character} /> 
              </div> 
            )} 
            
            {character.role === 'accomplice' && character.is_alive && ( 
              <div className="mt-6 pt-6 border-t border-slate-800"> 
                <AccompliceBox currentCharacter={character} /> 
              </div> 
            )} 
            
            {character.role === 'imposter' && character.is_alive && ( 
              <div className="mt-6 pt-6 border-t border-slate-800"> 
                <ImposterDash currentCharacter={character} /> 
              </div> 
            )} 
          </div> 
        )} 

        {/* COMPONENT ELEMENT DISPLAY TILES */} 
        {activeTab === 'notes' && character.is_alive && ( 
          <NotesPage currentCharacter={character} />
        )}
        {activeTab === 'evidence' && character.is_alive && (
          <EvidencePage currentCharacter={character} />
        )}
        {activeTab === 'votes' && character.is_alive && (
          <VotingBooth currentCharacter={character} />
        )}
        {activeTab === 'afterlife' && !character.is_alive && (
          <AfterlifePage currentCharacter={character} />
        )}
        {activeTab === 'attendees' && (
          <AttendeeList currentCharacter={character} />
        )}
        {activeTab === 'host-panel' && character.role === 'host' && (
          <HostPanel />
        )}
        {activeTab === 'seance' && character.role === 'medium' && (
          <MediumRoom currentCharacter={character} />
        )}
        {activeTab === 'infirmary' && character.role === 'nurse' && (
          <NursePanel currentCharacter={character} /> 
        )}


      </main>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} currentCharacter={character} />
    </div>
  );
}

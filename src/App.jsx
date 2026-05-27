import { useState, useEffect } from 'react' 
import NavBar from './nav-bar' 
import { supabase } from './supabaseClient'; 
import AttendeeList from './attendees';
import NotesPage from './notes';
import EvidencePage from './Evidence';
import HostPanel from './HostPanel';
import VotingBooth from './Vote';
import MurdererDash from './MurderDash';
import AfterlifePage from './Afterlife';
import AccompliceBox from './Accomplice';
import ImposterDash from './Imposter';
import { LivingMediumView, DeadMediumView } from './Medium';

export default function App() { 
  const [character, setCharacter] = useState(null); 
  const [loginInput, setLoginInput] = useState(''); 
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('Loading broadcast protocols...');
 

  // 1. FIXED: Corrected spelling of savedCharacterName
  useEffect(() => { 
    const savedCharacterName = localStorage.getItem('mystery_character_name'); 
    if (savedCharacterName) { 
      fetchUserProfile(savedCharacterName); 
    } 
  }, []); 

  // 2. FIXED: Changed supaBase to supabase, and 'name' to 'username'
  async function fetchUserProfile(name) { 
  const { data, error } = await supabase 
    .from('players') // Target our clean manual 'players' table
    .select('*') 
    .ilike('character_name', name) // Look up the row matching the input text
    .maybeSingle(); // Gracefully handles missing names without throwing cache crashes

  if (data) { 
    setCharacter(data); 
    setActiveTab('dashboard'); 
    setErrorMsg(''); 
  } else { 
    setErrorMsg('Character not found. Make sure the Host added you to the game!'); 
  } 
} 

useEffect(() => {
  // Fetch the initial message when a user logs in
  async function fetchCurrentAlert() {
    const { data } = await supabase.from('active_broadcast').select('message_text').eq('id', 1).maybeSingle();
    if (data) setBroadcastMessage(data.message_text);
  }
  fetchCurrentAlert();

  // Listen for live database shifts triggered by the host panel
  const alertSub = supabase
    .channel('live-alerts')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'active_broadcast' }, (payload) => {
      setBroadcastMessage(payload.new.message_text);
    })
    .subscribe();

  return () => supabase.removeChannel(alertSub);
}, [character]); // Runs once the user is authorized


  const handleLogin = (e) => { 
  e.preventDefault(); 
  if (!loginInput.trim()) return; 

  // Save the string token directly to local memory
  localStorage.setItem('mystery_character_name', loginInput.trim()); 
  
  // Directly trigger the database record lookup
  fetchUserProfile(loginInput.trim()); 
}; 

  const handleLogout = () => { 
    localStorage.removeItem('mystery_character_name'); 
    setCharacter(null); 
    setLoginInput(''); 
  }; 

  if (!character) { 
    return ( 
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-6 text-white text-center"> 
        <div className="max-w-md w-full space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl"> 
          <h1 className="text-3xl font-extrabold text-red-500 tracking-wider uppercase">Mansion Mystery</h1> 
          <p className="text-slate-400 text-sm">Enter your assigned character name to access the case files.</p> 
          <form onSubmit={handleLogin} className="space-y-4"> 
            <input 
              type="text" 
              placeholder="The name on your character card" 
              value={loginInput} 
              onChange={(e) => setLoginInput(e.target.value)} 
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500" 
            /> 
            {errorMsg && <p className="text-red-500 text-xs font-semibold">{errorMsg}</p>} 
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold tracking-wide uppercase transition"> 
              Enter The Experience 
            </button> 
          </form> 
        </div> 
      </div> 
    ); 
  } 

  return ( 
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden"> 
      <div className="bg-red-600 p-3 text-center font-bold text-sm tracking-wide shadow-md"> 
         {broadcastMessage} 
      </div> 
      
      {/* INNER CONTENT WRAPPER */} 
      <main className="flex-1 overflow-y-auto p-6 pb-28"> 
        {/* DASHBOARD TAB */} 
        {activeTab === 'dashboard' && ( 
          <div className="space-y-6"> 
            <div className="flex justify-between items-center"> 
              <h1 className="text-xl font-bold tracking-widest uppercase text-slate-400">Case Files</h1> 
              <button onClick={handleLogout} className="text-xs text-red-400 bg-red-950/30 px-3 py-1 rounded-md border border-red-900/50">Leave Game</button> 
            </div> 
            {/* WELCOME CARD */} 
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"> 
              <p className="text-xs text-slate-500 uppercase font-bold">Logged In As</p> 
              <h2 className="text-2xl font-black text-indigo-400">{character.character_name}</h2> 
              {/* ROLE DISPLAY SECTION */} 
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

        {/* SUB-PAGES */} 
        {activeTab === 'notes' && character.is_alive && <NotesPage currentCharacter={character} />}
        {activeTab === 'evidence' && character.is_alive && <EvidencePage currentCharacter={character} />}
        {activeTab === 'votes' && character.is_alive && <VotingBooth currentCharacter={character} />}
        {activeTab === 'afterlife' && !character.is_alive && (<AfterlifePage currentCharacter={character} />)}
        {activeTab === 'attendees' && <AttendeeList currentCharacter={character}/>} 
        {activeTab === 'host-panel' && character.role === 'host' && <HostPanel />}
         </main> 
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} currentCharacter={character} />
    </div> 
  ); 
}

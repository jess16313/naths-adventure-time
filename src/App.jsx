import { useState, useEffect } from 'react'
import NavBar from './nav-bar'
import { supaBase } from './supabaseClient';

export default function App() {
    const [character, setCharacter] = useState(null);
    const [loginInput, setLoginInput] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() =>{
      const savecCharacterName = localStorage.getItem('mystery_character_name');
      if (savecCharacterName) {
        fetchUserProfile(savecCharacterName);
      }
    }, []);

    async function fetchUserProfile(name) {
      const { data, error } = await supaBase
        .from('profiles')
        .select('*')
        .ilike('name', name)
        .single();

        if(data) {
          setCharacter(data);
          setActiveTab('dashboard');
        }else {
          setErrorMsg('Character not found. Check your spelling!.');
        }
      }

    const handleLogin = (e) => {
      e.preventDefault();
      if (!loginInput.trim()) return;

      localStorage.setItem('mystery_character_name', loginInput.trim());
      fetchUserProfile(loginInput.trim());
    };

    const handleLogout = () => {
      localStorage.removeItem('mystery_character_name');
      setCharacter(null);
      setLoginInput('');
    };

    if(!character){
      return (
         <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-6 text-white text-center">
        <div className="max-w-md w-full space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <h1 className="text-3xl font-extrabold text-red-500 tracking-wider uppercase">Noir Mystery</h1>
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
      
      {/* MASS COMMUNICATION AREA */}
      <div className="bg-red-600 p-3 text-center font-bold text-sm tracking-wide shadow-md">
        📢 BROADCAST: Body found in the Kitchen. All players assemble.
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
              <h2 className="text-2xl font-black text-indigo-400">{character.username}</h2>
              
              {/* ROLE DISPLAY SECTION */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                {/* Dynamically styling the role badge if it's the murderer */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  character.role === 'murderer' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  Role: {character.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SUB-PAGES (Placeholder wrappers for your 6 buttons) */}
        {activeTab === 'notes' && <div className="text-center mt-10 text-slate-500">📝 Notes Screen Container</div>}
        {activeTab === 'votes' && <div className="text-center mt-10 text-slate-500">🗳️ Voting Booth Container</div>}
        {activeTab === 'profile' && <div className="text-center mt-10 text-slate-500">👤 Character Bio Container</div>}
        {activeTab === 'story' && <div className="text-center mt-10 text-slate-500">📖 Act Timeline Container</div>}
        {activeTab === 'attendees' && <div className="text-center mt-10 text-slate-500">👥 Guest Status List Container</div>}

      </main>

      {/* THE COMPONENT FOOTER NAVBAR */}
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

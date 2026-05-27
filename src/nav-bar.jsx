export default function NavBar({ activeTab, setActiveTab, currentCharacter }) {
  const getBtnStyle = (tabName) => 
    `flex flex-col items-center justify-center text-[10px] uppercase font-bold tracking-tighter transition-colors ${
      activeTab === tabName ? 'text-indigo-400' : 'text-slate-500'
    }`;

  // Helper states to shorten our conditions
  const isAlive = currentCharacter?.is_alive;
  const isMedium = currentCharacter?.role === 'medium';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 pb-6 z-40">
      
      {/* 1. Standard buttons visible to LIVING players */}
      {isAlive && (
        <>
          <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('dashboard')}>🏠 Home</button>
          <button onClick={() => setActiveTab('attendees')} className={getBtnStyle('attendees')}>👥 Players</button>
          <button onClick={() => setActiveTab('notes')} className={getBtnStyle('notes')}>📝 Notes</button>
          <button onClick={() => setActiveTab('evidence')} className={getBtnStyle('evidence')}>🔍 Evidence</button>
          <button onClick={() => setActiveTab('votes')} className={getBtnStyle('votes')}>🗳️ Votes</button>
        </>
      )}

      {/* 2. LIVING MEDIUM SPECIAL TAB */}
      {isAlive && isMedium && (
        <>
        <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('dashboard')}>🏠 Home</button>
          <button onClick={() => setActiveTab('attendees')} className={getBtnStyle('attendees')}>👥 Players</button>
          <button onClick={() => setActiveTab('notes')} className={getBtnStyle('notes')}>📝 Notes</button>
          <button onClick={() => setActiveTab('evidence')} className={getBtnStyle('evidence')}>🔍 Evidence</button>
          <button onClick={() => setActiveTab('votes')} className={getBtnStyle('votes')}>🗳️ Votes</button>
          <button onClick={() => setActiveTab('seance')} className={getBtnStyle('seance')}>
          <span className="text-xl mb-0.5">🔮</span>
          <span className="text-purple-400 font-bold">Séance</span>
        </button>
        </>
      )}

      {/* 3. DEAD PLAYER SECRET TAB (The Afterlife) */}
      {!isAlive && !isMedium && (
        <>
          <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('dashboard')}>🏠 Home</button>
          <button onClick={() => setActiveTab('attendees')} className={getBtnStyle('attendees')}>👥 Players</button>
          <button onClick={() => setActiveTab('notes')} className={getBtnStyle('notes')}>📝 Notes</button>
          <button onClick={() => setActiveTab('evidence')} className={getBtnStyle('evidence')}>🔍 Evidence</button>
          <button onClick={() => setActiveTab('afterlife')} className={getBtnStyle('afterlife')}>
            <span className="text-xl mb-0.5">👻</span>
            <span className="text-cyan-400 font-bold">Underworld</span>
          </button>
        </>
      )}

      {/* 4. DEAD MEDIUM SPECIAL TAB (Changes when they die!) */}
      {!isAlive && isMedium && (
        <>
          <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('dashboard')}>🏠 Home</button>
          <button onClick={() => setActiveTab('attendees')} className={getBtnStyle('attendees')}>👥 Players</button>
          <button onClick={() => setActiveTab('notes')} className={getBtnStyle('notes')}>📝 Notes</button>
          <button onClick={() => setActiveTab('evidence')} className={getBtnStyle('evidence')}>🔍 Evidence</button>
          <button onClick={() => setActiveTab('votes')} className={getBtnStyle('votes')}>🗳️ Votes</button>
          <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('dashboard')}>🏠 Home</button>
        </>
      )}

      {/* HOST PANEL */}
      {currentCharacter?.role === 'host' && (
        <button onClick={() => setActiveTab('host-panel')} className={getBtnStyle('host-panel')}>👑 Host</button>
      )}
      
    </nav>
  );
}


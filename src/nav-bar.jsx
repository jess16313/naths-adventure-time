
export default function NavBar({ activeTab, setActiveTab, currentCharacter }) {
  const getBtnStyle = (tabName) => 
    `flex flex-col items-center text-xs uppercase font-bold tracking-tighter ${
      activeTab === tabName ? 'text-indigo-400' : 'text-slate-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 pb-6">
      <button onClick={() => setActiveTab('evidence')} className={getBtnStyle('evidence')}>
        <span>Evidence</span>
      </button>
    
    <button onClick={() => setActiveTab('votes')} className={getBtnStyle('votes')}>
        <span>Votes</span>
      </button>

      <button onClick={() => setActiveTab('default')} className={getBtnStyle('default')}>
        <span>Default</span>
      </button>

      <button onClick={() => setActiveTab('attendees')} className={getBtnStyle('attendees')}>
        <span>Attendees</span>
      </button>

      <button onClick={() => setActiveTab('notes')} className={getBtnStyle('notes')}>
        <span>Notes</span>
      </button>

      <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('home')}>
        <span>Home</span>
      </button>
      
      {currentCharacter?.role === 'host' && (
        <button onClick={() => setActiveTab('host-panel')} className={getBtnStyle('host-panel')}>
          <span className="text-red-400 font-extrabold">Host</span>
        </button>
      )}

    </nav>
  );
}

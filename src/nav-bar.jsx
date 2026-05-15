


export default function NavBar({ activeTab, setActiveTab }) {
  const getBtnStyle = (tabName) => 
    `flex flex-col items-center text-xs uppercase font-bold tracking-tighter ${
      activeTab === tabName ? 'text-indigo-400' : 'text-slate-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 pb-6">
      <button onClick={() => setActiveTab('dashboard')} className={getBtnStyle('dashboard')}>
        <span className="text-xl">home</span>
        <span>Home</span>
      </button>

      <button onClick={() => setActiveTab('attendees')} className={getBtnStyle('attendees')}>
        <span className="text-xl">others</span>
        <span>Players</span>
      </button>

      <button onClick={() => setActiveTab('notes')} className={getBtnStyle('notes')}>
        <span className="text-xl">notes</span>
        <span>Notes</span>
      </button>
    </nav>
  );
}

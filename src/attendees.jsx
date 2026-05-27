import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AttendeeList({ currentCharacter }) {
  const [players, setPlayers] = useState([]);
  const [storyText, setStoryText] = useState('Gathering intelligence logs...');
  const [selectedPlayer, setSelectedPlayer] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch guest list array
      const { data: guestData } = await supabase
        .from('players')
        .select('*')
        .order('character_name', { ascending: true });

      // 2. Fetch the background story blurb
      const { data: storyData } = await supabase
        .from('campaign_story')
        .select('story_blurb')
        .eq('id', 1)
        .maybeSingle();

      if (guestData) setPlayers(guestData);
      if (storyData) setStoryText(storyData.story_blurb);
      setLoading(false);
    }

    fetchData();

    // 3. Set up real-time listener so if the host rewrites the story, it shifts live!
    const storySub = supabase
      .channel('live-story-stream')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaign_story' }, (payload) => {
        setStoryText(payload.new.story_blurb);
      })
      .subscribe();

    return () => supabase.removeChannel(storySub);
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-slate-400 animate-pulse">Loading guest logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">Guest Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Tap a dossier card to view individual suspect records.</p>
      </div>

      {/* GUEST CARDS GRID LIST */}
      <div className="grid grid-cols-1 gap-3">
        {players.map((player) => {
          const isMe = player.id === currentCharacter.id;
          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                !player.is_alive
                  ? 'bg-red-950/20 border-red-900/50 text-slate-500 line-through' 
                  : isMe
                  ? 'bg-slate-900 border-indigo-500/50 text-white ring-1 ring-indigo-500/30' 
                  : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' 
              }`}
            >
              <div className="flex items-center space-x-3">
                {player.avatar_url ? (
                  <img 
                    src={player.avatar_url} 
                    alt={player.character_name} 
                    className={`w-10 h-10 rounded-full object-cover border ${
                      !player.is_alive ? 'border-red-900 grayscale opacity-40' : 'border-slate-700'
                    }`}
                  />
                ) : (
                  <span className="text-xl">{!player.is_alive ? '💀' : '👤'}</span>
                )}
                <div>
                  <div className="font-bold flex items-center gap-2 text-sm">
                    {player.character_name}
                    {isMe && <span className="bg-indigo-900 text-indigo-400 text-[9px] font-extrabold px-1 rounded uppercase">You</span>}
                  </div>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                    Status: {player.is_alive ? 'Alive' : 'Deceased'}
                  </p>
                </div>
              </div>
              <div className="text-slate-600 text-xs">➡️</div>
            </div>
          );
        })}
      </div>

      {/* 🛠️ NEW ADDITION: BACKGROUND STORY SECTION */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
        <h2 className="text-xs font-black uppercase text-amber-500 tracking-wider font-mono">
          📜 Operational Briefing & Alibi Log
        </h2>
        <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 leading-relaxed font-serif shadow-inner">
          {storyText}
        </div>
      </div>

      {/* POP-UP BIO MODAL CONTROLLER */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-indigo-400">{selectedPlayer.character_name}</h3>
                <p className={`text-xs font-bold uppercase mt-1 ${selectedPlayer.is_alive ? 'text-green-500' : 'text-red-500'}`}>
                  Current Log: {selectedPlayer.is_alive ? '🟢 Active' : '🔴 Deceased'}
                </p>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="bg-slate-800 p-2 text-xs rounded-full w-8 h-8 text-slate-400">✕</button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
              {selectedPlayer.description || "No official records found on this individual..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
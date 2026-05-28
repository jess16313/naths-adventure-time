import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AttendeeList({ currentCharacter }) {
  const [players, setPlayers] = useState([]);
  const [storyText, setStoryText] = useState('Gathering intelligence logs...');
  const [selectedPlayer, setSelectedPlayer] = useState(null); 
  const [loading, setLoading] = useState(true);

  // NEW: Track whether Evidence Item #6 has been uncovered yet
  const [willIsFound, setWillIsFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch guest rosters
      const { data: guestData } = await supabase
        .from('players')
        .select('*')
        .order('character_name', { ascending: true });

      // 2. Fetch background narrative campaign
      const { data: storyData } = await supabase
        .from('campaign_story')
        .select('story_blurb')
        .eq('id', 1)
        .maybeSingle();

      // 3. Check the real-time discovery log of Evidence Item 6 (Altered Will)
      const { data: evidenceData } = await supabase
        .from('evidence')
        .select('is_discovered')
        .eq('id', 6)
        .maybeSingle();

      if (guestData) setPlayers(guestData);
      if (storyData) setStoryText(storyData.story_blurb);
      if (evidenceData) setWillIsFound(evidenceData.is_discovered);
      setLoading(false);
    }

    fetchData();

    // 4. Live subscription updates for story progression and evidence breakthroughs
    const liveSub = supabase
      .channel('attendee-vault-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaign_story' }, (payload) => {
        setStoryText(payload.new.story_blurb);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evidence' }, (payload) => {
        if (payload.new.id === 6) {
          setWillIsFound(payload.new.is_discovered);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(liveSub);
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-slate-400 animate-pulse">Loading guest logs...</div>;
  }

  // Quick verification checks
  const isGoodTeam = currentCharacter.team === 'good';

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">Guest Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Tap a dossier card to view individual suspect records.</p>
      </div>

      {/* ROSTER CARDS LIST GRID */}
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
                    Status: {player.is_alive ? 'Active' : 'Deceased'}
                  </p>
                </div>
              </div>
              <div className="text-slate-600 text-xs">➡️</div>
            </div>
          );
        })}
      </div>

      {/* BACKGROUND STORY & ALIBI BLURB BOX */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
        <h2 className="text-xs font-black uppercase text-amber-500 tracking-wider font-mono">
          📜 Operational Briefing & Alibi Log
        </h2>
        <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 leading-relaxed font-serif shadow-inner">
          {storyText}
        </div>
      </div>

      {/* POP-UP DOSSIER PROFILE MODAL CARDS */}
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

            {/* CHARACTER BIO DISCRIPTIONS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto font-serif">
              {selectedPlayer.description || "No official records found on this individual..."}
            </div>

            {/* 🔬 DYNAMIC REVEAL SYSTEM: FINGERPRINT PROFILE DATA COMPONENT LOCK */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-500 block">Forensic Laboratory Logs</span>
              <div className="text-xs font-medium">
                {willIsFound && isGoodTeam ? (
                  <p className="text-emerald-400 font-mono font-bold">
                    🧬 Print Analysis: <span className="underline">{selectedPlayer.fingerprint_type}</span>
                  </p>
                ) : (
                  <p className="text-slate-600 italic">
                    🔒 Fingerprint Record: [CLASSIFIED — Altered Will Evidence Required]
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-xs border border-slate-700"
            >
              Close Roster Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

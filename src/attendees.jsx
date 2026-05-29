import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AttendeeList({ currentCharacter }) {
  const [players, setPlayers] = useState([]);
  const [storyText, setStoryText] = useState('Gathering intelligence logs...');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [willIsFound, setWillIsFound] = useState(false);

  // Helper function to pull a completely fresh roster list from Supabase
  const refreshRoster = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('character_name', { ascending: true });
    if (data) setPlayers(data);
  };

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch initial guest roster fields
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

    // 4. Live subscription updates for story progression, evidence, AND player metrics
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => {
        refreshRoster(); 
        setSelectedPlayer((current) => {
          if (current && current.id === payload.new.id) {
            return payload.new;
          }
          return current;
        });
      })
      .subscribe();

    return () => supabase.removeChannel(liveSub);
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-slate-400 animate-pulse">Loading guest logs...</div>;
  }

  const isGoodTeam = currentCharacter.team === 'good';
  const canSeeImmunity = currentCharacter.role === 'nurse' || currentCharacter.role === 'host';

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
            <div key={player.id} onClick={() => setSelectedPlayer(player)} className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${
              !player.is_alive ? 'bg-red-950/20 border-red-900/50 text-slate-500 line-through' : isMe ? 'bg-slate-900 border-indigo-500/50 text-white ring-1 ring-indigo-500/30' : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
            }`} >
              <div className="flex items-center space-x-3">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.character_name} className={`w-10 h-10 rounded-full object-cover border ${ !player.is_alive ? 'border-red-900 grayscale opacity-40' : 'border-slate-700' }`} />
                ) : (
                  <span className="text-xl">{!player.is_alive ? '💀' : '👤'}</span>
                )}
                <div>
                  <div className="font-bold flex items-center flex-wrap gap-x-2 gap-y-0.5 text-sm">
                    <span>{player.character_name}</span>
                    
                    {/* REAL NAME SUB-TEXT IN PARANTHESIS */}
                    {player.real_name && (
                      <span className="text-xs text-slate-500 font-normal font-sans italic">
                        ({player.real_name})
                      </span>
                    )}
                    
                    {isMe && <span className="bg-indigo-900 text-indigo-400 text-[9px] font-extrabold px-1 rounded uppercase">You</span>}
                    {player.is_alive && player.nurse_immune && canSeeImmunity && (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold px-1 rounded uppercase tracking-wide animate-pulse">
                        🛡️ Shielded
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
                    Status: {player.is_alive ? 'Active' : 'Deceased'}
                  </p>
                </div>
              </div>
              <div className="text-slate-600 text-xs">➡️</div>
            </div>
          );
        })}
      </div>

      {/* POP-UP DOSSIER PROFILE MODAL CARDS */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-2" />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-indigo-400 flex items-center flex-wrap gap-2">
                  <span>{selectedPlayer.character_name}</span>
                  {selectedPlayer.real_name && (
                    <span className="text-sm text-slate-500 font-normal font-sans italic mt-1">
                      ({selectedPlayer.real_name})
                    </span>
                  )}
                </h3>
                <p className={`text-xs font-bold uppercase mt-1 ${selectedPlayer.is_alive ? 'text-green-500' : 'text-red-500'}`}>
                  Current Log: {selectedPlayer.is_alive ? '🟢 Active' : '🔴 Deceased'}
                </p>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="bg-slate-800 p-2 text-xs rounded-full w-8 h-8 text-slate-400 flex items-center justify-center">✕</button>
            </div>

            {/* CHARACTER BIO DESCRIPTION */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto font-serif">
              {selectedPlayer.description || "No official records found on this individual..."}
            </div>

            {/* FORENSIC LABORATORY FINGERPRINT LOGS */}
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
            
            <button onClick={() => setSelectedPlayer(null)} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-xs border border-slate-700" >
              Close Roster Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

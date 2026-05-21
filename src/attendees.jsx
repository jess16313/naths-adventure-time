import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AttendeeList({ currentCharacter }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null); // Tracks which card is tapped for details
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getGuests() {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('character_name', { ascending: true }); 

      if (data) setPlayers(data);
      setLoading(false);
    }

    getGuests();
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-slate-400 animate-pulse">Loading guest logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">Guest Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Tap a dossier card to view character records.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {players.map((player) => {
          const isMe = player.id === currentCharacter.id;

          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                !player.is_alive
                  ? 'bg-red-950/20 border-red-900/50 text-slate-500 line-through' // Visual cue: Dead
                  : isMe
                  ? 'bg-slate-900 border-indigo-500/50 text-white ring-1 ring-indigo-500/30' // Visual cue: Self
                  : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700' // Normal Living Guest
              }`}
            >
              <div className="flex items-center space-x-3">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {player.character_name}
                    {isMe && (
                      <span className="bg-indigo-900/60 text-indigo-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-indigo-700/50 uppercase tracking-wide">
                        You
                      </span>
                    )}
                  </div>
                  <div className="relative flex-shrink-0 w-12 h-12">
  {player.avatar_url ? (
    <img 
      src={player.avatar_url} 
      alt={player.character_name} 
      className={`w-full h-full rounded-full object-cover border-2 ${
        !player.is_alive ? 'border-red-900 grayscale opacity-40' : 'border-slate-700'
      }`}
    />
  ) : (
    // Fallback icon if no picture is uploaded yet
    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xl border-2 border-slate-700">
      👤
    </div>
  )}
  
  {/* Floating skull overlay if the player is dead */}
  {!player.is_alive && (
    <span className="absolute -bottom-1 -right-1 text-sm bg-slate-950 rounded-full w-5 h-5 flex items-center justify-center border border-red-900">
      💀
    </span>
  )}
</div>

                </div>
              </div>

              <div className="text-slate-600 font-bold text-sm">point</div>
            </div>
          );
        })}
      </div>

      {/* 3. THE POP-UP BIO MODAL */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl p-6 space-y-4 shadow-2xl relative animate-slide-up">
            
            {/* Top Indicator bar for app feel */}
            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-2" />

            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-indigo-400">{selectedPlayer.character_name}</h3>
                <p className={`text-xs font-bold uppercase mt-1 ${selectedPlayer.is_alive ? 'text-green-500' : 'text-red-500'}`}>
                  Current Log: {selectedPlayer.is_alive ? ' Active & Breathing' : ' Deceased'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="bg-slate-800 hover:bg-slate-700 p-2 text-xs rounded-full w-8 h-8 font-bold text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
              <p className="font-mono text-xs text-slate-500 uppercase font-bold mb-2"> Dossier Records:</p>
              {selectedPlayer.description || "No official records found on this individual..."}
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs border border-slate-700"
            >
              Back to Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

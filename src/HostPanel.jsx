import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function HostPanel() {
  const [players, setPlayers] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [prewrittenList, setPrewrittenList] = useState([]);
  const [customText, setCustomText] = useState('');
  const [currentLiveAlert, setCurrentLiveAlert] = useState('');

  // Story states
  const [storyInput, setStoryInput] = useState('');
  const [liveStoryPreview, setLiveStoryPreview] = useState('');

  // Verdict state flag
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: p } = await supabase.from('players').select('*');
    const { data: e } = await supabase.from('evidence').select('*').order('id', { ascending: true });
    const { data: b } = await supabase.from('prewritten_broadcasts').select('*').order('id', { ascending: true });
    const { data: active } = await supabase.from('active_broadcast').select('message_text').eq('id', 1).maybeSingle();
    const { data: currentStory } = await supabase.from('campaign_story').select('story_blurb').eq('id', 1).maybeSingle();

    if (p) setPlayers(p);
    if (e) setEvidenceList(e);
    if (b) setPrewrittenList(b);
    if (active) setCurrentLiveAlert(active.message_text);
    if (currentStory) {
      setLiveStoryPreview(currentStory.story_blurb);
      setStoryInput(currentStory.story_blurb);
    }
  };

  const pushBroadcast = async (text) => {
    if (!text.trim()) return;
    await supabase.from('active_broadcast').update({ message_text: text.trim() }).eq('id', 1);
    
    try {
      await fetch("https://onesignal.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Basic os_v2_app_s7mdvycuwbf57hhnnhhkwfltetgzsf4xnefua44z5eoqmdhnlzkcdiilupui75dipumfbk2x7el6xjlirhrr2bwaebvlzwjiyqaqypy"
        },
        body: JSON.stringify({
          app_id: "97d83ae0-54b0-4bdf-9ced-69ceab157324",
          included_segments: ["All Subscribed Users"],
          headings: { "en": "🚨 Mansion Broadcast Alert" },
          contents: { "en": text.trim() }
        })
      });
    } catch (err) {
      console.error("OneSignal push blast failed:", err);
    }
    
    setCurrentLiveAlert(text.trim());
    setCustomText('');
  };

  // NEW FEATURE: CALCULATE VOTE TALLY AND TRANSMIT VERDICT
  const handleCalculateAndBroadcastVerdict = async () => {
    try {
      // 1. Fetch live votes cast by players
      const { data: castVotes, error: voteError } = await supabase.from('votes').select('*');
      
      if (voteError || !castVotes || castVotes.length === 0) {
        alert("⚠️ No voting data rows found in the database. Instruct guests to cast ballots first!");
        return;
      }

      const murdererTally = {};
      const accompliceTally = {};
      const imposterTally = {};

      // 2. Map structural counters based on schema columns
      castVotes.forEach((v) => {
        if (v.voted_murderer) murdererTally[v.voted_murderer] = (murdererTally[v.voted_murderer] || 0) + 1;
        if (v.voted_accomplice) accompliceTally[v.voted_accomplice] = (accompliceTally[v.voted_accomplice] || 0) + 1;
        if (v.voted_imposter) imposterTally[v.voted_imposter] = (imposterTally[v.voted_imposter] || 0) + 1;
      });

      // 3. Find top names
      const getTopSuspect = (tally) => {
        const keys = Object.keys(tally);
        if (keys.length === 0) return "No Consensus";
        return keys.reduce((a, b) => tally[a] > tally[b] ? a : b);
      };

      const topMurderer = getTopSuspect(murdererTally);
      const topAccomplice = getTopSuspect(accompliceTally);
      const topImposter = getTopSuspect(imposterTally);

      // 4. Construct live reveal bulletin
      const finalVerdictString = `📢 CRIMINAL VERDICT REVEALED! • Accused Murderer: ${topMurderer} (${murdererTally[topMurderer] || 0} votes) • Accused Accomplice: ${topAccomplice} (${accompliceTally[topAccomplice] || 0} votes) • Accused Imposter: ${topImposter} (${imposterTally[topImposter] || 0} votes)`;

      // 5. Broadcast across all sockets and devices
      await pushBroadcast(finalVerdictString);
      setIsRevealed(true);
      alert("🔥 VERDICT LIVE! The results have overwritten the ticker tape on all user devices.");
    } catch (err) {
      console.error("Tally system error:", err);
    }
  };

  const handleUpdateStory = async () => {
    if (!storyInput.trim()) return;
    const { error } = await supabase
      .from('campaign_story')
      .update({ story_blurb: storyInput.trim() })
      .eq('id', 1);

    if (!error) {
      setLiveStoryPreview(storyInput.trim());
      alert("📜 Dossier briefing records rewritten successfully across all player terminals!");
    } else {
      alert("Error overwriting story logs.");
    }
  };

  const toggleLife = async (id, currentStatus) => {
    await supabase.from('players').update({ is_alive: !currentStatus }).eq('id', id);
    fetchData();
  };

  const toggleEvidence = async (id, currentStatus) => {
    await supabase.from('evidence').update({ is_discovered: !currentStatus }).eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-red-500 uppercase tracking-widest">👑 Game Master Control</h1>
        <p className="text-xs text-slate-500">Live overwrite deck for mansion communications.</p>
      </div>

      {/* FINAL DELIBERATION AND REVEAL BULLET SYSTEM */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wide">🗳️ Final Voting Tally System</h2>
          <span className="text-[8px] font-mono text-amber-500 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-900 animate-pulse">Endgame Ready</span>
        </div>
        <p className="text-xs text-slate-400 font-serif leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-900">
          When final voting is closed, execute the sequence command below to calculate all ballots cast for Murderer, Accomplice, and Imposter. The final results will flash on everyone's phone screens instantly.
        </p>
        <button 
          onClick={handleCalculateAndBroadcastVerdict} 
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-md border border-amber-500/20"
        >
          🚨 Crunch Votes & Broadcast Verdicts Live 🚨
        </button>
        {isRevealed && (
          <p className="text-[10px] text-center text-emerald-400 font-mono font-black animate-pulse">
            ✓ Final verdict metrics dispatched successfully to all user devices.
          </p>
        )}
      </div>

      {/* GLOBAL BROADCAST DESK */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Mansion Public Address System</h2>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs text-slate-400">
          <span className="font-mono text-amber-500 font-bold uppercase block mb-1">Live Feed Overlap:</span> "{currentLiveAlert}"
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 block">Deploy Real-Time Custom Message</label>
          <div className="flex gap-2">
            <input type="text" placeholder="Type a custom announcement..." value={customText} onChange={(e) => setCustomText(e.target.value)} className="flex-1 p-2 bg-slate-950 border border-slate-800 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-red-500" />
            <button onClick={() => pushBroadcast(customText)} className="bg-red-600 hover:bg-red-700 font-bold px-4 rounded-lg text-xs uppercase tracking-wider"> Transmit </button>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-slate-850">
          <label className="text-[10px] uppercase font-bold text-slate-500 block">Pre-Scripted Event Triggers</label>
          <div className="grid grid-cols-2 gap-2">
            {prewrittenList.map((script) => (
              <button key={script.id} onClick={() => pushBroadcast(script.script_text)} className="bg-slate-950 hover:bg-slate-850 p-2.5 rounded-lg border border-slate-800 text-left transition text-slate-300" >
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">{script.title}</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">{script.script_text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STORY BRIEFING OVERWRITE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Story Briefing Overwrite</h2>
          <span className="text-[8px] font-mono text-emerald-500 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900">Live Sync Active</span>
        </div>
        <div className="space-y-2">
          <textarea
            value={storyInput}
            onChange={(e) => setStoryInput(e.target.value)}
            placeholder="Type new plot progression text details..."
            className="w-full h-24 p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 resize-none focus:outline-none focus:border-amber-500 leading-relaxed"
          />
          <button 
            onClick={handleUpdateStory}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-md"
          >
            Update Global Story Dossier 📜
          </button>
        </div>
      </div>

      {/* PLAYER ROSTER STATUS CONTROL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Player Roster Status</h2>
        <div className="space-y-2">
          {players.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-900">
              <span className="text-xs font-bold">{p.character_name} ({p.role})</span>
              <button 
                onClick={() => toggleLife(p.id, p.is_alive)}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded-md border ${
                  p.is_alive ? 'bg-green-950 border-green-800 text-green-400' : 'bg-red-950 border-red-800 text-red-400'
                }`}
              >
                {p.is_alive ? 'Alive 🟢' : 'Dead 💀'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* EVIDENCE DROPS CONTROL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Uncover Evidence Links</h2>
        <div className="grid grid-cols-1 gap-2">
          {evidenceList.map(e => (
            <div key={e.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-900">
              <span className="text-xs text-slate-300 font-mono">{e.id}. {e.evidence_name}</span>
              <button 
                onClick={() => toggleEvidence(e.id, e.is_discovered)}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded-md ${
                  e.is_discovered ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {e.is_discovered ? 'Discovered' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

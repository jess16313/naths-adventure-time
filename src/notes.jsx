import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function NotesPage({ currentCharacter }) {
  // 1. STATE & REF MANAGEMENT
  // Instantly load from localStorage on day one so the UI is never empty
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem(`notes_${currentCharacter.character_name}`) || '';
  });
  const [saveStatus, setSaveStatus] = useState('Saved locally');
  const timeoutRef = useRef(null); // Used to control background cloud saving

  // 2. BACKGROUND CLOUD SAVE LOGIC
  const saveToCloud = async (text) => {
    setSaveStatus('Saving to case files...');
    
    // Check if a row already exists for this player
    const { data: existingRow } = await supabase
      .from('player_notes')
      .select('*')
      .ilike('character_name', currentCharacter.character_name)
      .maybeSingle();

    if (existingRow) {
      // Update existing notes row
      await supabase
        .from('player_notes')
        .update({ notes_content: text })
        .eq('id', existingRow.id);
    } else {
      // Create a brand new notes row for this player
      await supabase
        .from('player_notes')
        .insert([{ character_name: currentCharacter.character_name, notes_content: text }]);
    }
    
    setSaveStatus('🔒 Securely saved in cloud');
  };

  // 3. HANDLE TYPING
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setNotes(newText);
    setSaveStatus('Typing...');

    // Rule 1: Always save to local physical phone memory instantly
    localStorage.setItem(`notes_${currentCharacter.character_name}`, newText);

    // Rule 2: Wait until the user stops typing for 1.5 seconds before hitting Supabase
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      saveToCloud(newText);
    }, 1500); 
  };

  // 4. FETCH INITIAL CLOUD NOTES ON LOAD (Backup sync)
  useEffect(() => {
    async function syncCloudNotes() {
      const { data } = await supabase
        .from('player_notes')
        .select('notes_content')
        .ilike('character_name', currentCharacter.character_name)
        .maybeSingle();

      // If the cloud notes text exists and is longer than local text, sync it up
      if (data && data.notes_content.length > notes.length) {
        setNotes(data.notes_content);
        localStorage.setItem(`notes_${currentCharacter.character_name}`, data.notes_content);
      }
    }
    syncCloudNotes();

    // Cleanup timer if component unmounts
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-180px)]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-400">Detective Notebook</h1>
          <p className="text-xs text-slate-500 mt-1">Log suspect alibis, clues, and your deductions here.</p>
        </div>
        {/* Dynamic status indicator banner */}
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          saveStatus.includes('cloud') 
            ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
            : 'bg-slate-900 text-slate-400 border-slate-800'
        }`}>
          {saveStatus}
        </span>
      </div>

      {/* TEXT AREA NOTEBOOK SHEET */}
      <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-inner flex flex-col">
        <textarea
          value={notes}
          onChange={handleTextChange}
          placeholder="I noticed Lord Amber was wiping his hands nervously near the kitchen coat rack around 8:15 PM..."
          className="w-full flex-1 bg-transparent text-slate-200 placeholder-slate-600 resize-none text-sm leading-relaxed focus:outline-none font-sans"
        />
      </div>
      
      <p className="text-[10px] text-center text-slate-600 italic">
        *Notebook content auto-saves automatically with every keystroke.
      </p>
    </div>
  );
}

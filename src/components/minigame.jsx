import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LEVELS = {
  1: {
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 4, 0, 1, 3, 1],
      [1, 0, 2, 0, 0, 1],
      [1, 1, 0, 0, 0, 1]
    ]
  },
  2: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 4, 1, 3, 0, 0, 1],
      [1, 0, 2, 2, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
  },
  3: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 3, 1], 
      [1, 0, 1, 1, 0, 0, 1],
      [1, 0, 2, 0, 2, 0, 1],
      [1, 3, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
  },
  4: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1], 
      [1, 4, 0, 1, 0, 1, 3, 1],
      [1, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 2, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1],
      [1, 3, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  5: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 0, 0, 3, 1], 
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 2, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 3, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  6: { 
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 3, 1],
      [1, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 2, 0, 1],
      [1, 0, 1, 1, 0, 0, 1],
      [1, 3, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
  },
  7: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1], 
      [1, 4, 0, 1, 0, 1, 3, 1],
      [1, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 2, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 3, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  8: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1], 
      [1, 4, 0, 0, 0, 0, 0, 3, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 2, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 3, 0, 0, 0, 0, 0, 3, 1], 
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  9: { 
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 3, 1],
      [1, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 2, 0, 1],
      [1, 0, 1, 1, 0, 0, 1],
      [1, 3, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
  },
  10: {
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 1, 0, 1, 3, 1],
      [1, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1], 
      [1, 0, 2, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 3, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
  // You can easily paste up to 20 levels here following this exact structure!
};

// UPDATE THE FUNCTION DECORATION LINE IN MINIGAME.JSX
export default function MinigameOverlay({ minigameId, userId, onComplete, onExit }) {
  // Pull map metadata based on the ID sent down by Supabase (defaulting to level 1)
  const currentLevelId = LEVELS[minigameId] ? minigameId : 1;
  const initialGridConfig = LEVELS[currentLevelId].grid;

  // Game States
  const [grid, setGrid] = useState([]);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [goals, setGoals] = useState([]); // Keep track of where target buttons live
  const [isWon, setIsWon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize the specific map layout when the component loads
  useEffect(() => {
    let pPos = { r: 0, c: 0 };
    let targetGoals = [];

    const freshGrid = initialGridConfig.map((row, rIdx) => 
      row.map((cell, cIdx) => {
        if (cell === 4) pPos = { r: rIdx, c: cIdx };
        if (cell === 3) targetGoals.push({ r: rIdx, c: cIdx });
        return cell;
      })
    );

    setGrid(freshGrid);
    setPlayerPos(pPos);
    setGoals(targetGoals);
    setIsWon(false);
  }, [currentLevelId]);

  // Handle Game Movement Logic
  const movePlayer = (dr, dc) => {
    if (isWon) return;

    const newR = playerPos.r + dr;
    const newC = playerPos.c + dc;

    // Boundary Check
    if (newR < 0 || newR >= grid.length || newC < 0 || newC >= grid[0].length) return;

    const targetCell = grid[newR][newC];

    // 1. Hit a Wall -> Stop
    if (targetCell === 1) return;

    // 2. Hit a Box -> Try to push it
    if (targetCell === 2) {
      const boxNextR = newR + dr;
      const boxNextC = newC + dc;

      // Box Boundary Check
      if (boxNextR < 0 || boxNextR >= grid.length || boxNextC < 0 || boxNextC >= grid[0].length) return;

      const boxTargetCell = grid[boxNextR][boxNextC];

      // Box can only move into an empty space (0) or onto an un-activated goal (3)
      if (boxTargetCell === 0 || boxTargetCell === 3) {
        const structuralGrid = [...grid.map(row => [...row])];
        
        // Move box forward
        structuralGrid[boxNextR][boxNextC] = 2;
        // Clear box's old position (revert back to standard empty floor or basic goal tile)
        structuralGrid[newR][newC] = isGoal(newR, newC) ? 3 : 0;
        // Move player into the space vacated by the box
        structuralGrid[playerPos.r][playerPos.c] = isGoal(playerPos.r, playerPos.c) ? 3 : 0;
        structuralGrid[newR][newC] = 4;

        setGrid(structuralGrid);
        setPlayerPos({ r: newR, c: newC });
        checkWinCondition(structuralGrid);
      }
      return;
    }

    // 3. Move cleanly into Empty Space or Target Button
    if (targetCell === 0 || targetCell === 3) {
      const structuralGrid = [...grid.map(row => [...row])];
      structuralGrid[playerPos.r][playerPos.c] = isGoal(playerPos.r, playerPos.c) ? 3 : 0;
      structuralGrid[newR][newC] = 4;

      setGrid(structuralGrid);
      setPlayerPos({ r: newR, c: newC });
    }
  };

  // Helper check: Is this specific spatial coordinate an active objective button?
  const isGoal = (r, c) => goals.some(g => g.r === r && g.c === c);

  // Win Check: Every button index must overlap a box element (2)
  const checkWinCondition = (currentGrid) => {
    const allSolved = goals.every(g => currentGrid[g.r][g.c] === 2);
    if (allSolved) setIsWon(true);
  };

  // 3. Handshake Back to Supabase when Puzzle Solved
  const handleLevelCompletion = async () => {
    setSubmitting(true);

    if (onComplete){
      onComplete();
      setSubmitting(false);
      return;
    }

    try {
      const {data: profile } = await supabase
      .from('player')
      .select('minigame_count')
      .eq('id', userId)
      .single();

      const currentScore = profile?.minigame_count || 0;

      await supabase
        .from('player')
        .update({
          current_active_minigame: null,
          minigame_count: currentScore + 1,
          last_minigame_completed: new Date().toISOString()
        })
        .eq('id', userId);
      }catch (err) {
        console.error("Failed clear minigame overlay state:", err);
      } finally {        
        setSubmitting(false);
      }
    };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-4 select-none">
      {/* Visual Header Identity */}
      <div className="text-center max-w-sm mb-6">
        <h2 className="text-2xl font-black text-amber-400 tracking-wider uppercase">LEMONGREAB PUZZLE #{currentLevelId}</h2>
        <p className="text-xs text-gray-400 mt-1">Push the Lemongrab candy boxes directly onto the floor pressure buttons to escape!</p>
      </div>

      {/* --- THE RENDERED MATRIX GRID --- */}
      <div className="bg-slate-900 p-4 rounded-2xl border-4 border-slate-700 shadow-2xl inline-block">
        {grid.map((row, rIdx) => (
          <div key={rIdx} className="flex">
            {row.map((cell, cIdx) => {
              // Custom asset rendering rules based on matrix integers
              let cellClass = "w-12 h-12 flex items-center justify-center font-bold border border-slate-800 text-xl transition-all ";
              let cellContent = "";

              if (cell === 1) cellClass += "bg-slate-800 rounded-sm text-slate-600"; // Wall
              if (cell === 0) cellClass += "bg-slate-950"; // Empty path
              if (cell === 2) { // Box
                const onGoal = isGoal(rIdx, cIdx);
                cellClass += onGoal ? "bg-emerald-500/40 border-2 border-emerald-400 scale-95" : "bg-amber-600 rounded-md shadow-md";
                cellContent = "📦";
              }
              if (cell === 3) cellClass += "bg-rose-950 text-rose-500 border-2 border-rose-800 animate-pulse"; // Clear Goal Base
              if (cell === 4) { // Player
                cellClass += "bg-blue-600 rounded-full";
                cellContent = "🤠";
              }

              return (
                <div key={cIdx} className={cellClass}>
                  {cellContent}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!isWon && (
        <div className="mt-8 flex flex-col items-center gap-2 w-48">
          <button onClick={() => movePlayer(-1, 0)} className="w-16 h-12 bg-slate-800 active:bg-slate-700 font-extrabold rounded-xl shadow border border-slate-600 text-lg">▲</button>
          <div className="flex gap-8 w-full justify-between">
            <button onClick={() => movePlayer(0, -1)} className="w-16 h-12 bg-slate-800 active:bg-slate-700 font-extrabold rounded-xl shadow border border-slate-600 text-lg">◀</button>
            <button onClick={() => movePlayer(0, 1)} className="w-16 h-12 bg-slate-800 active:bg-slate-700 font-extrabold rounded-xl shadow border border-slate-600 text-lg">▶</button>
          </div>
          <button onClick={() => movePlayer(1, 0)} className="w-16 h-12 bg-slate-800 active:bg-slate-700 font-extrabold rounded-xl shadow border border-slate-600 text-lg">▼</button>

          {/* 🔄 THE NEW IN-GAME RESET LEVEL BUTTON */}
          <button 
            onClick={() => {
              // To reset the map, we read our unchanging template matrix again
              let pPos = { r: 0, c: 0 };
              const freshGrid = initialGridConfig.map((row, rIdx) => 
                row.map((cell, cIdx) => {
                  if (cell === 4) pPos = { r: rIdx, c: cIdx };
                  return cell;
                })
              );
              setGrid(freshGrid);
              setPlayerPos(pPos);
            }}
            className="w-full mt-4 bg-slate-900 border border-rose-500/30 text-rose-400 active:bg-rose-950/20 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
          >
            🔄 Reset Current Level
          </button> 
          {onExit && (
            <button 
              onClick={onExit}
              className="w-full mt-2 bg-slate-950 hover:bg-slate-900 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
            >
              🚪 Exit Test Suite
            </button>
          )}
        </div>
      )}


      {/* --- THE WIN MODAL SUCCESS STATE OVERLAY --- */}
  {/* --- THE WIN MODAL SUCCESS STATE OVERLAY --- */}
      {isWon && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-10">
          <span className="text-6xl mb-2">🎉</span>
          <h3 className="text-3xl font-black text-emerald-400 tracking-widest uppercase">LEVEL CLEAR!</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">You solved the layout requirements! Returning to your storyline feed...</p>
          
          <div className="flex flex-col gap-2 w-full max-w-xs mt-6">
            <button 
              disabled={submitting}
              onClick={handleLevelCompletion}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-black tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all uppercase text-sm"
            >
              {submitting ? 'Unlocking Grid...' : 'Next Level / Resume'}
            </button>

            {/* 👑 THE NEW POST-GAME EXIT BUTTON FOR HINT GIVERS */}
            {onExit && (
              <button 
                onClick={onExit}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-300 px-8 py-3 rounded-xl font-black tracking-wider transition-all uppercase text-sm"
              >
                🚪 Return to Master Dashboard
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

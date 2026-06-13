import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [characterName, setCharacterName] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!characterName.trim() || !password.trim()) return;

    setChecking(true);
    setErrorMsg('');

    // 💥 EXACT THREE PARAMETER ALIGNMENT MATCHING APP.JSX:
    onLoginSuccess(characterName.trim(), password.trim(), (isValid) => {
      setChecking(false);
      if (!isValid) {
        setErrorMsg("Invalid character name and passcode combination!");
      }
    });
  };

  return (
  <div className="flex flex-col items-center max-w-sm w-full bg-[#52b29a] p-6 rounded-[40px] border-4 border-[#327364] shadow-[0_16px_0_rgba(50,115,100,0.4)] text-slate-900 tracking-wider">
    
    <div className="w-full bg-[#cbe9db] border-8 border-[#3d424c] rounded-2xl p-6 shadow-inner flex flex-col justify-center items-center space-y-4 min-h-[260px]">
      <h2 className="text-2xl font-black uppercase text-[#2c3e35] tracking-widest animate-pulse">
        Log In
      </h2>
      
      <form onSubmit={handleSubmit} className="w-full space-y-3 flex flex-col items-center">
        <input
          type="text"
          placeholder="Character Name"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          className="w-full px-4 py-2 border-2 border-[#3d424c] bg-[#eef7f2] rounded-lg focus:outline-none focus:bg-white uppercase font-bold placeholder-[#3d424c]/40 text-sm tracking-widest text-[#2c3e35]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border-2 border-[#3d424c] bg-[#eef7f2] rounded-lg focus:outline-none focus:bg-white uppercase font-bold placeholder-[#3d424c]/40 text-sm tracking-widest text-[#2c3e35]"
        />
        <button
          type="submit"
          className="bg-[#3d424c] text-[#cbe9db] font-black text-xs uppercase px-6 py-2 rounded-md hover:bg-slate-700 transition-all border-b-4 border-slate-900 active:translate-y-0.5 active:border-b-0 tracking-widest"
        >
          Enter
        </button>
      </form>
    </div>

    {/* 🎮 HANDHELD CONSOLE BUTTON MATRIX CONTROLS */}
    <div className="w-full mt-6 grid grid-cols-12 items-center relative min-h-[160px] px-2">
      
      {/* Horizontal Input Jack Pill */}
      <div className="col-span-12 flex justify-start mb-4">
        <div className="w-20 h-4 bg-[#327364] rounded-full border-2 border-[#204c41]" />
      </div>

      {/* D-PAD CONTROL BUTTON (Left Side) */}
      <div className="col-span-5 flex justify-center items-center">
        <div className="relative w-20 h-20">
          {/* Vertical d-pad body */}
          <div className="absolute top-0 left-7 w-6 h-20 bg-[#3d424c] rounded-md shadow-md border-b-4 border-slate-900" />
          {/* Horizontal d-pad body */}
          <div className="absolute top-7 left-0 w-20 h-6 bg-[#3d424c] rounded-md shadow-md border-b-4 border-slate-900" />
          {/* Center alignment circle detail */}
          <div className="absolute top-8 left-8 w-4 h-4 bg-slate-600 rounded-full" />
        </div>
      </div>

      {/* BACK / MENU TRIANGLE BUTTON (Center Alignment) */}
      <div className="col-span-2 flex justify-center mb-6">
        <div 
          className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-[#4d86b8] shadow-md relative"
          style={{ transform: 'rotate(90deg)' }}
        />
      </div>

      {/* RETRO ACTION BUTTONS BLOCK (Right Side) */}
      <div className="col-span-5 relative flex justify-center">
        {/* Tiny upper accent circle */}
        <div className="absolute -top-6 right-16 w-4 h-4 bg-[#df6168] rounded-full shadow border-b-2 border-red-800" />
        
        {/* Primary Interaction Buttons (Large and Medium Circles) */}
        <div className="flex flex-col items-center space-y-3 mt-2">
          <div className="w-8 h-8 bg-[#48be82] rounded-full shadow-md border-b-4 border-emerald-800" />
          <div className="w-12 h-12 bg-[#df6168] rounded-full shadow-md border-b-4 border-red-800" />
        </div>
      </div>

    </div>

  </div>
  );
}
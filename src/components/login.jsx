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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm border border-white/10 bg-slate-900/90 rounded-3xl p-8 shadow-2xl text-center">
        <span className="text-4xl mb-2 block animate-pulse">👑</span>
        <h2 className="text-2xl font-black text-amber-400 tracking-wider uppercase">BMO Core Terminal</h2>
        <p className="text-xs text-gray-400 mt-1 mb-6">Identify yourself to enter the Land of Ooo</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs text-gray-400 block mb-1 uppercase font-bold tracking-wider">Character Name</label>
            <input 
              type="text" 
              placeholder="e.g. Finn"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              disabled={checking}
              className="w-full bg-black/40 border border-white/15 focus:border-amber-400 text-center text-xl text-white py-2.5 px-4 rounded-xl outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1 uppercase font-bold tracking-wider">Secret Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={checking}
              className="w-full bg-black/40 border border-white/15 focus:border-amber-400 text-center text-xl text-white py-2.5 px-4 rounded-xl outline-none transition-all"
            />
          </div>
          {errorMsg && <p className="text-xs text-rose-400 font-medium text-center pt-2">⚠️ {errorMsg}</p>}
          <button type="submit" disabled={checking || !characterName || !password} className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-widest py-3 rounded-xl uppercase text-sm shadow-lg shadow-amber-500/10">
            {checking ? 'Decoding Credentials...' : 'Initialize Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
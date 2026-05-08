import { useState } from 'react'
import NavBar from './nav-bar'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
//home page of the app
  //should display hints
  //hint count
  //role (default not visible)
  //button to upload photos
  //button to open notes page
  //(maybe even list of attendees to check off and on)
  //space for mass communicationss
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hintVisible, setHintVisible] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      
      <div className="bg-red-600 p-3 text-center font-bold animate-pulse">
        ALERT: The body was found in the Kitchen! 
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-400 uppercase tracking-widest">Case Files</h1>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
               <button onClick={() => alert("You are the MURDERER")} className="text-sm opacity-50">Tap to Reveal Role</button>
            </div>

            <div className="bg-indigo-900 p-5 rounded-2xl shadow-lg">
              <h2 className="font-bold">Current Hint</h2>
              <p className="text-xs mb-3 text-indigo-300">Hints used: 2/5</p>
              {hintVisible ? (
                <div className="bg-white text-black p-3 rounded shadow-inner">
                  "Check the pocket of the blue coat in the hallway..."
                  <button onClick={() => setHintVisible(false)} className="block mt-2 text-red-600 font-bold">Close Hint</button>
                </div>
              ) : (
                <button onClick={() => setHintVisible(true)} className="bg-indigo-500 w-full py-2 rounded-lg font-bold">Open Active Hint</button>
              )}
            </div>
          </div>
        )}

        {/* {activeTab === 'notes' && <NotesPage />}
        {activeTab === 'attendees' && <AttendeeList />} */}
      </main>
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

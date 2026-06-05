import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface OverlayProps {
  onDismiss: () => void;
}

export const QuickStartOverlay: React.FC<OverlayProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-8 max-w-lg shadow-2xl relative">
        <button className="absolute top-4 right-4 text-slate-400 hover:text-white" onClick={onDismiss}>
          <X className="w-5 h-5" />
        </button>
        <HelpCircle className="w-12 h-12 text-indigo-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Welcome to Void Spherer!</h2>
        <p className="text-slate-300 mb-6 leading-relaxed">
          This is a physics simulation laboratory. Draw aim lines to launch your orb, time your ability shifts, and navigate towards the Goal Core. 
          Use the <b>Physics Tuner</b> to customize gravity and thermodynamics, and toggle the <b>Debug Visualization</b> for real-time vector analysis.
        </p>
        <div className="bg-slate-900/50 p-4 rounded-xl text-xs text-slate-400 font-mono">
          • Drag & Pull -> Slingshot Aim<br/>
          • W, S, E, Q, Space -> Abilities<br/>
          • R -> Reset Arena
        </div>
        <button 
          onClick={onDismiss}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white"
        >
          Begin Laboratory
        </button>
      </div>
    </div>
  );
};

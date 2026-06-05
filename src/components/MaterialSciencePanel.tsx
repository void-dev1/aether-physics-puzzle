import React, { useState } from 'react';
import { Microscope, Cuboid, Zap, Radiation, Search } from 'lucide-react';

interface MaterialSciencePanelProps {
  scientificParamsRef: React.MutableRefObject<any>;
  sfx: any; // Audio controller
}

export function MaterialSciencePanel({ scientificParamsRef, sfx }: MaterialSciencePanelProps) {
  const [activeTab, setActiveTab] = useState<'static' | 'hazards' | 'interactive' | 'visuals' | 'thermal'>('static');
  const [stamp, setStamp] = useState(0);

  const forceUpdate = () => setStamp(Date.now());

  const sp = scientificParamsRef.current;
  const objectRules = sp.objectRules;

  const updateObstacle = (key: string, val: number) => {
    sfx.play('button');
    if (key === 'restitution') sp.obstacleRestitutionMod = val;
    if (key === 'friction') sp.obstacleFrictionMod = val;
    forceUpdate();
  };
  
  const updateScientific = (key: string, val: any) => {
    sfx.play('button');
    sp[key] = val;
    forceUpdate();
  };

  const updateRule = (objType: string, propKey: string, val: any) => {
    sfx.play('button');
    if (!objectRules[objType]) objectRules[objType] = {};
    objectRules[objType][propKey] = val;
    forceUpdate();
  };

  return (
    <div className="bg-[#1E293B]/70 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute -top-12 -right-12 w-32 h-32 border border-fuchsia-500/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 border border-indigo-500/5 rounded-full pointer-events-none" />

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-lg bg-fuchsia-950/50 border border-fuchsia-800/40 text-fuchsia-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Microscope className="w-3.5 h-3.5 text-fuchsia-400 animate-spin-slow" /> MATERIAL SCIENCE LAB
            </span>
            <span className="text-[10px] bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 font-semibold font-mono rounded px-1.5 py-0.5 tracking-wider uppercase">
              ACTIVE
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
            🔬 OBJECT PROPERTIES MANAGER
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Tinker with the exact physical structures and functionalities of level elements.
          </p>
        </div>

      </div>

      {/* Controller Mode Multi-Tabs */}
      <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => { sfx.play('button'); setActiveTab('static'); }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'static' ? 'bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-800/60 shadow-[0_0_10px_rgba(217,70,239,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Cuboid className="w-4 h-4 text-fuchsia-400" /> Static Props
        </button>
        <button
          onClick={() => { sfx.play('button'); setActiveTab('hazards'); }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'hazards' ? 'bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-800/60 shadow-[0_0_10px_rgba(217,70,239,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Radiation className="w-4 h-4 text-rose-400" /> Hazards
        </button>
        <button
          onClick={() => { sfx.play('button'); setActiveTab('interactive'); }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'interactive' ? 'bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-800/60 shadow-[0_0_10px_rgba(217,70,239,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" /> Interactives
        </button>
        <button
          onClick={() => { sfx.play('button'); setActiveTab('thermal'); }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'thermal' ? 'bg-red-950/60 text-red-400 border border-red-800/60 shadow-[0_0_10px_rgba(217,70,239,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          🔥 Thermal
        </button>
      </div>

      {/* Main Interactive Box Body */}
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-8 min-h-[600px] flex flex-col justify-between">
        
        {/* Tab: Static Properties */}
        {activeTab === 'static' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-mono">
            <div className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
              <span className="text-[10px] font-bold text-fuchsia-400 tracking-wider uppercase block border-b border-fuchsia-950 pb-1.5 flex items-center gap-1">
                <Cuboid className="w-3.5 h-3.5 text-fuchsia-400" /> Universal Wall Material
              </span>
              <p className="text-[10px] text-slate-400 leading-snug pb-2">
                Set global characteristics for all level obstacles, platforms, walls, and basic borders.
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Bounciness (Restitution)</span>
                  <span className="text-fuchsia-400 font-bold">{(sp.obstacleRestitutionMod).toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0" max="3" step="0.1"
                  value={sp.obstacleRestitutionMod}
                  onChange={(e) => updateObstacle('restitution', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer accent-fuchsia-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Surface Friction</span>
                  <span className="text-fuchsia-400 font-bold">{(sp.obstacleFrictionMod).toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0" max="5" step="0.1"
                  value={sp.obstacleFrictionMod}
                  onChange={(e) => updateObstacle('friction', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer accent-fuchsia-500"
                />
              </div>
            </div>
            
            {/* Additional Static modifiers */}
            <div className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
               <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block border-b border-emerald-950 pb-1.5 flex items-center gap-1">
                Doors & Gates
              </span>
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                  <span className="text-[10.5px] font-bold text-slate-200">Force Keep Closed</span>
                  <input
                    type="checkbox"
                    checked={!!objectRules['door']?.disableFunction}
                    onChange={(e) => updateRule('door', 'disableFunction', e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Hazards */}
        {activeTab === 'hazards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-mono">
            {['laser', 'spike'].map(hazard => (
              <div key={hazard} className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
                <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase block border-b border-rose-950 pb-1.5 flex items-center gap-1 capitalize">
                  <Radiation className="w-3.5 h-3.5 text-rose-400" /> {hazard} Emitting Traps
                </span>
                
                <div className="space-y-2 pt-2">
                  <label className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <span className="text-[10px] font-bold text-slate-200">Disable Completely (Invisible to Ball)</span>
                    <input
                      type="checkbox"
                      checked={!!objectRules[hazard]?.disableFunction}
                      onChange={(e) => updateRule(hazard, 'disableFunction', e.target.checked)}
                      className="w-3.5 h-3.5 accent-rose-500 cursor-pointer"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <span className="text-[10px] font-bold text-slate-200">Is Lethal On Contact</span>
                    <input
                      type="checkbox"
                      checked={objectRules[hazard]?.isLethal !== false}
                      onChange={(e) => updateRule(hazard, 'isLethal', e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <span className="text-[10px] font-bold text-slate-200">Act as Solid Bumper (No phase)</span>
                    <input
                      type="checkbox"
                      checked={!!objectRules[hazard]?.isBouncy}
                      onChange={(e) => updateRule(hazard, 'isBouncy', e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                    />
                  </label>

                  {objectRules[hazard]?.isBouncy && (
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 mt-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-slate-400">Repulsion Force</span>
                        <span className="text-amber-400">{(objectRules[hazard].restitution ?? 0.5).toFixed(1)}</span>
                      </div>
                      <input
                        type="range" min="0" max="2.5" step="0.1"
                        value={objectRules[hazard].restitution ?? 0.5}
                        onChange={(e) => updateRule(hazard, 'restitution', parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Interactives */}
        {activeTab === 'interactive' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-mono">
            {['button', 'star', 'powerup_speed'].map(interactive => (
              <div key={interactive} className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase block border-b border-amber-950 pb-1.5 flex items-center gap-1 capitalize">
                  <Search className="w-3.5 h-3.5 text-amber-400" /> {interactive.replace('_', ' ')}
                </span>
                
                <div className="space-y-2 pt-2">
                   <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <span className="text-[10px] font-bold text-slate-200">Disable Trigger Effect</span>
                    <input
                      type="checkbox"
                      checked={!!objectRules[interactive]?.disableFunction}
                      onChange={(e) => updateRule(interactive, 'disableFunction', e.target.checked)}
                      className="w-3.5 h-3.5 accent-rose-500 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <span className="text-[10px] font-bold text-slate-200">Magnetic Pull (Attract Orb)</span>
                    <input
                      type="checkbox"
                      checked={!!objectRules[interactive]?.magneticPull}
                      onChange={(e) => updateRule(interactive, 'magneticPull', e.target.checked)}
                      className="w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Tab: Thermal */}
        {activeTab === 'thermal' && (
           <div className="text-xs text-slate-300 font-mono space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
              <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase block border-b border-red-950 pb-1.5 flex items-center gap-1">
                🔥 Thermal Mechanics
              </span>
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                <span className="text-[10.5px] font-bold text-slate-200">Shatter/Reset on Extreme Temp</span>
                <input
                  type="checkbox"
                  checked={!!sp.shatterOnExtremeTemp}
                  onChange={(e) => updateScientific('shatterOnExtremeTemp', e.target.checked)}
                  className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                />
              </label>
              <p className="text-slate-400 text-[10px]">If enabled, collisions while extremely hot or cold will shatter/reset the orb.</p>
           </div>
        )}

      </div>
    </div>
  );
}

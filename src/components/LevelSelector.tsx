/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProgress } from '../types';
import { getEraName } from '../physics/levels';
import { Search, Trophy, Globe, Layers, CheckCircle } from 'lucide-react';
import { sfx } from './AudioEngine';

interface LevelSelectorProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  currentLevelId: number;
}

const ERAS = [
  '🚀 Space Graviton',
  '💧 Deep Sea Buoyancy',
  '🌀 Portal Void',
  '💨 Wind Turbine',
  '🌴 Bounce Jungle',
  '🌌 Celestial Axis',
  '🚨 Laser Refinery',
  '🧲 Magneto Mines',
  '🔥 Chaos Crucible',
  '♾️ Absolute Infinity'
];

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  progress,
  onSelectLevel,
  currentLevelId
}) => {
  const [activeEra, setActiveEra] = useState<string>('🚀 Space Graviton');
  const [searchQuery, setSearchQuery] = useState('');

  // Slices level range based on era
  const getLevelRangeForEra = (era: string): { start: number; end: number } => {
    switch (era) {
      case '🚀 Space Graviton': return { start: 1, end: 50 };
      case '💧 Deep Sea Buoyancy': return { start: 51, end: 100 };
      case '🌀 Portal Void': return { start: 101, end: 150 };
      case '💨 Wind Turbine': return { start: 151, end: 200 };
      case '🌴 Bounce Jungle': return { start: 201, end: 250 };
      case '🌌 Celestial Axis': return { start: 251, end: 300 };
      case '🚨 Laser Refinery': return { start: 301, end: 350 };
      case '🧲 Magneto Mines': return { start: 351, end: 400 };
      case '🔥 Chaos Crucible': return { start: 401, end: 450 };
      case '♾️ Absolute Infinity':
      default:
        return { start: 451, end: 500 };
    }
  };

  const handleLevelClick = (id: number) => {
    sfx.play('bounce');
    onSelectLevel(id);
  };

  const { start, end } = getLevelRangeForEra(activeEra);
  const levelsInEra: number[] = [];
  for (let l = start; l <= end; l++) {
    levelsInEra.push(l);
  }

  // Filter levels based on search query
  let filteredLevels = levelsInEra;
  if (searchQuery.trim() !== '') {
    const q = parseInt(searchQuery, 10);
    if (!isNaN(q) && q >= 1 && q <= 500) {
      filteredLevels = [q];
    } else {
      // search by name
      filteredLevels = Array.from({ length: 500 }, (_, i) => i + 1).filter(id =>
        id.toString().includes(searchQuery)
      );
    }
  }

  // Calculate Era Completion Stats
  const completedInEra = levelsInEra.filter(id => progress.completedLevels[id]?.completed).length;

  return (
    <div className="bg-[#1E293B]/60 border border-slate-755 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row gap-6">
      
      {/* Left Sidebar - Era Navigator */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest pl-2 mb-2 flex items-center gap-1.55">
          <Layers className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Thematic Eras (500 Levels)
        </h4>
        
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 scrollbar-none">
          {ERAS.map(e => {
            const isActive = activeEra === e;
            const range = getLevelRangeForEra(e);
            const completedCount = Array.from({ length: 50 }, (_, i) => range.start + i).filter(
              id => progress.completedLevels[id]?.completed
            ).length;

            return (
              <button
                key={e}
                onClick={() => {
                  sfx.play('button');
                  setActiveEra(e);
                  setSearchQuery('');
                }}
                className={`flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 min-w-[150px] outline-none ${
                  isActive
                    ? 'bg-indigo-600 font-bold text-white shadow-[0_4px_15px_rgba(79,70,229,0.35)]'
                    : 'bg-slate-950/40 text-slate-405 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <span>{e}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-900/60'}`}>
                  {completedCount}/50
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Main Panel - Levels Grid */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Interactive Search Toolhead */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/40 p-3 border border-slate-800/60 rounded-xl">
          <div>
            <span className="text-sm font-bold text-white block">
              {searchQuery ? 'Searching Puzzle Grid' : activeEra}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Era completion: {completedInEra}/50 tasks solved ({Math.floor((completedInEra / 50) * 100)}%)
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Jump to Level # (1-500)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono rounded-lg outline-none placeholder-slate-600 transition duration-150"
            />
          </div>
        </div>

        {/* Dynamic Levels Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-10 gap-2 max-h-[350px] overflow-y-auto pr-1">
          {filteredLevels.map(id => {
            const isCompleted = progress.completedLevels[id]?.completed;
            const isActive = currentLevelId === id;
            const record = progress.completedLevels[id];

            return (
              <button
                key={id}
                onClick={() => handleLevelClick(id)}
                className={`relative group aspect-square rounded-xl flex flex-col items-center justify-center border font-mono transition outline-none ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] scale-105'
                    : isCompleted
                    ? 'bg-slate-900 border-emerald-900/40 text-emerald-400 hover:bg-slate-950/60'
                    : 'bg-slate-950/20 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:bg-slate-950/50'
                }`}
              >
                <span className="text-xs font-bold leading-none">{id}</span>
                
                {/* Micro completion Trophy or record time badge */}
                {isCompleted && (
                  <span className="absolute bottom-1 right-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400 fill-slate-950" />
                  </span>
                )}

                {/* Star visual indicator */}
                {record?.bestTime && (
                  <span className="absolute top-1 left-1 flex gap-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trophy className="w-2.5 h-2.5 text-yellow-400" />
                  </span>
                )}
              </button>
            );
          })}

          {filteredLevels.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-sm text-slate-500 font-mono">No matching physics stages found.</p>
            </div>
          )}
        </div>

        {/* Quick Tips Footer */}
        <div className="p-3 bg-slate-950/20 rounded-xl border border-slate-800/45 text-[11px] text-slate-400 leading-relaxed font-mono">
          🚀 Tips: Lower numbered stages focus on core gravitational drift, while higher numbered stages (100+) introduce portals, heavy pressure blocks, and high density liquid reservoirs requiring tactical launch angles.
        </div>

      </div>
    </div>
  );
};

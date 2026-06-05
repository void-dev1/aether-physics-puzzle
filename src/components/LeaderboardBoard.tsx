/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Clock, Medal, Award, Star } from 'lucide-react';
import { sfx } from './AudioEngine';

interface LeaderboardBoardProps {
  levelId: number;
  onSelectLevel: (id: number) => void;
  localBestTime?: number | null;
}

export const LeaderboardBoard: React.FC<LeaderboardBoardProps> = ({
  levelId,
  onSelectLevel,
  localBestTime,
}) => {
  const [leaderboardFilter, setLeaderboardFilter] = useState<number>(levelId);
  const [boardEntries, setBoardEntries] = useState<LeaderboardEntry[]>([]);

  // Update selection filter whenever active level shifts
  useEffect(() => {
    setLeaderboardFilter(levelId);
  }, [levelId]);

  // Generate deterministic global leaderboard opponents based on level ID to keep competition alive
  useEffect(() => {
    const names = ['QuantumSlinger', 'GravitonVoid', 'AetherSprint', 'OrbitsCore', 'PortalDodge', 'HydraFriction', 'VortexRunner'];
    const entries: LeaderboardEntry[] = names.map((name, idx2) => {
      // Deterministic but realistic speed times around the level difficulty multiplier
      const baseEstimate = 4.5 + (leaderboardFilter % 12) * 1.1;
      const computedTime = baseEstimate + idx2 * 0.95 + Math.sin(leaderboardFilter + idx2) * 0.45;
      return {
        userId: `uid_bot_${idx2}`,
        username: name,
        levelId: leaderboardFilter,
        time: Number(computedTime.toFixed(2)),
        skinId: idx2 % 3 === 0 ? 'skin_gold' : idx2 % 2 === 0 ? 'skin_emerald' : 'skin_default',
        timestamp: Date.now() - idx2 * 3600000 - 15 * 60000
      };
    }).sort((a,b) => a.time - b.time);

    // If local player has record on this level, insert them into list dynamically
    if (localBestTime) {
      entries.push({
        userId: 'local_user',
        username: 'You (Best)',
        levelId: leaderboardFilter,
        time: Number(localBestTime.toFixed(2)),
        skinId: 'skin_default',
        timestamp: Date.now()
      });
    }

    // Sort ascending (fastest speed wins)
    entries.sort((a, b) => a.time - b.time);
    setBoardEntries(entries);
  }, [leaderboardFilter, localBestTime]);

  const handleLevelFilterShift = (offset: number) => {
    const target = Math.max(1, Math.min(500, leaderboardFilter + offset));
    sfx.play('button');
    setLeaderboardFilter(target);
    onSelectLevel(target);
  };

  return (
    <div className="bg-[#1E293B]/60 border border-slate-750 rounded-2xl p-5 shadow-xl space-y-5">
      
      {/* Target Level Changer */}
      <div className="flex items-center justify-between border-b border-slate-750 pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Speedrun Rankings</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleLevelFilterShift(-1)}
            disabled={leaderboardFilter <= 1}
            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg disabled:opacity-40 transition duration-150 cursor-pointer"
          >
            &larr;
          </button>
          
          <span className="font-mono text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
            #{leaderboardFilter}
          </span>

          <button
            onClick={() => handleLevelFilterShift(1)}
            disabled={leaderboardFilter >= 500}
            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg disabled:opacity-40 transition duration-150 cursor-pointer"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {boardEntries.map((item, idx) => {
          const isSelf = item.userId === 'local_user';

          return (
            <div
              key={item.userId + idx}
              className={`p-2.5 rounded-xl flex items-center justify-between border transition-all duration-200 ${
                isSelf
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                  : 'bg-slate-950/20 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Visual medal position icons */}
                <div className="w-8 h-8 flex items-center justify-center font-bold">
                  {idx === 0 ? (
                    <Medal className="w-5.5 h-5.5 text-yellow-400" />
                  ) : idx === 1 ? (
                    <Award className="w-5.5 h-5.5 text-slate-300" />
                  ) : idx === 2 ? (
                    <Award className="w-5 h-5 text-amber-600" />
                  ) : (
                    <span className="font-mono text-xs text-slate-500 font-bold">#{idx + 1}</span>
                  )}
                </div>

                <div>
                  <span className={`text-[12.5px] font-bold block ${isSelf ? 'text-indigo-400' : 'text-slate-100'}`}>
                    {item.username}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-mono mt-0.5 block capitalize">
                    Skin: {item.skinId.replace('skin_', '')}
                  </span>
                </div>
              </div>

              {/* Precise time with clock */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-xs font-bold text-slate-200">
                  {item.time.toFixed(2)}s
                </span>
              </div>
            </div>
          );
        })}

        {boardEntries.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No speedruns on Level {leaderboardFilter} yet. Clear this stage to claim #1 rank!
          </div>
        )}
      </div>

      {/* Speed rewards info panel */}
      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-start gap-2">
        <Star className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
          🏆 Rewards: Beating Gold Star targets awards 50 credits. Beating Silver awards 25 credits. Speedrun times are uploaded securely upon stage completion.
        </p>
      </div>

    </div>
  );
};

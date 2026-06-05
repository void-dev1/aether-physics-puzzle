/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { UserProgress } from '../types';
import { Sparkles, Trophy, Settings, Compass, Lock, Zap, Wind, Play, HelpCircle } from 'lucide-react';

interface MainMenuScreenProps {
  progress: UserProgress;
  onSelectMode: (mode: 'campaign' | 'multiplayer' | 'sandbox' | 'escape_room' | 'zero_gravity' | 'abilities_speedrun' | 'tempest_storm') => void;
  onStartChaos: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  progress,
  onSelectMode,
  onStartChaos,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background mini-gravity simulator loop for visual theme ambience
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Re-adjust bounds on window resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string; bounce: number }[] = [];
    const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#ec4899', '#f43f5e', '#fbbf24'];

    for (let i = 0; i < 28; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.4),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 3,
        radius: Math.random() * 12 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        bounce: Math.random() * 0.2 + 0.65,
      });
    }

    const gravity = 0.12;

    const render = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw faint cybernetic background grid
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      const gap = 60;
      for (let x = 0; x < width; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw background ambient light blooms
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.4, 10, width * 0.5, height * 0.4, width * 0.6);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.08)');
      gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.03)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Simulate particles
      particles.forEach((p) => {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;

        // Collision bounds
        if (p.y > height - p.radius) {
          p.y = height - p.radius;
          p.vy *= -p.bounce;
          p.vx *= 0.98;
        }
        if (p.x < p.radius) {
          p.x = p.radius;
          p.vx *= -1;
        }
        if (p.x > width - p.radius) {
          p.x = width - p.radius;
          p.vx *= -1;
        }

        // Draw glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw solid core
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const completedLevelCount = Object.keys(progress.completedLevels || {}).length;

  return (
    <div className="relative min-h-screen flex flex-col text-slate-200 overflow-x-hidden select-none font-sans">
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Main Content Pane */}
      <div className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col justify-between gap-8 h-full">
        {/* Title branding header info */}
        <div className="text-center md:mt-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10.5px] font-mono tracking-wider uppercase font-medium justify-center text-center">
            2D Physics Grid &amp; Gravitational Puzzle Simulator
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white select-none pb-1.5 font-sans">
            Aether Physics
          </h1>
          <p className="max-w-xl mx-auto text-xs md:text-sm text-slate-400 leading-relaxed">
            A minimalist precision vector launcher. Launch balls, steer through gravity fields and fluids, utilize warp portals, and build custom test chambers.
          </p>
        </div>

        {/* Quick Launch Chaos CTA Section */}
        <div className="w-full max-w-4xl mx-auto">
          <button
            id="launch-chaos-btn"
            onClick={onStartChaos}
            className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.01] font-bold text-sm tracking-wide rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.25)] transition-all duration-300 flex items-center justify-center gap-3 border border-indigo-400/30"
          >
            <Sparkles className="w-5 h-5 text-indigo-200" />
            Launch Chaos Sandbox
            <div className="px-2 py-0.5 bg-black/20 text-[9px] text-white rounded font-mono font-normal tracking-normal">
              Random modifiers &amp; interactive hazards
            </div>
          </button>
        </div>

        {/* Mode Grid layout section */}
        <div className="w-full max-w-4xl mx-auto space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono text-center md:text-left">
            Select Game Level Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {/* Campaign Mode Card */}
            <div
              id="mode-card-campaign"
              onClick={() => onSelectMode('campaign')}
              className="group relative cursor-pointer bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4.5 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(99,102,241,0.15)] flex flex-col justify-between gap-4"
            >
              <div className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20 font-bold">
                POPULAR
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition duration-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-indigo-300 transition">
                    Campaign Mode
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Conquer over 500 hand-tailored stages. Master launch angles, gravity corridors, and complex momentum vectors.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Stages: <b>500 Levels</b></span>
                <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">PLAY &rarr;</span>
              </div>
            </div>

            {/* Zero Gravity Mode Card */}
            <div
              id="mode-card-zerog"
              onClick={() => onSelectMode('zero_gravity')}
              className="group relative cursor-pointer bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4.5 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(168,85,247,0.15)] flex flex-col justify-between gap-4"
            >
              <div className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20 font-bold">
                SPECIAL
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition duration-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-purple-300 transition">
                    Orbit Gravity
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Drift weightlessly through custom zero-gravity trial chambers filled with radial vortex fields and hazards.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Stages: <b>3 Main Trials</b></span>
                <span className="text-purple-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">DRIFT IN &rarr;</span>
              </div>
            </div>

            {/* Chronos Speedruns Mode Card */}
            <div
              id="mode-card-speedrun"
              onClick={() => onSelectMode('abilities_speedrun')}
              className="group relative cursor-pointer bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4.5 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] flex flex-col justify-between gap-4"
            >
              <div className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20 font-bold">
                CHALLENGE
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition duration-300">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-amber-300 transition">
                    Speedrun Challenges
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Race against the clock on tough obstacle-filled stages using Dash, Brake, and Gravity Flip.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Abilities: <b>Active Controls</b></span>
                <span className="text-amber-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">RUSH IN &rarr;</span>
              </div>
            </div>

            {/* PvP / Co-op Lobbies Mode Card */}
            <div
              id="mode-card-pvp"
              onClick={() => onSelectMode('multiplayer')}
              className="group relative cursor-pointer bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4.5 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] flex flex-col justify-between gap-4"
            >
              <div className="flex gap-3.5 items-start">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-blue-300 transition">
                    Drone Race
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Trial your speed alongside dynamic Spectre opponent drones navigating overlapping courses.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Opponents: <b>Spectre Drones</b></span>
                <span className="text-blue-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">START RACE &rarr;</span>
              </div>
            </div>

            {/* Escape Rooms Mode Card */}
            <div
              id="mode-card-escape"
              onClick={() => onSelectMode('escape_room')}
              className="group relative cursor-pointer bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4.5 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(16,185,129,0.15)] flex flex-col justify-between gap-4"
            >
              <div className="flex gap-3.5 items-start">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-emerald-300 transition">
                    Puzzle Rooms
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Unlock barricades, trigger remote switches, and clear gates to open up safe paths to the gateway.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Puzzle Keys: <b>3 Complex Rooms</b></span>
                <span className="text-emerald-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">UNLOCK &rarr;</span>
              </div>
            </div>

            {/* Creative Sandbox Mode Card */}
            <div
              id="mode-card-sandbox"
              onClick={() => onSelectMode('sandbox')}
              className="group relative cursor-pointer bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4.5 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_rgba(139,92,246,0.15)] flex flex-col justify-between gap-4"
            >
              <div className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-md border border-violet-500/20 font-bold">
                AUTOSAVE
              </div>
              <div className="flex gap-3.5 items-start">
                <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition duration-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-violet-300 transition">
                    Custom Level Sandbox
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Place custom portals, gravity nodes, liquid zones, and bouncers. Instantly tests and saves progress.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                <span>Status: <b>Custom Lab Editor</b></span>
                <span className="text-violet-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">EDIT &rarr;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info panels for profile and stats summary */}
        <div className="max-w-4xl w-full mx-auto p-4 md:p-5 bg-[#1E293B]/70 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4.5 text-center md:text-left flex-col md:flex-row">
            <div className="relative w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center font-bold font-mono">
              ★
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block font-mono">PERFORMANCE PROFILE</span>
              <span id="player-profile-username" className="text-base font-extrabold text-white block">
                {progress.username}
              </span>
              <div className="flex flex-wrap gap-2.5 mt-1 items-center justify-center md:justify-start">
                <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  🪙 {progress.credits} Coins
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  🎨 Skin: {progress.activeSkin.split('_')[1] || 'Default'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center min-w-[200px]">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-lg font-bold text-indigo-300 font-mono block">
                {completedLevelCount}
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                Cleared Levels
              </span>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-lg font-bold text-pink-300 font-mono block">
                3.5
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                Sim Edition
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

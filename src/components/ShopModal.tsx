/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProgress, BallSkin, BallTrail } from '../types';
import { ShoppingBag, Star, Coins, Check } from 'lucide-react';
import { sfx } from './AudioEngine';

interface ShopModalProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (p: UserProgress) => UserProgress) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Available Skins
export const SKINS_DB: BallSkin[] = [
  { id: 'skin_default', name: 'Cyber Slate', price: 0, color: '#38bdf8', glowColor: '#0ea5e9', style: 'solid', acquired: true },
  { id: 'skin_gold', name: 'Golden Helix', price: 100, color: '#fbbf24', glowColor: '#f59e0b', style: 'chrome', acquired: false },
  { id: 'skin_emerald', name: 'Emerald Quark', price: 150, color: '#34d399', glowColor: '#10b981', style: 'electric', acquired: false },
  { id: 'skin_plasma', name: 'Solar Plasma', price: 220, color: '#f87171', glowColor: '#ef4444', style: 'slime', acquired: false },
  { id: 'skin_prism', name: 'Holo Prism', price: 300, color: '#a78bfa', glowColor: '#8b5cf6', style: 'portal', acquired: false },
  { id: 'skin_antimatter', name: 'Void Obsidian', price: 360, color: '#1e293b', glowColor: '#7c3aed', style: 'solid', acquired: false },
  { id: 'skin_supernova', name: 'Supernova Flare', price: 420, color: '#f97316', glowColor: '#ea580c', style: 'gradient', acquired: false },
  { id: 'skin_absolute_zero', name: 'Cryo Crystal', price: 180, color: '#67e8f9', glowColor: '#06b6d4', style: 'chrome', acquired: false },
  { id: 'skin_toxic', name: 'Toxic Sludge', price: 140, color: '#a3e635', glowColor: '#84cc16', style: 'slime', acquired: false },
  { id: 'skin_glitch', name: 'Matrix Digital', price: 260, color: '#22c55e', glowColor: '#4ade80', style: 'electric', acquired: false },
  { id: 'skin_vaporwave', name: 'Neon Sunset', price: 290, color: '#ec4899', glowColor: '#06b6d4', style: 'gradient', acquired: false },
  { id: 'skin_starlight', name: 'Orion Nebula', price: 450, color: '#f8fafc', glowColor: '#3b82f6', style: 'portal', acquired: false },
  { id: 'skin_pulsar', name: 'Pulsar Core', price: 340, color: '#d946ef', glowColor: '#a855f7', style: 'electric', acquired: false },
  { id: 'skin_blackhole', name: 'Singularity Void', price: 550, color: '#0f172a', glowColor: '#312e81', style: 'solid', acquired: false },
  { id: 'skin_mercury', name: 'Liquid Chrome', price: 480, color: '#cbd5e1', glowColor: '#94a3b8', style: 'chrome', acquired: false },
  { id: 'skin_quantum', name: 'Quantum Quark', price: 240, color: '#2dd4bf', glowColor: '#14b8a6', style: 'electric', acquired: false },
  { id: 'skin_cyberpunk', name: 'Night City', price: 210, color: '#eab308', glowColor: '#ec4899', style: 'gradient', acquired: false },
  { id: 'skin_hydra', name: 'Liquid Aqua', price: 130, color: '#0ea5e9', glowColor: '#0284c7', style: 'slime', acquired: false },
  { id: 'skin_gandalf', name: 'White Wizard', price: 400, color: '#ffffff', glowColor: '#f1f5f9', style: 'solid', acquired: false },
  { id: 'skin_volcano', name: 'Magma Core', price: 280, color: '#f97316', glowColor: '#b91c1c', style: 'slime', acquired: false },
  { id: 'skin_carbon', name: 'Carbon Fiber', price: 320, color: '#475569', glowColor: '#e2e8f0', style: 'chrome', acquired: false },
  { id: 'skin_laser', name: 'Laser Beam', price: 230, color: '#ef4444', glowColor: '#f43f5e', style: 'electric', acquired: false },
  { id: 'skin_vortex', name: 'Vortex Swarm', price: 310, color: '#134e5e', glowColor: '#2f80ed', style: 'portal', acquired: false },
  { id: 'skin_ruby', name: 'Polished Ruby', price: 380, color: '#991b1b', glowColor: '#ef4444', style: 'chrome', acquired: false },
  { id: 'skin_sapphire', name: 'Royal Sapphire', price: 350, color: '#1e3a8a', glowColor: '#3b82f6', style: 'chrome', acquired: false },
  { id: 'skin_quasar', name: 'Quasar Core', price: 500, color: '#10b981', glowColor: '#fbbf24', style: 'portal', acquired: false },
  { id: 'skin_tempest', name: 'Thunder Spark', price: 330, color: '#facc15', glowColor: '#3b82f6', style: 'electric', acquired: false },
  { id: 'skin_bubblegum', name: 'Dream Pop', price: 90, color: '#f472b6', glowColor: '#38bdf8', style: 'gradient', acquired: false },
  { id: 'skin_amber', name: 'Ancient Fossil', price: 160, color: '#d97706', glowColor: '#f59e0b', style: 'gradient', acquired: false },
  { id: 'skin_spectre', name: 'Poltergeist', price: 200, color: '#94a3b8', glowColor: '#10b981', style: 'portal', acquired: false },
  { id: 'skin_hadron', name: 'Collider Hadron', price: 370, color: '#111827', glowColor: '#ef4444', style: 'electric', acquired: false },
  { id: 'skin_muon', name: 'Spectrograph Muon', price: 250, color: '#84cc16', glowColor: '#facc15', style: 'chrome', acquired: false },
  { id: 'skin_positron', name: 'Schrödinger Wave', price: 410, color: '#5b21b6', glowColor: '#ec4899', style: 'portal', acquired: false },
  { id: 'skin_tachyon', name: 'Tachyon Spark', price: 460, color: '#ffffff', glowColor: '#06b6d4', style: 'solid', acquired: false },
  { id: 'skin_dark_matter', name: 'Dark Matter Singularity', price: 520, color: '#030712', glowColor: '#8b5cf6', style: 'solid', acquired: false },
  { id: 'skin_string_theory', name: 'String Vibrations', price: 300, color: '#db2777', glowColor: '#38bdf8', style: 'gradient', acquired: false },
  { id: 'skin_neutrino', name: 'Ghost Neutrino', price: 330, color: '#e2e8f0', glowColor: '#22c55e', style: 'portal', acquired: false },
  { id: 'skin_magnetic', name: 'Tesla Oscillator', price: 220, color: '#0f172a', glowColor: '#6366f1', style: 'electric', acquired: false },
  { id: 'skin_photon', name: 'Luminous Quanta', price: 290, color: '#ffffff', glowColor: '#eab308', style: 'chrome', acquired: false },
  { id: 'skin_bose_einstein', name: 'BE Condensate', price: 440, color: '#06b6d4', glowColor: '#6366f1', style: 'slime', acquired: false }
];

// Available Trails
export const TRAILS_DB: BallTrail[] = [
  { id: 'trail_none', name: 'Static Null', price: 0, color: 'transparent', particleType: 'none', acquired: true },
  { id: 'trail_toxic', name: 'Chrono Spark', price: 80, color: '#a3e635', particleType: 'spark', acquired: false },
  { id: 'trail_bubble', name: 'Vapor Bubble', price: 120, color: '#38bdf8', particleType: 'bubble', acquired: false },
  { id: 'trail_rainbow', name: 'Rainbow Nebula', price: 250, color: '#db2777', particleType: 'rainbow', acquired: false },
  { id: 'trail_magma', name: 'Molten Lava', price: 150, color: '#ea580c', particleType: 'spark', acquired: false },
  { id: 'trail_matrix', name: 'Code Cascade', price: 130, color: '#22c55e', particleType: 'smoke', acquired: false },
  { id: 'trail_supernova', name: 'White Nova', price: 300, color: '#ffffff', particleType: 'spark', acquired: false },
  { id: 'trail_glitch', name: 'Quantum Ping', price: 240, color: '#8b5cf6', particleType: 'smoke', acquired: false },
  { id: 'trail_ocean', name: 'Aqua Tide', price: 110, color: '#0284c7', particleType: 'bubble', acquired: false },
  { id: 'trail_gold', name: 'Midas Touch', price: 400, color: '#eab308', particleType: 'spark', acquired: false },
  { id: 'trail_void', name: 'Black Dust', price: 350, color: '#64748b', particleType: 'smoke', acquired: false },
  { id: 'trail_pink', name: 'Sakura Petal', price: 100, color: '#ec4899', particleType: 'bubble', acquired: false },
  { id: 'trail_laser', name: 'Crimson Laser', price: 190, color: '#ef4444', particleType: 'spark', acquired: false },
  { id: 'trail_storm', name: 'Gale Draft', price: 170, color: '#14b8a6', particleType: 'smoke', acquired: false },
  { id: 'trail_neon', name: 'Night Rider', price: 180, color: '#f43f5e', particleType: 'rainbow', acquired: false },
  { id: 'trail_electric', name: 'Static Bolt', price: 220, color: '#facc15', particleType: 'spark', acquired: false },
  { id: 'trail_cosmic', name: 'Deep Cosmos', price: 270, color: '#6366f1', particleType: 'smoke', acquired: false },
  { id: 'trail_slime', name: 'Acid Green', price: 115, color: '#84cc16', particleType: 'bubble', acquired: false },
  { id: 'trail_ice', name: 'Frozen Shard', price: 185, color: '#93c5fd', particleType: 'spark', acquired: false },
  { id: 'trail_stellar', name: 'Pulsar Flare', price: 310, color: '#d946ef', particleType: 'rainbow', acquired: false },
  { id: 'trail_hadron', name: 'Hadron Flow', price: 280, color: '#ef4444', particleType: 'spark', acquired: false },
  { id: 'trail_plasma_fire', name: 'Plasma Jet', price: 290, color: '#f97316', particleType: 'smoke', acquired: false },
  { id: 'trail_subatomic', name: 'Subatomic Quarks', price: 320, color: '#06b6d4', particleType: 'bubble', acquired: false },
  { id: 'trail_dark_energy', name: 'Dark Energy Flux', price: 360, color: '#a855f7', particleType: 'smoke', acquired: false },
  { id: 'trail_schrodinger', name: 'Wave Probability', price: 340, color: '#ec4899', particleType: 'rainbow', acquired: false },
  { id: 'trail_tachyonic', name: 'Tachyon Stream', price: 450, color: '#ffffff', particleType: 'spark', acquired: false },
  { id: 'trail_magnetic_flux', name: 'Tesla Streamers', price: 210, color: '#eab308', particleType: 'spark', acquired: false },
  { id: 'trail_proton_beam', name: 'Proton Stream', price: 230, color: '#38bdf8', particleType: 'spark', acquired: false },
  { id: 'trail_stardust', name: 'Stardust Orbit', price: 260, color: '#eab308', particleType: 'bubble', acquired: false },
  { id: 'trail_anti_matter', name: 'Annihilation Rays', price: 390, color: '#db2777', particleType: 'smoke', acquired: false }
];

export const ShopModal: React.FC<ShopModalProps> = ({
  progress,
  onUpdateProgress,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBuySkin = (skin: BallSkin) => {
    if (progress.credits < skin.price) {
      alert("Insufficient Aether Credits! Conquer levels and beat clock times to earn more.");
      return;
    }

    onUpdateProgress(prev => {
      if (prev.purchasedSkins.includes(skin.id)) return prev;
      sfx.play('button');
      return {
        ...prev,
        credits: prev.credits - skin.price,
        purchasedSkins: [...prev.purchasedSkins, skin.id],
        activeSkin: skin.id
      };
    });
  };

  const handleEquipSkin = (skinId: string) => {
    onUpdateProgress(prev => {
      sfx.play('bounce');
      return {
        ...prev,
        activeSkin: skinId
      };
    });
  };

  const handleBuyTrail = (trail: BallTrail) => {
    if (progress.credits < trail.price) {
      alert("Insufficient Aether Credits!");
      return;
    }

    onUpdateProgress(prev => {
      if (prev.purchasedTrails.includes(trail.id)) return prev;
      sfx.play('button');
      return {
        ...prev,
        credits: prev.credits - trail.price,
        purchasedTrails: [...prev.purchasedTrails, trail.id],
        activeTrail: trail.id
      };
    });
  };

  const handleEquipTrail = (trailId: string) => {
    onUpdateProgress(prev => {
      sfx.play('bounce');
      return {
        ...prev,
        activeTrail: trailId
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#1E293B] border border-slate-700 rounded-2xl flex flex-col max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <ShoppingBag className="w-5.5 h-5.5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cosmetics Arena Shop</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl">
              <Coins className="w-4.5 h-4.5 text-yellow-400" />
              <span className="font-bold text-slate-100 font-mono text-base">{progress.credits}</span>
            </div>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-mono text-xs px-3.5 py-1.5 border border-slate-700 hover:border-slate-600 rounded-lg transition"
            >
              Close [ESC]
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Skins Grid */}
          <div>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-indigo-400" /> Space Spheres (Projectile Skins)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SKINS_DB.map(skin => {
                const isOwned = progress.purchasedSkins.includes(skin.id) || skin.price === 0;
                const isActive = progress.activeSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`flex flex-col p-4 bg-slate-900/40 border rounded-xl hover:bg-slate-900/60 transition duration-150 ${
                      isActive ? 'border-indigo-500 bg-indigo-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {/* Sphere Mockup */}
                      <div
                        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center relative"
                        style={{
                          background: skin.color,
                          boxShadow: `0 0 12px ${skin.glowColor}`
                        }}
                      >
                        <div className="w-2 h-10 bg-white/20 rotate-45 transform" />
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-white text-sm">{skin.name}</h4>
                        <p className="text-slate-400 text-xs mt-0.5 capitalize">{skin.style} shader</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      {isOwned ? (
                        <button
                          onClick={() => handleEquipSkin(skin.id)}
                          disabled={isActive}
                          className={`w-full py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
                            isActive
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-default'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Equipped
                            </>
                          ) : (
                            'Equip Skin'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuySkin(skin)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Coins className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Unlock for {skin.price}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trails Grid */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-450" /> Chrono Trails (Visual Emitters)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRAILS_DB.map(trail => {
                const isOwned = progress.purchasedTrails.includes(trail.id) || trail.price === 0;
                const isActive = progress.activeTrail === trail.id;

                return (
                  <div
                    key={trail.id}
                    className={`flex flex-col p-4 bg-slate-900/40 border rounded-xl hover:bg-slate-900/60 transition duration-150 ${
                      isActive ? 'border-emerald-500 bg-emerald-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {/* Trail visual */}
                      <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: trail.color || '#334155',
                            boxShadow: trail.color !== 'transparent' ? `0 0 10px ${trail.color}` : 'none'
                          }}
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-white text-sm">{trail.name}</h4>
                        <p className="text-slate-400 text-xs mt-0.5 capitalize">{trail.particleType} particles</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      {isOwned ? (
                        <button
                          onClick={() => handleEquipTrail(trail.id)}
                          disabled={isActive}
                          className={`w-full py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            'Equip Trail'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyTrail(trail)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-505 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Coins className="w-3.5 h-3.5 text-yellow-300" /> Unlock for {trail.price}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
};

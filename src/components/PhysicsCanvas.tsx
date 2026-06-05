/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { LevelConfig, PhysicsBody, Vector2D } from '../types';
import { vec } from '../physics/engine';

interface PhysicsCanvasProps {
  level: LevelConfig;
  bodies: PhysicsBody[];
  dragStart: Vector2D | null;
  dragCurrent: Vector2D | null;
  onLaunch: (force: Vector2D) => void;
  canLaunch: boolean;
  launchScale?: number;
  trajectorySteps?: number;
  lastCollision?: { x: number, y: number, color: string, id: number } | null;
  elapsedTime?: number;
  successfulRunTrail?: Vector2D[];
  activeModifiers?: string[];
  glowEnabled?: boolean;
  maxParticlesCap?: number;
  isDebugMode?: boolean;
}

interface VisualParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'bubble' | 'portal_spin' | 'dust';
}

export const PhysicsCanvas: React.FC<PhysicsCanvasProps> = ({
  level,
  bodies,
  dragStart,
  dragCurrent,
  onLaunch,
  canLaunch,
  launchScale,
  trajectorySteps,
  lastCollision,
  elapsedTime = 0,
  successfulRunTrail = [],
  activeModifiers = [],
  glowEnabled = true,
  maxParticlesCap = 150,
  isDebugMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particles, setParticles] = useState<VisualParticle[]>([]);
  const particlesRef = useRef<VisualParticle[]>([]);

  // Keep particles array synced inside a ref for the high-fps loop to avoid React re-render lag
  particlesRef.current = particles;
  
  const bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;
  
  const dragStartRef = useRef(dragStart);
  dragStartRef.current = dragStart;

  const dragCurrentRef = useRef(dragCurrent);
  dragCurrentRef.current = dragCurrent;

  // Spawns particles for visual animations
  const spawnExplosion = (x: number, y: number, color: string, count = 20, type: 'spark' | 'bubble' | 'dust' = 'spark') => {
    const newParticles: VisualParticle[] = [];
    const countClamped = Math.min(count, maxParticlesCap / 2);
    for (let i = 0; i < countClamped; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      const maxLife = Math.random() * 30 + 15;
      newParticles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: maxLife,
        maxLife,
        type,
      });
    }
    setParticles(prev => [...prev, ...newParticles].slice(-maxParticlesCap)); // cap at maxParticlesCap total active particles
  };

  // Listen to bodies collision events to paint shockwave sparkles
  useEffect(() => {
    const batchedDust: VisualParticle[] = [];
    bodies.forEach(body => {
      if (body.type === 'dynamic' && vec.len(body.velocity) > 2) {
        // Subtle dust trailing
        if (Math.random() > 0.6) {
          let trailColor = body.color || '#22d3ee';
          if (activeModifiers.includes('rainbow_trail')) {
            trailColor = `hsl(${Math.floor(Math.random() * 360)}, 100%, 65%)`;
          }
          const newDust: VisualParticle = {
            id: Math.random().toString(),
            x: body.position.x - body.velocity.x * 0.5,
            y: body.position.y - body.velocity.y * 0.5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: trailColor,
            size: Math.random() * 3 + 1,
            alpha: 0.6,
            life: 20,
            maxLife: 20,
            type: body.isWaterBuoy ? 'bubble' : 'dust'
          };
          batchedDust.push(newDust);
        }
      }
    });
    if (batchedDust.length > 0) {
      setParticles(prev => [...prev, ...batchedDust].slice(-maxParticlesCap));
    }
  }, [bodies, activeModifiers, maxParticlesCap]);

  // Real-time major collision event explosion emitter
  useEffect(() => {
    if (lastCollision) {
      spawnExplosion(lastCollision.x, lastCollision.y, lastCollision.color, 18, 'spark');
    }
  }, [lastCollision]);

  // Main rendering animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let waveOffset = 0;
    let portalSpin = 0;

    const render = () => {
      waveOffset += 0.05;
      portalSpin += 0.03;

      // Update local particles
      const activeParticles = particlesRef.current.map(p => {
        return {
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.type === 'bubble' ? p.vy - 0.06 : p.vy, // bubbles rise
          life: p.life - 1,
          alpha: p.life / p.maxLife
        };
      }).filter(p => p.life > 0);

      // Keep reference updated
      particlesRef.current = activeParticles;

      // Draw Grid Background with Cyberpunk neon styling
      ctx.fillStyle = '#0b0f19'; // dark slate cosmic fill
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Wind Force Zones (wind turbines)
      level.forceZones.forEach(zone => {
        ctx.fillStyle = zone.color;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // draw small floating wind arrow glyphs drifting
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
        ctx.lineWidth = 2;
        const arrowGap = 40;
        const flowShift = (waveOffset * 30) % arrowGap;

        ctx.save();
        ctx.beginPath();
        ctx.rect(zone.x, zone.y, zone.width, zone.height);
        ctx.clip();

        // draw drift indicators based on force direction
        for (let xOffset = 0; xOffset < zone.width + arrowGap; xOffset += arrowGap) {
          for (let yOffset = 15; yOffset < zone.height; yOffset += arrowGap) {
            const x = zone.x + xOffset - flowShift;
            const y = zone.y + yOffset;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 12, y);
            ctx.lineTo(x + 8, y - 4);
            ctx.moveTo(x + 12, y);
            ctx.lineTo(x + 8, y + 4);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      // Draw Thermal Zones
      if (level.thermalZones) {
        level.thermalZones.forEach(zone => {
          ctx.save();
          // Add a subtle oscillating pulse
          const pulse = (Math.sin(waveOffset * 3) + 1) / 2 * 0.2 + 0.3;
          ctx.globalAlpha = pulse;
          ctx.fillStyle = zone.color;
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
          
          ctx.globalAlpha = 1.0; // Reset for border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
          ctx.restore();
        });
      }

      // Draw Fluid Buoyancy Bodies (Waterpools)
      level.fluids.forEach(fluid => {
        ctx.fillStyle = fluid.color;
        ctx.fillRect(fluid.x, fluid.y, fluid.width, fluid.height);

        // Sinusoidal wavy water surface shader
        ctx.fillStyle = 'rgba(14, 165, 233, 0.7)';
        ctx.beginPath();
        ctx.moveTo(fluid.x, fluid.y);
        for (let x = fluid.x; x <= fluid.x + fluid.width; x += 10) {
          const waveHeight = Math.sin((x / 20) + waveOffset) * 6;
          ctx.lineTo(x, fluid.y + waveHeight);
        }
        ctx.lineTo(fluid.x + fluid.width, fluid.y + 12);
        ctx.lineTo(fluid.x, fluid.y + 12);
        ctx.closePath();
        ctx.fill();
      });

      // Draw Gravity force fields (attractors/repellers)
      level.gravityFields.forEach(field => {
        // Draw primary core
        ctx.fillStyle = field.strength < 0 ? '#3b82f6' : '#ef4444'; // blue attractor, red repeller
        ctx.beginPath();
        ctx.arc(field.position.x, field.position.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Glowing force field rings pulsing outwards
        ctx.strokeStyle = field.color;
        ctx.lineWidth = 2;
        const maxR = field.radius;
        const pulseR = ((waveOffset * 15) % maxR);

        ctx.beginPath();
        ctx.arc(field.position.x, field.position.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = field.color.replace('0.25', '0.08');
        ctx.beginPath();
        ctx.arc(field.position.x, field.position.y, maxR, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Level Goal Area
      const goal = level.goal;
      ctx.fillStyle = goal.color;
      ctx.beginPath();
      ctx.arc(goal.position.x, goal.position.y, goal.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing gold target core rings
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      const targetPulse = goal.radius - 4 + Math.sin(waveOffset * 3.5) * 4;
      ctx.beginPath();
      ctx.arc(goal.position.x, goal.position.y, targetPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Draw central spinning star inside Goal
      ctx.save();
      ctx.translate(goal.position.x, goal.position.y);
      ctx.rotate(portalSpin * 0.5);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(0, -18);
        ctx.rotate(Math.PI / 5);
        ctx.lineTo(0, -7);
        ctx.rotate(Math.PI / 5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Level Obstacles
      level.obstacles.forEach(obs => {
        if (obs.width === 0 || obs.height === 0) return; // Open door

        ctx.save();
        ctx.translate(obs.position.x, obs.position.y);
        ctx.rotate(obs.angle);

        ctx.fillStyle = obs.color;
        // subtle highlight border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;

        if (obs.shape === 'box' && obs.width && obs.height) {
          ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
          ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        } else if (obs.shape === 'circle' && obs.radius) {
          ctx.beginPath();
          ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw Interactive Elements (lasers, buttons, doors, etc.)
      level.interactives.forEach(item => {
        if (item.type === 'laser') {
          // Vibrating glowing lethal security laser beam
          const isVert = (item.height ?? 0) > 0;
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 4 + Math.sin(waveOffset * 8) * 1.5;
          if (glowEnabled) {
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 8;
          }

          ctx.beginPath();
          ctx.moveTo(item.position.x, item.position.y);
          ctx.lineTo(item.position.x + (item.width ?? 0), item.position.y + (item.height ?? 0));
          ctx.stroke();

          // Reset shadow
          ctx.shadowBlur = 0;

          // Draw emitter cores
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(item.position.x, item.position.y, 8, 0, Math.PI * 2);
          ctx.arc(item.position.x + (item.width ?? 0), item.position.y + (item.height ?? 0), 8, 0, Math.PI * 2);
          ctx.fill();
        }

        else if (item.type === 'button' || item.type === 'heavy_button') {
          const isHeavy = item.type === 'heavy_button';
          // Plate backing
          ctx.fillStyle = '#020617';
          ctx.fillRect(item.position.x - 22, item.position.y - 4, 44, 8);

          // Glowing trigger button cap
          ctx.fillStyle = item.isTriggered ? '#22c55e' : item.color; // triggers green when clicked
          ctx.beginPath();
          ctx.arc(item.position.x, item.position.y - (item.isTriggered ? 1 : 4), isHeavy ? 14 : 10, Math.PI, 0);
          ctx.fill();

          // Heavy pressure indicators
          if (isHeavy) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(item.position.x - 8, item.position.y - 2, 16, 4);
          }
        }

        else if (item.type === 'spike') {
          // Visual warning spikes
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.moveTo(item.position.x - 12, item.position.y + 12);
          ctx.lineTo(item.position.x, item.position.y - 12);
          ctx.lineTo(item.position.x + 12, item.position.y + 12);
          ctx.closePath();
          ctx.fill();
        }

        else if (item.type === 'powerup_speed') {
          if (!item.isTriggered) {
            ctx.save();
            if (glowEnabled) {
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#f59e0b';
            }
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(item.position.x, item.position.y, 11 + Math.sin(waveOffset * 3) * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', item.position.x, item.position.y - 0.5);
            ctx.restore();
          }
        }

        else if (item.type === 'powerup_shrink') {
          if (!item.isTriggered) {
            ctx.save();
            if (glowEnabled) {
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#a855f7';
            }
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(item.position.x, item.position.y, 11 + Math.cos(waveOffset * 3) * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔍', item.position.x, item.position.y);
            ctx.restore();
          }
        }

        else if (item.type === 'powerup_invert') {
          if (!item.isTriggered) {
            ctx.save();
            if (glowEnabled) {
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#10b981';
            }
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(item.position.x, item.position.y, 11 + Math.sin(waveOffset * 2.5) * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⇅', item.position.x, item.position.y);
            ctx.restore();
          }
        }
        
        else if (item.type === 'bouncy_pad') {
          // Bouncy Pad green jelly platform
          ctx.save();
          ctx.fillStyle = '#10b981';
          if (glowEnabled) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#059669';
          }
          ctx.beginPath();
          ctx.roundRect(item.position.x - (item.width ?? 60)/2, item.position.y - (item.height ?? 20)/2, item.width ?? 60, item.height ?? 20, 10);
          ctx.fill();
          ctx.restore();
        }

        else if (item.type === 'teleporter' && !item.isTriggered) {
          // Teleporter pad purple hole
          ctx.save();
          ctx.fillStyle = '#a855f7';
          if (glowEnabled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#a855f7';
          }
          ctx.beginPath();
          ctx.ellipse(item.position.x, item.position.y, 18, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f3e8ff';
          ctx.beginPath();
          ctx.ellipse(item.position.x, item.position.y, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        else if (item.type === 'heater' && !item.isTriggered) {
          ctx.save();
          ctx.translate(item.position.x, item.position.y);
          ctx.rotate(item.angle || 0);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 20 + Math.sin(waveOffset * 10) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        else if (item.type === 'freezer' && !item.isTriggered) {
          // Freezer icy flake
          ctx.save();
          ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
          ctx.beginPath();
          ctx.arc(item.position.x, item.position.y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(item.position.x - 8, item.position.y);
          ctx.lineTo(item.position.x + 8, item.position.y);
          ctx.moveTo(item.position.x, item.position.y - 8);
          ctx.lineTo(item.position.x, item.position.y + 8);
          ctx.stroke();
          ctx.restore();
        }

        else if (item.type === 'magnet') {
          ctx.save();
          ctx.fillStyle = '#64748b'; // metallic
          ctx.fillRect(item.position.x - 20, item.position.y - 10, 40, 20);
          ctx.fillStyle = '#ef4444'; // north pole red
          ctx.fillRect(item.position.x - 20, item.position.y - 10, 10, 20);
          ctx.fillStyle = '#3b82f6'; // south pole blue
          ctx.fillRect(item.position.x + 10, item.position.y - 10, 10, 20);
          if (glowEnabled) {
            ctx.shadowBlur = 10 + Math.sin(waveOffset * 5) * 5;
            ctx.shadowColor = '#cbd5e1';
          }
          // Magnet waves
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(item.position.x, item.position.y, 35 + (waveOffset * 10) % 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        else if (item.type === 'fan') {
          ctx.save();
          ctx.fillStyle = '#334155';
          ctx.fillRect(item.position.x - 30, item.position.y - 10, 60, 20);
          ctx.fillStyle = '#cbd5e1'; // blades
          ctx.translate(item.position.x, item.position.y);
          ctx.rotate(waveOffset * 20); // spin fast
          ctx.fillRect(-2, -20, 4, 40);
          ctx.fillRect(-20, -2, 40, 4);
          ctx.restore();
          
          // Wind effect
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(item.position.x - 25, item.position.y - 150 - ((waveOffset * 100) % 50), 50, 40);
          ctx.restore();
        }

        else if (item.type === 'conveyor_belt') {
          ctx.save();
          const w = item.width || 60;
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(item.position.x - w/2, item.position.y - 10, w, 20, 10);
          ctx.fill();
          
          // belt lines scrolling
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -(waveOffset * 30);
          ctx.beginPath();
          ctx.moveTo(item.position.x - w/2 + 10, item.position.y - 10);
          ctx.lineTo(item.position.x + w/2 - 10, item.position.y - 10);
          ctx.stroke();
          ctx.restore();
        }

        else if (item.type === 'tar_pit') {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          if (glowEnabled) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#000000';
          }
          ctx.beginPath();
          ctx.ellipse(item.position.x, item.position.y, 40, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Portals
      level.portals.forEach(portal => {
        // Pulsing colored swirling glowing ellipses
        const gradA = ctx.createRadialGradient(portal.posA.x, portal.posA.y, 3, portal.posA.x, portal.posA.y, portal.radius);
        gradA.addColorStop(0, '#ffffff');
        gradA.addColorStop(0.3, portal.color);
        gradA.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradA;
        ctx.beginPath();
        ctx.arc(portal.posA.x, portal.posA.y, portal.radius + Math.sin(waveOffset * 2.5) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Portal B (usually matching color or complementary)
        const compColor = portal.color === '#f97316' ? '#3b82f6' : portal.color;
        const gradB = ctx.createRadialGradient(portal.posB.x, portal.posB.y, 3, portal.posB.x, portal.posB.y, portal.radius);
        gradB.addColorStop(0, '#ffffff');
        gradB.addColorStop(0.3, compColor);
        gradB.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradB;
        ctx.beginPath();
        ctx.arc(portal.posB.x, portal.posB.y, portal.radius + Math.cos(waveOffset * 2.5) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Swirling visual rings
        ctx.strokeStyle = portal.color;
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(portal.posA.x, portal.posA.y);
        ctx.rotate(portalSpin);
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.restore();

        ctx.strokeStyle = compColor;
        ctx.save();
        ctx.translate(portal.posB.x, portal.posB.y);
        ctx.rotate(-portalSpin);
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.restore();
      });

      // Draw Ghost Trajectory overlay from previous successful run
      if (successfulRunTrail && successfulRunTrail.length > 1) {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(successfulRunTrail[0].x, successfulRunTrail[0].y);
        for (let i = 1; i < successfulRunTrail.length; i++) {
          ctx.lineTo(successfulRunTrail[i].x, successfulRunTrail[i].y);
        }
        ctx.stroke();

        // Draw small floating ghost node tracking along the trail
        ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 1.5;
        const ghostIndex = Math.min(successfulRunTrail.length - 1, Math.floor((waveOffset * 10) % successfulRunTrail.length));
        if (ghostIndex >= 0 && successfulRunTrail[ghostIndex]) {
          const ghostPos = successfulRunTrail[ghostIndex];
          ctx.beginPath();
          ctx.arc(ghostPos.x, ghostPos.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Small ghost text identifier
          ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
          ctx.font = '7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 GHOST', ghostPos.x, ghostPos.y - 18);
        }
        ctx.restore();
      }

      // Draw active player bodies
      bodiesRef.current.forEach(body => {
        if (!body.radius) return;

        // Trace glow trail
        if (body.trail.length > 1) {
          ctx.lineWidth = 4;
          for (let i = 1; i < body.trail.length; i++) {
            const p1 = body.trail[i - 1];
            const p2 = body.trail[i];
            const opacity = i / body.trail.length * 0.45;
            
            // Calculate base trail color adjusted by temperature
            let trailBaseColor = body.color;
            if (body.temperature !== undefined) {
              const temp = body.temperature;
              if (temp > 25) {
                const heatRatio = Math.min(1.0, (temp - 25) / 75);
                trailBaseColor = `rgba(255, ${Math.floor(100 - heatRatio * 100)}, 0, 1)`;
              } else if (temp < 15) {
                const coldRatio = Math.min(1.0, (15 - temp) / 65);
                trailBaseColor = `rgba(${Math.floor(150 - coldRatio * 50)}, 220, 255, 1)`;
              }
            }

            // Adjust opacity and apply
            const isRgba = trailBaseColor.includes('rgba');
            if (isRgba) {
              const parts = trailBaseColor.match(/[\d.]+/g);
              if (parts && parts.length >= 4) {
                ctx.strokeStyle = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${Number(parts[3]) * opacity})`;
              } else {
                ctx.strokeStyle = trailBaseColor;
              }
            } else {
              ctx.strokeStyle = `${trailBaseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
            }

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw projectile circle ball
        if (glowEnabled) {
          ctx.shadowColor = body.color;
          ctx.shadowBlur = 10;
        }

        // Custom style skins styling
        let ballFill = body.color;
        const ghostActive = body.type === 'dynamic' && body.ghostModeTimer && body.ghostModeTimer > 0;
        const shieldActive = body.type === 'dynamic' && body.shieldActiveTimer && body.shieldActiveTimer > 0;

        ctx.save();
        
        if (body.temperature !== undefined) {
          const temp = body.temperature;
          if (temp > 25) {
             const heatRatio = Math.min(1.0, (temp - 25) / 75);
             ctx.shadowColor = `rgba(255, 60, 0, ${(heatRatio * 0.8).toFixed(2)})`;
             ctx.shadowBlur = 10 + heatRatio * 15;
             ballFill = `rgba(255, ${Math.floor(100 - heatRatio * 100)}, 0, 1)`;
          } else if (temp < 15) {
             const coldRatio = Math.min(1.0, (15 - temp) / 65);
             ctx.shadowColor = `rgba(0, 200, 255, ${(coldRatio * 0.8).toFixed(2)})`;
             ctx.shadowBlur = 10 + coldRatio * 15;
             ballFill = `rgba(${Math.floor(150 - coldRatio * 50)}, 220, 255, 1)`;
          }
        }

        if (ghostActive) {
          ctx.globalAlpha = 0.45; // Ghost phase shift transparency
        }

        if (body.type === 'dynamic') {
          if (body.speedBoostTimer && body.speedBoostTimer > 0) {
            ballFill = '#f59e0b';
          } else if (body.gravityInverterTimer && body.gravityInverterTimer > 0) {
            ballFill = '#10b981';
          }
        }
        
        ctx.fillStyle = ballFill;
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset glow

        // Shield active deflector rings
        if (shieldActive) {
          ctx.save();
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 3 + Math.sin(waveOffset * 10) * 1;
          if (glowEnabled) {
            ctx.shadowColor = '#a78bfa';
            ctx.shadowBlur = 12;
          }
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, body.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Ghost active dash lines
        if (ghostActive) {
          ctx.save();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, body.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore(); // Restore alpha states if modified

        // Render external concentric orbits / halos for power-ups
        if (body.type === 'dynamic') {
          if (body.speedBoostTimer && body.speedBoostTimer > 0) {
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            if (glowEnabled) {
              ctx.shadowColor = '#f59e0b';
              ctx.shadowBlur = 8 + Math.sin(waveOffset * 8) * 4;
            }
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, body.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          if (body.shrinkTimer && body.shrinkTimer > 0) {
            ctx.save();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 1;
            if (glowEnabled) {
              ctx.shadowColor = '#a855f7';
              ctx.shadowBlur = 6 + Math.cos(waveOffset * 6) * 3;
            }
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, body.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          if (body.gravityInverterTimer && body.gravityInverterTimer > 0) {
            ctx.save();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            if (glowEnabled) {
              ctx.shadowColor = '#10b981';
              ctx.shadowBlur = 10;
            }
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, body.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw interior decorative features to show rotating angle visually
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(body.position.x, body.position.y);
        ctx.lineTo(
          body.position.x + Math.cos(body.angle) * body.radius,
          body.position.y + Math.sin(body.angle) * body.radius
        );
        ctx.stroke();

        // Debug visualization
        if (isDebugMode) {
          // Velocity vector
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(body.position.x, body.position.y);
          ctx.lineTo(body.position.x + body.velocity.x * 10, body.position.y + body.velocity.y * 10);
          ctx.stroke();

          // Collision boundary
          ctx.strokeStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, body.radius ?? 15, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw launching slingshot pull trajectory line
      const _dragStart = dragStartRef.current;
      const _dragCurrent = dragCurrentRef.current;
      if (_dragStart && _dragCurrent && canLaunch) {
        const pullVec = vec.sub(_dragStart, _dragCurrent);
        const force = vec.scale(pullVec, launchScale ?? 0.08);

        ctx.save();
        // Slingshot guide anchors
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(_dragStart.x, _dragStart.y, 45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#facc15'; // golden yellow launching vector line
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(_dragStart.x, _dragStart.y);
        ctx.lineTo(_dragCurrent.x, _dragCurrent.y);
        ctx.stroke();

        // Draw predicted trajectory dotted curve based on gravity and environments
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.lineWidth = 3.5;

        // Active visual streaming effect for trajectory dashes! (Ultra high speed)
        ctx.setLineDash([8, 10]);
        const forceMagnitude = vec.len(force);
        // Animate dash offset based on time and launcher pull strength - significantly faster!
        const flowSpeed = 0.08 * Math.max(4.0, forceMagnitude);
        ctx.lineDashOffset = -(performance.now() * flowSpeed);

        ctx.beginPath();
        ctx.moveTo(_dragStart.x, _dragStart.y);

        let tempPos = { ..._dragStart };
        let tempVel = { ...force };
        const steps = trajectorySteps ?? 60;
        
        // Accumulate points to render flowing comet trails along the line
        const trajectoryPoints: Vector2D[] = [{ ...tempPos }];
        
        for (let t = 0; t < steps; t++) {
          let tempAcc = vec.add(vec.create(0, 0), level.gravity);
          if (level.wind) {
            tempAcc = vec.add(tempAcc, level.wind);
          }

          // Fields simulation
          for (const field of level.gravityFields) {
            const d = vec.sub(field.position, tempPos);
            const dist = vec.len(d);
            if (dist <= field.radius && dist > 1) {
              const dir = vec.norm(d);
              if (field.type === 'radial') {
                const forceStrength = (field.strength * 50) / (dist * dist + 100);
                tempAcc = vec.add(tempAcc, vec.scale(dir, forceStrength));
              } else if (field.type === 'vortex') {
                const forceStrength = (field.strength * 30) / (dist + 50);
                const tangent = vec.create(-dir.y, dir.x);
                tempAcc = vec.add(tempAcc, vec.scale(tangent, forceStrength));
                tempAcc = vec.add(tempAcc, vec.scale(dir, forceStrength * 0.2));
              } else if (field.type === 'directional' && field.direction) {
                tempAcc = vec.add(tempAcc, vec.scale(field.direction, field.strength));
              }
            }
          }

          // Wind zones simulation
          for (const zone of level.forceZones) {
            if (
              tempPos.x >= zone.x &&
              tempPos.x <= zone.x + zone.width &&
              tempPos.y >= zone.y &&
              tempPos.y <= zone.y + zone.height
            ) {
              tempAcc = vec.add(tempAcc, zone.force);
            }
          }

          // Physics kinematics exactly matches the main engine integration steps! (Frame step discretisation)
          tempVel = vec.add(tempVel, tempAcc);
          tempPos = vec.add(tempPos, tempVel);
          
          ctx.lineTo(tempPos.x, tempPos.y);
          trajectoryPoints.push({ ...tempPos });
        }
        ctx.stroke();

        // Render high-speed blazing laser comet sparks cascading down the calculated points!
        if (trajectoryPoints.length > 1) {
          // Hyper fast loop (completes in ~250 milliseconds)
          const cometTimer = (performance.now() * 0.004) % 1.0; 
          const exactIndex = cometTimer * (trajectoryPoints.length - 1);
          const baseIndex = Math.floor(exactIndex);
          const fract = exactIndex - baseIndex;

          if (baseIndex < trajectoryPoints.length - 1) {
            const p1 = trajectoryPoints[baseIndex];
            const p2 = trajectoryPoints[baseIndex + 1];
            const cometX = p1.x + (p2.x - p1.x) * fract;
            const cometY = p1.y + (p2.y - p1.y) * fract;

            ctx.save();
            if (glowEnabled) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#fbbf24';
            }
            
            // Outer flare
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.arc(cometX, cometY, 12, 0, Math.PI * 2);
            ctx.fill();

            // Inner hot core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cometX, cometY, 4.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
          }
        }

        ctx.restore();
      }

      // Render active dust or bounce shock sparkles
      activeParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0; // reset transparency

      // Request next frame
      animId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [level, canLaunch, launchScale, trajectorySteps]);

  // Handle local dragging aim
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canLaunch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Launch from the current dynamic body ball position
    const ballBody = bodies.find(b => b.type === 'dynamic');
    if (ballBody) {
      onLaunch(vec.create(x, y)); // pass initial coordinate
    }
  };

  // Handle touch starting aim
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canLaunch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    // Launch from the current dynamic body ball position
    const ballBody = bodies.find(b => b.type === 'dynamic');
    if (ballBody) {
      onLaunch(vec.create(x, y)); // pass initial touch coordinate
    }
  };

  return (
    <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-[#0b0f19]">
      <canvas
        id="physics-main-stage"
        ref={canvasRef}
        width={1000}
        height={650}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="block cursor-crosshair w-full h-auto"
      />
      <div className="absolute top-3 left-4 pointer-events-none flex gap-3">
        <span className="px-3 py-1 bg-slate-900/80 border border-slate-700/50 text-xs text-slate-300 font-mono rounded-md">
          Theme: {level.theme}
        </span>
        <span className="px-3 py-1 bg-slate-900/80 border border-slate-700/50 text-xs text-slate-300 font-mono rounded-md">
          Gravity: X: {level.gravity.x} Y: {level.gravity.y}
        </span>
      </div>
      {/* Floating Speedrunner HUD Overlay */}
      <div className="absolute top-3 right-4 pointer-events-none flex flex-col items-end gap-2">
        <span className="px-3 py-1.5 bg-slate-900/90 border border-slate-750 text-xs text-cyan-400 font-bold font-mono rounded-xl shadow-lg flex items-center gap-2 backdrop-blur-md">
          ⏱️ Run Time: {elapsedTime.toFixed(3)}s
        </span>

        {/* Thermometer */}
        {(() => {
          const ball = bodies.find(b => b.type === 'dynamic');
          if (!ball) return null;
          const temp = ball.temperature ?? 20;
          const percentage = Math.min(100, Math.max(0, ((temp + 40) / 120 * 100)));
          return (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-750 px-3 py-1.5 rounded-xl text-[9px] font-mono text-slate-300">
              <span className="text-[10px]">🌡️</span>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })()}
        
        <div className="bg-slate-950/90 backdrop-blur-lg border border-slate-800 rounded-2xl p-3 shadow-xl min-w-[210px] flex flex-col gap-1.5 font-mono text-xs text-right">
          <div className="text-[9.5px] text-slate-400 font-bold tracking-wider uppercase border-b border-slate-800/60 pb-1 flex justify-between items-center select-none">
            <span>● TARGET TIMES</span>
            <span className="text-slate-400">MEDALS</span>
          </div>
          <div className="flex flex-col gap-1 mt-1 text-left">
            {/* Gold Star */}
            <div className={`flex justify-between items-center px-1.5 py-1 rounded-lg transition duration-200 border ${elapsedTime <= level.goldTime ? 'text-yellow-400 bg-yellow-950/25 border-yellow-500/20 font-semibold' : 'text-slate-500 bg-slate-900/40 border-transparent line-through'}`}>
              <span className="flex items-center gap-1">🏆 Gold Time</span>
              <span>&lt;{level.goldTime.toFixed(1)}s</span>
            </div>
            {/* Silver Star */}
            <div className={`flex justify-between items-center px-1.5 py-1 rounded-lg transition duration-200 border ${elapsedTime <= level.silverTime ? (elapsedTime > level.goldTime ? 'text-slate-200 bg-slate-800/45 border-slate-500/20 font-semibold' : 'text-slate-300 border-transparent') : 'text-slate-500 bg-slate-900/40 border-transparent line-through'}`}>
              <span className="flex items-center gap-1 font-medium">🥈 Silver Time</span>
              <span>&lt;{level.silverTime.toFixed(1)}s</span>
            </div>
            {/* Bronze Star */}
            <div className={`flex justify-between items-center px-1.5 py-1 rounded-lg transition duration-200 border ${elapsedTime <= level.bronzeTime ? (elapsedTime > level.silverTime ? 'text-amber-600 bg-amber-950/30 border-amber-500/20 font-semibold' : 'text-slate-400 border-transparent') : 'text-slate-500 bg-slate-900/40 border-transparent line-through'}`}>
              <span className="flex items-center gap-1 text-slate-400">🥉 Bronze Time</span>
              <span>&lt;{level.bronzeTime.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

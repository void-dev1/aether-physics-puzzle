import React, { useRef, useEffect, useState } from 'react';
import { Sliders, Activity, Zap, RefreshCw, Atom, Info, Gauge, Compass, Flame, Shield, Sparkles } from 'lucide-react';
import { sfx } from './AudioEngine';

interface ScientificLabProps {
  engineRef: React.MutableRefObject<any>;
  scientificParamsRef: React.MutableRefObject<{
    gravityYMod: number;
    gravityXMod: number;
    restitutionMod: number;
    frictionMod: number;
    collisionImpulseMod: number;
    fluidViscosityMod: number;
    fluidBuoyancyMod: number;
    atmosphereDensityMod: number;
    quantumVibrationsMod: number;
    gravitationalWaveAmplitude: number;
    gravitationalWaveFrequency: number;
    thermodynamicHeat: number;
    magneticFieldCurl: number;
    darkEnergyExpansion: number;
    timeDilationScale: number;
    blackHoleFactor: number;
    centrifugalVortex: number;
    antiMatterShield: number;
    newtonianGConstant: number;
    planckConstantScale: number;
    subSteps: number;
  }>;
  onInstantReset: () => void;
  ballVelocity: { x: number; y: number };
}

export const ScientificLab: React.FC<ScientificLabProps> = ({
  engineRef,
  scientificParamsRef,
  onInstantReset,
  ballVelocity,
}) => {
  const [activeTab, setActiveTab] = useState<'control_deck' | 'oscilloscope' | 'presets'>('control_deck');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveOffsetRef = useRef<number>(0);

  // Define local states so that HTML elements/sliders update on slide with ZERO lag
  const p = scientificParamsRef.current;
  const [gravityY, setGravityY] = useState(p.gravityYMod);
  const [gravityX, setGravityX] = useState(p.gravityXMod);
  const [restitution, setRestitution] = useState(p.restitutionMod);
  const [friction, setFriction] = useState(p.frictionMod);
  const [collisionImpulse, setCollisionImpulse] = useState(p.collisionImpulseMod);
  const [fluidViscosity, setFluidViscosity] = useState(p.fluidViscosityMod);
  const [fluidBuoyancy, setFluidBuoyancy] = useState(p.fluidBuoyancyMod);
  const [atmosphereDensity, setAtmosphereDensity] = useState(p.atmosphereDensityMod);
  const [quantumVibrations, setQuantumVibrations] = useState(p.quantumVibrationsMod);
  const [gravitationalWaveAmt, setGravitationalWaveAmt] = useState(p.gravitationalWaveAmplitude);
  const [gravitationalWaveFreq, setGravitationalWaveFreq] = useState(p.gravitationalWaveFrequency);
  const [thermodynamicK, setThermodynamicK] = useState(p.thermodynamicHeat);
  const [magneticCurl, setMagneticCurl] = useState(p.magneticFieldCurl);
  const [darkEnergy, setDarkEnergy] = useState(p.darkEnergyExpansion);
  const [dilationScale, setDilationScale] = useState(p.timeDilationScale);

  // New states
  const [blackHoleFactor, setBlackHoleFactor] = useState(p.blackHoleFactor);
  const [centrifugalVortex, setCentrifugalVortex] = useState(p.centrifugalVortex);
  const [antiMatterShield, setAntiMatterShield] = useState(p.antiMatterShield);
  const [newtonianGConstant, setNewtonianGConstant] = useState(p.newtonianGConstant);
  const [planckConstantScale, setPlanckConstantScale] = useState(p.planckConstantScale);
  const [subSteps, setSubSteps] = useState(p.subSteps);

  // Sync state values with ref and active engine instance on-the-fly
  const updateField = (key: keyof typeof p, value: number) => {
    scientificParamsRef.current[key] = value;
    if (engineRef.current) {
      // Map properties to names expected by engine
      if (key === 'gravityYMod') engineRef.current.gravityMultiplierY = value;
      else if (key === 'gravityXMod') engineRef.current.gravityMultiplierX = value;
      else if (key === 'restitutionMod') engineRef.current.restitutionMultiplier = value;
      else if (key === 'frictionMod') engineRef.current.frictionMultiplier = value;
      else if (key === 'fluidViscosityMod') engineRef.current.fluidViscosityMultiplier = value;
      else if (key === 'fluidBuoyancyMod') engineRef.current.fluidBuoyancyMultiplier = value;
      else if (key === 'collisionImpulseMod') engineRef.current.collisionImpulseMultiplier = value;
      else if (key === 'quantumVibrationsMod') engineRef.current.quantumVibrations = value;
      else if (key === 'atmosphereDensityMod') engineRef.current.atmosphereDensity = value;
      else if (key === 'gravitationalWaveAmplitude') engineRef.current.gravitationalWaveAmplitude = value;
      else if (key === 'gravitationalWaveFrequency') engineRef.current.gravitationalWaveFrequency = value;
      else if (key === 'thermodynamicHeat') engineRef.current.thermodynamicHeat = value;
      else if (key === 'magneticFieldCurl') engineRef.current.magneticFieldCurl = value;
      else if (key === 'darkEnergyExpansion') engineRef.current.darkEnergyExpansion = value;
      else if (key === 'timeDilationScale') engineRef.current.timeDilationScale = value;
      else if (key === 'blackHoleFactor') engineRef.current.blackHoleFactor = value;
      else if (key === 'centrifugalVortex') engineRef.current.centrifugalVortex = value;
      else if (key === 'antiMatterShield') engineRef.current.antiMatterShield = value;
      else if (key === 'newtonianGConstant') engineRef.current.newtonianGConstant = value;
      else if (key === 'planckConstantScale') engineRef.current.planckConstantScale = value;
      else if (key === 'subSteps') engineRef.current.subSteps = value;
    }
  };

  // Helper sync functions
  const setGravityYValue = (v: number) => { setGravityY(v); updateField('gravityYMod', v); };
  const setGravityXValue = (v: number) => { setGravityX(v); updateField('gravityXMod', v); };
  const setRestitutionValue = (v: number) => { setRestitution(v); updateField('restitutionMod', v); };
  const setFrictionValue = (v: number) => { setFriction(v); updateField('frictionMod', v); };
  const setCollisionImpulseValue = (v: number) => { setCollisionImpulse(v); updateField('collisionImpulseMod', v); };
  const setFluidViscosityValue = (v: number) => { setFluidViscosity(v); updateField('fluidViscosityMod', v); };
  const setFluidBuoyancyValue = (v: number) => { setFluidBuoyancy(v); updateField('fluidBuoyancyMod', v); };
  const setAtmosphereDensityValue = (v: number) => { setAtmosphereDensity(v); updateField('atmosphereDensityMod', v); };
  const setQuantumVibrationsValue = (v: number) => { setQuantumVibrations(v); updateField('quantumVibrationsMod', v); };
  const setGravitationalWaveAmtValue = (v: number) => { setGravitationalWaveAmt(v); updateField('gravitationalWaveAmplitude', v); };
  const setGravitationalWaveFreqValue = (v: number) => { setGravitationalWaveFreq(v); updateField('gravitationalWaveFrequency', v); };
  const setThermodynamicKValue = (v: number) => { setThermodynamicK(v); updateField('thermodynamicHeat', v); };
  const setMagneticCurlValue = (v: number) => { setMagneticCurl(v); updateField('magneticFieldCurl', v); };
  const setDarkEnergyValue = (v: number) => { setDarkEnergy(v); updateField('darkEnergyExpansion', v); };
  const setDilationScaleValue = (v: number) => { setDilationScale(v); updateField('timeDilationScale', v); };

  const setBlackHoleFactorValue = (v: number) => { setBlackHoleFactor(v); updateField('blackHoleFactor', v); };
  const setCentrifugalVortexValue = (v: number) => { setCentrifugalVortex(v); updateField('centrifugalVortex', v); };
  const setAntiMatterShieldValue = (v: number) => { setAntiMatterShield(v); updateField('antiMatterShield', v); };
  const setNewtonianGConstantValue = (v: number) => { setNewtonianGConstant(v); updateField('newtonianGConstant', v); };
  const setPlanckConstantScaleValue = (v: number) => { setPlanckConstantScale(v); updateField('planckConstantScale', v); };
  const setSubStepsValue = (v: number) => { setSubSteps(v); updateField('subSteps', v); };

  // Computed live metrics for telemetry display
  const ballSpeed = Math.sqrt(ballVelocity.x ** 2 + ballVelocity.y ** 2);
  const kineticEnergy = 0.5 * (ballSpeed ** 2) * 100; // arbitrary mass factor 100 for visual effect
  const quantumChaosScore = (quantumVibrations * 2.5) + (thermodynamicK * 1.5);

  useEffect(() => {
    // When oscilloscope is active, animate waveform visualization
    if (activeTab !== 'oscilloscope') return;
    
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = 'rgba(8, 12, 24, 0.28)'; // Deep space backdrop
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Precision Grid Layout (Scientific Reticle)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      // Verticals
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      // Horizontals
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Center coordinate axes
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Dynamic waveform calculations based on real velocity & lab status
      const amp = 15 + Math.min(65, ballSpeed * 3.5) + (gravitationalWaveAmt * 8) + (blackHoleFactor * 12);
      const freq = 0.035 + (1 / (15 + ballSpeed * 0.4)) + (gravitationalWaveFreq * 0.01) + (centrifugalVortex * 0.015);
      
      // Secondary modulation
      const modAmp = 5 + (thermodynamicK * 0.5);

      // Schrödinger Probability Distribution Curve
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)'; // Cyan main wave
      ctx.lineWidth = 2.5;
      
      // Horizontal wave translation
      for (let i = 0; i < canvas.width; i++) {
        // Complex modulation blending a primary sine and high-frequency thermal vibration
        const thermalJitter = thermodynamicK > 0 ? (Math.random() - 0.5) * thermodynamicK * 1.8 : 0;
        const baseSine = Math.sin(i * freq + waveOffsetRef.current) * amp;
        const subHarmer = Math.cos(i * (freq * 2.3) - waveOffsetRef.current * 0.7) * modAmp;
        const targetY = canvas.height / 2 + baseSine + subHarmer + thermalJitter;

        if (i === 0) ctx.moveTo(i, targetY);
        else ctx.lineTo(i, targetY);
      }
      ctx.stroke();

      // De Broglie Matter Envelope (Lower Amplitude)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)'; // Soft Pink envelope
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < canvas.width; i++) {
        const envelope = canvas.height / 2 + Math.sin(i * (freq * 0.4) + waveOffsetRef.current * 0.5) * (amp * 1.3);
        if (i === 0) ctx.moveTo(i, envelope);
        else ctx.lineTo(i, envelope);
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dashes

      // Magnetic Lorenz flux curling trace
      if (magneticCurl !== 0 || centrifugalVortex !== 0) {
        const activeCurl = magneticCurl + centrifugalVortex;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)'; // Purple
        ctx.lineWidth = 1.5;
        for (let i = 0; i < canvas.width; i += 8) {
          const curlY = canvas.height / 2 + Math.cos(i * 0.05 + waveOffsetRef.current * 1.8) * (activeCurl * 15);
          ctx.arc(i, curlY, 1.5, 0, Math.PI * 2);
        }
        ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.fill();
      }

      waveOffsetRef.current += 0.06 * dilationScale; // Speed scaled with live Dilation warp
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeTab, ballSpeed, gravitationalWaveAmt, gravitationalWaveFreq, thermodynamicK, magneticCurl, dilationScale, blackHoleFactor, centrifugalVortex]);

  // Keep state values in synchronization when scientificParamsRef itself changes from a preset
  const applyParamsVal = (src: typeof p) => {
    setGravityY(src.gravityYMod);
    setGravityX(src.gravityXMod);
    setRestitution(src.restitutionMod);
    setFriction(src.frictionMod);
    setCollisionImpulse(src.collisionImpulseMod);
    setFluidViscosity(src.fluidViscosityMod);
    setFluidBuoyancy(src.fluidBuoyancyMod);
    setAtmosphereDensity(src.atmosphereDensityMod);
    setQuantumVibrations(src.quantumVibrationsMod);
    setGravitationalWaveAmt(src.gravitationalWaveAmplitude);
    setGravitationalWaveFreq(src.gravitationalWaveFrequency);
    setThermodynamicK(src.thermodynamicHeat);
    setMagneticCurl(src.magneticFieldCurl);
    setDarkEnergy(src.darkEnergyExpansion);
    setDilationScale(src.timeDilationScale);

    setBlackHoleFactor(src.blackHoleFactor);
    setCentrifugalVortex(src.centrifugalVortex);
    setAntiMatterShield(src.antiMatterShield);
    setNewtonianGConstant(src.newtonianGConstant);
    setPlanckConstantScale(src.planckConstantScale);
    setSubSteps(src.subSteps);

    // Apply each to current engine ref directly
    Object.keys(src).forEach((k) => {
      updateField(k as any, src[k as any]);
    });
  };

  const applyPreset = (key: string) => {
    sfx.play('button');
    const newConf = { ...scientificParamsRef.current };
    switch (key) {
      case 'vacuum':
        newConf.gravityYMod = 0.0;
        newConf.gravityXMod = 0.0;
        newConf.restitutionMod = 1.0;
        newConf.frictionMod = 0.0;
        newConf.atmosphereDensityMod = 0.0;
        newConf.fluidViscosityMod = 1.0;
        newConf.fluidBuoyancyMod = 1.0;
        newConf.collisionImpulseMod = 1.0;
        newConf.quantumVibrationsMod = 0.0;
        newConf.gravitationalWaveAmplitude = 0.0;
        newConf.thermodynamicHeat = 0.0;
        newConf.magneticFieldCurl = 0.0;
        newConf.darkEnergyExpansion = 0.0;
        newConf.timeDilationScale = 1.0;
        newConf.blackHoleFactor = 0.0;
        newConf.centrifugalVortex = 0.0;
        newConf.antiMatterShield = 0.0;
        newConf.newtonianGConstant = 0.0;
        newConf.planckConstantScale = 1.0;
        newConf.subSteps = 1; // Ultra-fast raw performance
        break;
      case 'jupiter':
        newConf.gravityYMod = 2.4;
        newConf.gravityXMod = 0.0;
        newConf.restitutionMod = 0.75;
        newConf.frictionMod = 1.6;
        newConf.atmosphereDensityMod = 2.3;
        newConf.fluidViscosityMod = 1.8;
        newConf.fluidBuoyancyMod = 0.85;
        newConf.collisionImpulseMod = 1.25;
        newConf.quantumVibrationsMod = 0.0;
        newConf.gravitationalWaveAmplitude = 0.0;
        newConf.thermodynamicHeat = 15.0;
        newConf.magneticFieldCurl = -0.5;
        newConf.darkEnergyExpansion = 0.0;
        newConf.timeDilationScale = 0.8;
        newConf.blackHoleFactor = 0.2;
        newConf.centrifugalVortex = 0.1;
        newConf.antiMatterShield = 0.0;
        newConf.newtonianGConstant = 2.4;
        newConf.planckConstantScale = 1.0;
        newConf.subSteps = 3;
        break;
      case 'hadron':
        newConf.gravityYMod = 0.12;
        newConf.gravityXMod = 0.0;
        newConf.restitutionMod = 1.65;
        newConf.frictionMod = 0.0;
        newConf.atmosphereDensityMod = 0.0;
        newConf.fluidViscosityMod = 0.1;
        newConf.fluidBuoyancyMod = 1.0;
        newConf.collisionImpulseMod = 1.9;
        newConf.quantumVibrationsMod = 4.5;
        newConf.gravitationalWaveAmplitude = 1.2;
        newConf.gravitationalWaveFrequency = 3.5;
        newConf.thermodynamicHeat = 70.0;
        newConf.magneticFieldCurl = 1.4;
        newConf.darkEnergyExpansion = 1.2;
        newConf.timeDilationScale = 1.6;
        newConf.blackHoleFactor = 0.0;
        newConf.centrifugalVortex = 1.5;
        newConf.antiMatterShield = 0.5;
        newConf.newtonianGConstant = 0.2;
        newConf.planckConstantScale = 3.5;
        newConf.subSteps = 6; // High accuracy mode
        break;
      case 'fluid_sub':
        newConf.gravityYMod = 0.65;
        newConf.gravityXMod = 0.0;
        newConf.restitutionMod = 0.35;
        newConf.frictionMod = 1.4;
        newConf.atmosphereDensityMod = 0.4;
        newConf.fluidViscosityMod = 3.5;
        newConf.fluidBuoyancyMod = 2.4;
        newConf.collisionImpulseMod = 0.55;
        newConf.quantumVibrationsMod = 0.0;
        newConf.gravitationalWaveAmplitude = 0.0;
        newConf.thermodynamicHeat = 0.0;
        newConf.magneticFieldCurl = -0.8;
        newConf.darkEnergyExpansion = 0.0;
        newConf.timeDilationScale = 0.95;
        newConf.blackHoleFactor = 0.0;
        newConf.centrifugalVortex = -0.4;
        newConf.antiMatterShield = 0.0;
        newConf.newtonianGConstant = 0.85;
        newConf.planckConstantScale = 1.0;
        newConf.subSteps = 2;
        break;
      case 'plasma_fusion':
        newConf.gravityYMod = 0.4;
        newConf.gravityXMod = 0.2;
        newConf.restitutionMod = 1.25;
        newConf.frictionMod = 0.5;
        newConf.atmosphereDensityMod = 0.8;
        newConf.fluidViscosityMod = 0.6;
        newConf.fluidBuoyancyMod = 1.2;
        newConf.collisionImpulseMod = 1.4;
        newConf.quantumVibrationsMod = 2.0;
        newConf.gravitationalWaveAmplitude = 0.8;
        newConf.gravitationalWaveFrequency = 2.2;
        newConf.thermodynamicHeat = 95.0;
        newConf.magneticFieldCurl = -1.8;
        newConf.darkEnergyExpansion = 0.4;
        newConf.timeDilationScale = 1.3;
        newConf.blackHoleFactor = 0.5;
        newConf.centrifugalVortex = -1.2;
        newConf.antiMatterShield = 0.8;
        newConf.newtonianGConstant = 1.0;
        newConf.planckConstantScale = 2.0;
        newConf.subSteps = 4;
        break;
      case 'zero_bose':
        newConf.gravityYMod = 0.0;
        newConf.gravityXMod = 0.0;
        newConf.restitutionMod = 1.0;
        newConf.frictionMod = 0.1;
        newConf.atmosphereDensityMod = 0.0;
        newConf.fluidViscosityMod = 0.05;
        newConf.fluidBuoyancyMod = 0.0;
        newConf.collisionImpulseMod = 0.8;
        newConf.quantumVibrationsMod = 0.0;
        newConf.gravitationalWaveAmplitude = 0.0;
        newConf.thermodynamicHeat = 0.0; // ABSOLUTE ZERO TEMPERATURE
        newConf.magneticFieldCurl = 2.4; // STRONG SUPER-CONDUCTING SPIN LOCK
        newConf.darkEnergyExpansion = 0.0;
        newConf.timeDilationScale = 0.2; // EXTREME COSMIC SLOW TIME DILATION
        newConf.blackHoleFactor = 0.0;
        newConf.centrifugalVortex = 0.0;
        newConf.antiMatterShield = 1.5; // High repel
        newConf.newtonianGConstant = 0.0;
        newConf.planckConstantScale = 0.1;
        newConf.subSteps = 2;
        break;
      case 'default':
        newConf.gravityYMod = 1.0;
        newConf.gravityXMod = 0.0;
        newConf.restitutionMod = 1.0;
        newConf.frictionMod = 1.0;
        newConf.fluidViscosityMod = 1.0;
        newConf.fluidBuoyancyMod = 1.0;
        newConf.collisionImpulseMod = 1.0;
        newConf.quantumVibrationsMod = 0.0;
        newConf.atmosphereDensityMod = 1.0;
        newConf.gravitationalWaveAmplitude = 0.0;
        newConf.gravitationalWaveFrequency = 1.0;
        newConf.thermodynamicHeat = 0.0;
        newConf.magneticFieldCurl = 0.0;
        newConf.darkEnergyExpansion = 0.0;
        newConf.timeDilationScale = 1.0;
        newConf.blackHoleFactor = 0.0;
        newConf.centrifugalVortex = 0.0;
        newConf.antiMatterShield = 0.0;
        newConf.newtonianGConstant = 1.0;
        newConf.planckConstantScale = 1.0;
        newConf.subSteps = 2;
        break;
    }
    applyParamsVal(newConf);
  };

  // Expose triggers
  useEffect(() => {
    // When a preset or scientificParamsRef changes globally, update local fields.
    const interval = setInterval(() => {
      // Sync periodically if any changes happened on level loads
      const currentParams = scientificParamsRef.current;
      if (currentParams.gravityYMod !== gravityY) applyParamsVal(currentParams);
    }, 1200);
    return () => clearInterval(interval);
  }, [gravityY]);

  return (
    <div id="quantum-scientific-lab-deck" className="bg-gradient-to-br from-[#0F172A]/90 via-[#1E293B]/95 to-[#0B0F19] border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-5 relative overflow-hidden">
      
      {/* Sci-fi top bar lasers decor */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 via-purple-500 via-rose-500 to-transparent opacity-85" />
      
      {/* Dynamic structural circuit line in background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 border border-cyan-500/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 border border-purple-500/5 rounded-full pointer-events-none" />

      {/* Main Header Row with Live Telemetry Widgets */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Atom className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" /> GLOBAL SETTINGS
            </span>
            <span className="text-[10px] bg-purple-950/40 border border-purple-800/30 text-purple-400 font-semibold font-mono rounded px-1.5 py-0.5 tracking-wider uppercase">
              ACTIVE
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
            🌍 WORLD OVERRIDES & PHYSICS CONTROLS
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Directly adjust fundamental level mechanics. Customize your playground!
          </p>
        </div>

        {/* Live numerical telemetry bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/65 p-3 rounded-xl border border-slate-800 max-w-full">
          <div className="px-2">
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Speed</span>
            <span className="font-mono text-xs font-bold text-cyan-400">{(ballSpeed * 45).toFixed(1)} px/s</span>
          </div>
          <div className="px-2 border-l border-slate-800/80">
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Energy</span>
            <span className="font-mono text-xs font-bold text-purple-400">{Math.round(kineticEnergy)} e</span>
          </div>
          <div className="px-2 border-l border-slate-800/80 w-auto">
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Chaos</span>
            <span className="font-mono text-xs font-bold text-pink-400">{quantumChaosScore.toFixed(1)}</span>
          </div>
          <div className="px-2 border-l border-slate-800/80">
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Time Warp</span>
            <span className="font-mono text-xs font-bold text-emerald-400">{dilationScale.toFixed(2)}x</span>
          </div>
        </div>

      </div>

      {/* Controller Mode Multi-Tabs */}
      <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850 text-xs font-mono">
        <button
          onClick={() => { sfx.play('button'); setActiveTab('control_deck'); }}
          className={`flex-1 py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'control_deck' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" /> Basic World Settings
        </button>
        <button
          onClick={() => { sfx.play('button'); setActiveTab('oscilloscope'); }}
          className={`flex-1 py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'oscilloscope' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Activity className="w-4 h-4 text-purple-400" /> Wave Motion Tracker
        </button>
        <button
          onClick={() => { sfx.play('button'); setActiveTab('presets'); }}
          className={`flex-1 py-2 px-3 rounded-lg font-extrabold flex items-center justify-center gap-1.5 transition uppercase tracking-wider ${
            activeTab === 'presets' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" /> Fast Setup Presets
        </button>
      </div>

      {/* Main Interactive Box Body */}
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-8 min-h-[600px] flex flex-col justify-between">
        
        {/* Tab 1: Multi-Column Granular Slider Controllers */}
        {activeTab === 'control_deck' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-300 font-mono">
            
            {/* Division A: Gravity & Pulling */}
            <div className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase block border-b border-cyan-950 pb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> Gravity & Pull Controls
              </span>
              
              {/* Gravity Y slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Up/Down Gravity</span>
                  <span className="text-cyan-400 font-bold">{gravityY.toFixed(2)}G</span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="3.5"
                  step="0.05"
                  value={gravityY}
                  onChange={(e) => setGravityYValue(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Gravity X slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Left/Right Gravity</span>
                  <span className="text-cyan-400 font-bold">{gravityX.toFixed(2)}G</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.05"
                  value={gravityX}
                  onChange={(e) => setGravityXValue(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Newtonian Constant G */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Overall Falling Speed</span>
                  <span className="text-cyan-300 font-bold">{newtonianGConstant.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="4.0"
                  step="0.05"
                  value={newtonianGConstant}
                  onChange={(e) => setNewtonianGConstantValue(Number(e.target.value))}
                  className="w-full accent-cyan-300 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Schwarzschild Singularity Pull */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-purple-300">Black Hole Suction</span>
                  <span className="text-purple-400 font-bold">{blackHoleFactor.toFixed(2)}b</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.05"
                  value={blackHoleFactor}
                  onChange={(e) => setBlackHoleFactorValue(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Division B: Wind & Water */}
            <div className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block border-b border-emerald-950 pb-1.5 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Water & Wind Controls
              </span>

              {/* Fluid viscosity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455">Water Thickness</span>
                  <span className="text-emerald-400 font-bold">{fluidViscosity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.1"
                  value={fluidViscosity}
                  onChange={(e) => setFluidViscosityValue(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Fluid buoyancy */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Water Floatiness</span>
                  <span className="text-emerald-400 font-bold">{fluidBuoyancy.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="4.0"
                  step="0.1"
                  value={fluidBuoyancy}
                  onChange={(e) => setFluidBuoyancyValue(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Atmospheric air density drag */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Air Thickness (Wind Resistance)</span>
                  <span className="text-emerald-400 font-bold">{atmosphereDensity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.5"
                  step="0.1"
                  value={atmosphereDensity}
                  onChange={(e) => setAtmosphereDensityValue(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Centrifugal Rotational Vortex */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-teal-400">Tornado Spin Power</span>
                  <span className="text-teal-400 font-bold">{centrifugalVortex.toFixed(2)}ω</span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={centrifugalVortex}
                  onChange={(e) => setCentrifugalVortexValue(Number(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Division C: Wacky Bouncing Space */}
            <div className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
              <span className="text-[10px] font-bold text-pink-400 tracking-wider uppercase block border-b border-pink-950 pb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-pink-400" /> Bouncy Spacetime Waves
              </span>

              {/* Gravitational Wave Amplitude */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455">Wave Bounciness Size</span>
                  <span className="text-pink-300 font-bold">{gravitationalWaveAmt.toFixed(2)}a</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.05"
                  value={gravitationalWaveAmt}
                  onChange={(e) => setGravitationalWaveAmtValue(Number(e.target.value))}
                  className="w-full accent-pink-300 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Gravitational Wave Frequency */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455">Wave Bounciness Speed</span>
                  <span className="text-pink-300 font-bold">{gravitationalWaveFreq.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={gravitationalWaveFreq}
                  onChange={(e) => setGravitationalWaveFreqValue(Number(e.target.value))}
                  className="w-full accent-pink-300 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Planck Constant Scale */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-pink-400">Micro-Bouncing Speed</span>
                  <span className="text-pink-400 font-bold">{planckConstantScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={planckConstantScale}
                  onChange={(e) => setPlanckConstantScaleValue(Number(e.target.value))}
                  className="w-full accent-pink-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Heisenberg quantum coordinates jitter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-450">Object Shaking / Jitter</span>
                  <span className="text-pink-400 font-bold">{quantumVibrations.toFixed(1)} px</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="8.5"
                  step="0.1"
                  value={quantumVibrations}
                  onChange={(e) => setQuantumVibrationsValue(Number(e.target.value))}
                  className="w-full accent-pink-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Division D: Atomic Collisions & Restitution Coefficients */}
            <div className="space-y-4 bg-slate-900/30 p-4.5 rounded-xl border border-slate-850/60">
              <span className="text-[10px] font-bold text-purple-400 tracking-wider uppercase block border-b border-purple-950 pb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-400" /> Cosmic Relativism & Field
              </span>

              {/* antiMatterShield repellent boundaries */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-violet-400">Anti-Matter Shield repeller</span>
                  <span className="text-violet-400 font-bold">{antiMatterShield.toFixed(2)}f</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.05"
                  value={antiMatterShield}
                  onChange={(e) => setAntiMatterShieldValue(Number(e.target.value))}
                  className="w-full accent-violet-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Kinetic Temperature Heat */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-purple-400">Thermodynamic Heat</span>
                  <span className="text-purple-400 font-bold">{thermodynamicK.toFixed(0)} K</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="120.0"
                  step="1.0"
                  value={thermodynamicK}
                  onChange={(e) => setThermodynamicKValue(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Einstein Time Dilation speed of coordinate calculation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-indigo-400">Relativistic Dilation</span>
                  <span className="text-indigo-400 font-bold">{dilationScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={dilationScale}
                  onChange={(e) => setDilationScaleValue(Number(e.target.value))}
                  className="w-full accent-indigo-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Multi-step Physics precision */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-emerald-400">Collisions Precision</span>
                  <span className="text-emerald-400 font-bold">{subSteps} sub-steps</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={subSteps}
                  onChange={(e) => setSubStepsValue(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Oscilloscope Wave Probability */}
        {activeTab === 'oscilloscope' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            <div className="lg:col-span-2 relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <canvas
                ref={canvasRef}
                width={500}
                height={220}
                className="w-full h-56 block bg-[#050810]"
              />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/85 border border-cyan-800/50 text-[9.5px] font-mono text-cyan-400">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                <span className="font-extrabold tracking-wider">SCHRÖDINGER DUALITY WAVEFORM TRACE MONITOR - COMPLETED</span>
              </div>

              {/* Equation metadata */}
              <div className="absolute top-3 right-3 text-[9.5px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/40">
                iℏ ∂/∂t Ψ(x,t) = Ĥ Ψ(x,t)
              </div>

              {/* Dynamic stats read on canvas */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[9.5px] font-mono text-slate-400 bg-slate-950/85 py-1.5 px-3 border border-slate-800/40 rounded-lg">
                <span>Primary Envelope: {(5.5 * ballSpeed).toFixed(1)} MeV</span>
                <span>De Broglie λ: {(1240 / (1.5 + ballSpeed)).toFixed(1)} pm</span>
                <span>Lorentz Magnetic Spin: {magneticCurl > 0 ? `CW | ${magneticCurl} Tesla` : magneticCurl < 0 ? `CCW | ${Math.abs(magneticCurl)} Tesla` : 'Neutral'}</span>
                <span className="text-cyan-400 font-bold">Wavelength scale: {dilationScale.toFixed(2)}τ</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-cyan-950/25 border border-cyan-800/30 rounded-xl space-y-2">
                <span className="text-11px font-extrabold text-cyan-400 block uppercase tracking-wider font-mono flex items-center gap-1">
                  <Activity className="w-4 h-4" /> Wave Probability Mechanics
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  The <span className="text-cyan-400 font-bold underline">Cyan Waveform</span> charts the particle probability distribution amplitude inside the spatial envelope. The <span className="text-pink-400 font-bold">Pink Boundary Line</span> models the De Broglie mass-to-wave conversion threshold. Speeding up the projectile increases kinetic frequency, collapsing the particle wavelength instantly!
                </p>
              </div>

              <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-xl space-y-2">
                <span className="text-11px font-extrabold text-purple-400 block uppercase tracking-wider font-mono flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Lorentz Field Interaction
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  Applying magnetic field forces introduces active circular Lorentz drift. The trace particles on the graph shift dynamically up or down mapping centrifugal deflection angles, pulling the ball sideways inside fluid coordinates.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Detailed Presets Grid */}
        {activeTab === 'presets' && (
          <div className="space-y-3.5">
            <span className="text-[10px] text-slate-500 uppercase block font-mono pl-1">Target Dimension Environmental Presets:</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              <button
                onClick={() => applyPreset('vacuum')}
                className="w-full text-left bg-slate-900/30 hover:bg-cyan-950/20 border border-slate-800 hover:border-cyan-800/40 p-3.5 rounded-xl transition cursor-pointer font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-cyan-400 block">🌌 Outer Vacuum Void</span>
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 font-bold font-mono text-cyan-400/80 rounded">0G | Vacuum</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans">0 Ambient drag, 1.0x standard bounce, 0 air friction. Sphere travels indefinitely preserving absolute momentum coordinates.</p>
              </button>

              <button
                onClick={() => applyPreset('jupiter')}
                className="w-full text-left bg-slate-900/30 hover:bg-purple-950/20 border border-slate-800 hover:border-purple-800/40 p-3.5 rounded-xl transition cursor-pointer font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-purple-400 block">🪐 Jovian High-Gravity Envelope</span>
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 font-bold font-mono text-purple-400/80 rounded">2.4G | Thick Gas</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans">2.4x intense gravitational pull, dense atmospheric air friction, and heavy fluid submersive dampening.</p>
              </button>

              <button
                onClick={() => applyPreset('hadron')}
                className="w-full text-left bg-slate-900/30 hover:bg-pink-950/20 border border-slate-800 hover:border-pink-800/40 p-3.5 rounded-xl transition cursor-pointer font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-pink-400 block">⚛️ Hadron Particle Collider</span>
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 font-bold font-mono text-pink-400/80 rounded">Elastic | Quantum</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans">Highly elastic (1.65x) collisions, extreme quantum coordinate jitter vibrations, magnetic curls, and time expansion.</p>
              </button>

              <button
                onClick={() => applyPreset('fluid_sub')}
                className="w-full text-left bg-slate-900/30 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-800/40 p-3.5 rounded-xl transition cursor-pointer font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-400 block">💧 Sub-Surface Hydro-Excavation</span>
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 font-bold font-mono text-emerald-400/80 rounded">Fluids | High-Lift</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans">Strong buoyancy lift (2.4x), thick drag coefficient (3.5x), and low impact speed reactions.</p>
              </button>

              <button
                onClick={() => applyPreset('plasma_fusion')}
                className="w-full text-left bg-slate-900/30 hover:bg-orange-950/20 border border-slate-800 hover:border-orange-850/40 p-3.5 rounded-xl transition cursor-pointer font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-orange-400 block">🔥 High-Entropy Plasma Cores</span>
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 font-bold font-mono text-orange-400/80 rounded">95K Heat | Turbulence</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans">Excited molecular gas. Massive thermodynamic kinetic vibrations (95.0K), magnetic field curls, and drift force displacements.</p>
              </button>

              <button
                onClick={() => applyPreset('zero_bose')}
                className="w-full text-left bg-slate-900/30 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-850/40 p-3.5 rounded-xl transition cursor-pointer font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-400 block">🧊 Bose-Einstein Superfluid</span>
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 font-bold font-mono text-indigo-400 rounded">0.2τ Speed | Zero-Heat</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans">0 Temperature molecules. Absolute static motion index. Lorentz magnetic spin lock enabled with massive relativistic time dilation.</p>
              </button>

            </div>
          </div>
        )}

        {/* Global Action Row and Calibration */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-850 mt-4 font-mono text-xs items-center justify-between font-mono">
          <span className="text-[10.5px] text-slate-500 max-w-sm font-sans">
            🚨 Direct-injection hardware is active. Slider adjustments bypass React render cycles to maintain 60 FPS.
          </span>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => { sfx.play('reset'); applyPreset('default'); }}
              className="flex-1 sm:flex-initial py-2 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-[10px] text-slate-350 hover:text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono border border-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-450 animate-spin-slow" /> Sync Defaults
            </button>
            
            <button
              onClick={() => { sfx.play('reset'); onInstantReset(); }}
              className="flex-1 sm:flex-initial py-2 px-5 bg-cyan-950/45 hover:bg-cyan-950/70 border border-cyan-800/40 hover:border-cyan-700/50 text-[10px] text-cyan-400 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest font-mono border border-cyan-800"
            >
              <Zap className="w-3.5 h-3.5" /> Reset Sphere
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

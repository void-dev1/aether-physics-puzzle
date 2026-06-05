/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserProgress, PhysicsBody, MultiplayerRoom as RoomType, LevelConfig, Obstacle, Vector2D } from './types';
import { CustomPhysicsEngine, vec } from './physics/engine';
import { generateLevel, getEraName } from './physics/levels';
import { PhysicsCanvas } from './components/PhysicsCanvas';
import { MainMenuScreen } from './components/MainMenuScreen';
import { sfx } from './components/AudioEngine';
import { ShopModal, SKINS_DB, TRAILS_DB } from './components/ShopModal';
import { AccountModal } from './components/AccountModal';
import { LevelSelector } from './components/LevelSelector';
import { LeaderboardBoard } from './components/LeaderboardBoard';
import { MultiplayerRoom } from './components/MultiplayerRoom';
import { ScientificLab } from './components/ScientificLab';
import { QuickStartOverlay } from './components/QuickStartOverlay';
import { MaterialSciencePanel } from './components/MaterialSciencePanel';
import { VelocityChart } from './components/VelocityChart';
import {
  Sparkles,
  Trophy,
  Coins,
  Settings,
  User,
  ShoppingBag,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Plus,
  Compass,
  ArrowRight,
  Sparkle,
  Tv,
  HelpCircle,
  Lock,
  Video,
  Zap,
  Wind,
  Shield,
  Radio,
  X
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'aether_phys_progress';

const DEFAULT_PROGRESS: UserProgress = {
  userId: 'guest_' + Math.random().toString(36).substring(2, 8),
  username: 'Guest Spherer',
  credits: 50,
  completedLevels: {},
  purchasedSkins: ['skin_default'],
  purchasedTrails: ['trail_none'],
  activeSkin: 'skin_default',
  activeTrail: 'trail_none',
  soundEnabled: true,
  levelDesignerCreated: 0
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(generateLevel(1));
  const [gameMode, setGameMode] = useState<'campaign' | 'multiplayer' | 'sandbox' | 'escape_room' | 'zero_gravity' | 'abilities_speedrun' | 'tempest_storm'>('campaign');
  const [lastCollision, setLastCollision] = useState<{ x: number, y: number, color: string, id: number } | null>(null);
  
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayTime, setReplayTime] = useState<number>(0);
  const [nextReplayLaunchIndex, setNextReplayLaunchIndex] = useState<number>(0);
  const [currentAttemptLaunches, setCurrentAttemptLaunches] = useState<{ position: Vector2D, velocity: Vector2D, time: number }[]>([]);
  const [successfulRunLaunches, setSuccessfulRunLaunches] = useState<{ position: Vector2D, velocity: Vector2D, time: number }[]>([]);
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [bestTrails, setBestTrails] = useState<Record<number, Vector2D[]>>({});
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const currentAttemptTrailRef = useRef<Vector2D[]>([]);

  // Zero gravity and abilities state
  const [zeroGravityEnabled, setZeroGravityEnabled] = useState<boolean>(false);
  const [waitingForFirstTap, setWaitingForFirstTap] = useState<boolean>(true);
  
  // Ability Cooldown Timers (in seconds, 0 means ready)
  const [dashCd, setDashCd] = useState<number>(0);
  const [brakeCd, setBrakeCd] = useState<number>(0);
  const [shieldCd, setShieldCd] = useState<number>(0);
  const [ghostCd, setGhostCd] = useState<number>(0);
  const [gravityCd, setGravityCd] = useState<number>(0);

  // Active status states
  const [shieldActive, setShieldActive] = useState<number>(0);
  const [ghostActive, setGhostActive] = useState<number>(0);

  // Daily Missions structure
  const [missions, setMissions] = useState<{ id: string; title: string; description: string; progress: number; target: number; reward: number; completed: boolean }[]>([
    { id: 'mission_fast', title: '⏱️ Super Sonic Speed', description: 'Finish a level under 10 seconds', progress: 0, target: 1, reward: 30, completed: false },
    { id: 'mission_targets', title: '🌀 Hit 3 Targets in One Go', description: 'Trigger 3 doors/buttons in a single playthrough', progress: 0, target: 3, reward: 40, completed: false },
    { id: 'mission_levels', title: '🔐 Void Explorer', description: 'Complete 3 total runs successfully', progress: 0, target: 3, reward: 50, completed: false }
  ]);

  // Active simulated bodies inside the physics canvas
  const [bodies, setBodies] = useState<PhysicsBody[]>([]);

  // Dialog / Modal Visibility States
  const [shopOpen, setShopOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Slingshot aim dragging state
  const [dragStart, setDragStart] = useState<Vector2D | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2D | null>(null);

  // Timer stopwatch states
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [levelSuccess, setLevelSuccess] = useState<boolean>(false);
  const [awardedCredits, setAwardedCredits] = useState<number>(0);
  const [starRating, setStarRating] = useState<'gold' | 'silver' | 'bronze' | 'none'>('none');

  // Multiplayer Lobbies syncing state
  const [activeRoom, setActiveRoom] = useState<RoomType | null>(null);

  // Creative Sandbox item placement settings
  const [sandboxBrush, setSandboxBrush] = useState<'none' | 'box' | 'bouncer' | 'fluid' | 'button' | 'spike' | 'attractor' | 'vortex' | 'portal'>('none');
  
  // Velocity History
  const [velocityHistory, setVelocityHistory] = useState<{ time: number; velocity: number }[]>([]);

  // Debug settings
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [showQuickStart, setShowQuickStart] = useState<boolean>(true);
  const [isThermalMenuOpen, setIsThermalMenuOpen] = useState<boolean>(false);
  const [isPhysicsMenuOpen, setIsPhysicsMenuOpen] = useState<boolean>(false);

  // Launch and Simulation speed tuning parameters (Speed-up additions)
  const [launchSensitivity, setLaunchSensitivity] = useState<number>(1.5); // Default is 1.5x (Significantly Faster!)
  const [physicsTimeScale, setPhysicsTimeScale] = useState<number>(1.0); // Default 1.0x (Original)
  const [trajectorySteps, setTrajectorySteps] = useState<number>(60); // Default 60 steps prediction

  // Performance and Graphics Tuning settings (Anti-Lag additions)
  const [glowEnabled, setGlowEnabled] = useState<boolean>(true);
  const [maxParticlesCap, setMaxParticlesCap] = useState<number>(80);
  const [instantResetEnabled, setInstantResetEnabled] = useState<boolean>(false);
  const instantResetRef = useRef(false);

  // New Physics State
  const [thermodynamicHeat, setThermodynamicHeat] = useState<number>(0.0);
  const [gravityYMod, setGravityYMod] = useState<number>(1.0);
  const [gravityXMod, setGravityXMod] = useState<number>(0.0);
  const [newtonianGConstant, setNewtonianGConstant] = useState<number>(1.0);
  const [fluidViscosityMod, setFluidViscosityMod] = useState<number>(1.0);
  const [fluidBuoyancyMod, setFluidBuoyancyMod] = useState<number>(1.0);
  const [atmosphereDensityMod, setAtmosphereDensityMod] = useState<number>(1.0);
  const [restitutionMod, setRestitutionMod] = useState<number>(1.0);
  const [frictionMod, setFrictionMod] = useState<number>(1.0);

  useEffect(() => {
    scientificParamsRef.current.thermodynamicHeat = thermodynamicHeat;
    scientificParamsRef.current.gravityYMod = gravityYMod;
    scientificParamsRef.current.gravityXMod = gravityXMod;
    scientificParamsRef.current.newtonianGConstant = newtonianGConstant;
    scientificParamsRef.current.fluidViscosityMod = fluidViscosityMod;
    scientificParamsRef.current.fluidBuoyancyMod = fluidBuoyancyMod;
    scientificParamsRef.current.atmosphereDensityMod = atmosphereDensityMod;
    scientificParamsRef.current.restitutionMod = restitutionMod;
    scientificParamsRef.current.frictionMod = frictionMod;
  }, [thermodynamicHeat, gravityYMod, gravityXMod, newtonianGConstant, fluidViscosityMod, fluidBuoyancyMod, atmosphereDensityMod, restitutionMod, frictionMod]);

  useEffect(() => {
    instantResetRef.current = instantResetEnabled;
  }, [instantResetEnabled]);

  // AI states
  const [aiHint, setAiHint] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  // Export states
  const [levelCodeMessage, setLevelCodeMessage] = useState('');
  const [importCodeValue, setImportCodeValue] = useState('');
  const [importError, setImportError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Scientific Overrides Ref for ultra-high FPS direct mutation
  const scientificParamsRef = useRef({
    gravityYMod: 1.0,
    gravityXMod: 0.0,
    restitutionMod: 1.0,
    frictionMod: 1.0,
    collisionImpulseMod: 1.0,
    fluidViscosityMod: 1.0,
    fluidBuoyancyMod: 1.0,
    atmosphereDensityMod: 1.0,
    quantumVibrationsMod: 0.0,
    gravitationalWaveAmplitude: 0.0,
    gravitationalWaveFrequency: 1.0,
    thermodynamicHeat: 0.0,
    magneticFieldCurl: 0.0,
    darkEnergyExpansion: 0.0,
    timeDilationScale: 1.0,
    // New variables:
    blackHoleFactor: 0.0,
    centrifugalVortex: 0.0,
    antiMatterShield: 0.0,
    newtonianGConstant: 1.0,
    planckConstantScale: 1.0,
    subSteps: 2,
    
    // Material Science & Object Rules
    obstacleRestitutionMod: 1.0,
    obstacleFrictionMod: 1.0,
    shatterOnExtremeTemp: false,
    objectRules: {
      'laser': { isLethal: true, disableFunction: false, restitution: 0.5, isBouncy: false },
      'spike': { isLethal: true, disableFunction: false, restitution: 0.5, isBouncy: false },
      'button': { disableFunction: false },
    } as Record<string, any>,
  });

  const [windXMod, setWindXMod] = useState<number>(1.0);
  const [windYMod, setWindYMod] = useState<number>(1.0);
  const [boundaryElasticityMod, setBoundaryElasticityMod] = useState<number | null>(null);

  // Physics engine instance stored in ref to maintain continuity across loops
  const engineRef = useRef<CustomPhysicsEngine | null>(null);

  // 1. Initial Load of Local Progress File
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        const loaded = JSON.parse(raw) as UserProgress;
        setProgress(loaded);
        sfx.setEnabled(loaded.soundEnabled);
      } catch (e) {
        console.warn('Fallback progress initialization.', e);
      }
    }
  }, []);

  // Auto-save mechanisms for Creative Sandbox every 30 seconds
  useEffect(() => {
    if (gameMode !== 'sandbox') return;
    const interval = setInterval(() => {
      localStorage.setItem('aether_phys_sandbox_save', JSON.stringify(currentLevel));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameMode, currentLevel]);

  // Sync state update to local storage
  const handleUpdateProgress = (updater: (p: UserProgress) => UserProgress) => {
    setProgress(prev => {
      const next = updater(prev);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleToggleSound = () => {
    handleUpdateProgress(prev => {
      const val = !prev.soundEnabled;
      sfx.setEnabled(val);
      sfx.play('bounce');
      return {
        ...prev,
        soundEnabled: val
      };
    });
  };

  // Special challenge modifiers level builder
  const getModifiedLevel = (baseLvl: LevelConfig, mods: string[]): LevelConfig => {
    let copy = JSON.parse(JSON.stringify(baseLvl)) as LevelConfig;
    if (mods.includes('spike_hazard')) {
      copy.interactives = [
        ...copy.interactives,
        { id: 'hazard_spike_m1', type: 'spike', position: { x: copy.goal.position.x - 75, y: copy.goal.position.y - 45 }, color: '#ec4899', isTriggered: false },
        { id: 'hazard_spike_m2', type: 'spike', position: { x: copy.goal.position.x - 80, y: copy.goal.position.y + 45 }, color: '#ec4899', isTriggered: false },
        { id: 'hazard_spike_m3', type: 'spike', position: { x: copy.goal.position.x - 130, y: copy.goal.position.y }, color: '#ec4899', isTriggered: false }
      ];
    }
    if (mods.includes('bouncy_walls')) {
      copy.obstacles.forEach(o => {
        o.restitution = 1.35; // extreme bouncy property
        o.color = '#34d399'; // style as glowing green rebound zones
      });
    }
    return copy;
  };

  // 2. Load gravity configs, reset position on state trigger
  useEffect(() => {
    const lvl = generateLevel(currentLevelId);
    const modLvl = getModifiedLevel(lvl, activeModifiers);
    setCurrentLevel(modLvl);
    initializePhysicsForLevel(modLvl);
  }, [currentLevelId, activeModifiers]);

  const initializePhysicsForLevel = (lvl: LevelConfig) => {
    setLevelSuccess(false);
    setElapsedTime(0);
    setTimerActive(true);
    setAiHint('');
    setAiError('');
    setWaitingForFirstTap(true);

    // Dynamic gravity scaling based on active modifiers
    let initialGravity = { ...lvl.gravity };
    if (activeModifiers.includes('inversion')) {
      initialGravity = vec.scale(initialGravity, -1.0);
    } else if (activeModifiers.includes('low_gravity')) {
      initialGravity = vec.scale(initialGravity, 0.25);
    }

    // Bootstrap engine instance
    const engine = new CustomPhysicsEngine(initialGravity);
    engine.isZeroGravity = zeroGravityEnabled || (gameMode as string) === 'zero_gravity' || activeModifiers.includes('low_gravity') && initialGravity.y === 0;
    engine.hasFirstLaunched = false;
    engine.setSoundHandler((type) => sfx.play(type));
    engine.setCollisionHandler((x, y, type, color) => {
      setLastCollision({ x, y, color: color || '#38bdf8', id: Date.now() + Math.random() });
    });
    engine.onResetHandled = () => {
      if (instantResetRef.current) {
        setTimeout(() => {
          initializePhysicsForLevel(lvl);
        }, 0);
      }
    };

    // Copy current scientific parameter ref values to the active engine instance
    const sp = scientificParamsRef.current;
    engine.gravityMultiplierY = sp.gravityYMod;
    engine.gravityMultiplierX = sp.gravityXMod;
    engine.restitutionMultiplier = sp.restitutionMod;
    engine.frictionMultiplier = sp.frictionMod;
    engine.fluidViscosityMultiplier = sp.fluidViscosityMod;
    engine.fluidBuoyancyMultiplier = sp.fluidBuoyancyMod;
    engine.collisionImpulseMultiplier = sp.collisionImpulseMod;
    engine.quantumVibrations = sp.quantumVibrationsMod;
    engine.atmosphereDensity = sp.atmosphereDensityMod;
    engine.gravitationalWaveAmplitude = sp.gravitationalWaveAmplitude;
    engine.gravitationalWaveFrequency = sp.gravitationalWaveFrequency;
    engine.thermodynamicHeat = sp.thermodynamicHeat;
    engine.magneticFieldCurl = sp.magneticFieldCurl;
    engine.darkEnergyExpansion = sp.darkEnergyExpansion;
    engine.timeDilationScale = sp.timeDilationScale;
    engine.blackHoleFactor = sp.blackHoleFactor;
    engine.centrifugalVortex = sp.centrifugalVortex;
    engine.antiMatterShield = sp.antiMatterShield;
    engine.newtonianGConstant = sp.newtonianGConstant;
    engine.planckConstantScale = sp.planckConstantScale;
    engine.subSteps = sp.subSteps;
    engine.obstacleRestitutionMod = sp.obstacleRestitutionMod;
    engine.obstacleFrictionMod = sp.obstacleFrictionMod;
    engine.objectRules = sp.objectRules;

    engineRef.current = engine;
    setCurrentAttemptLaunches([]);
    currentAttemptTrailRef.current = [];

    // Reset ability gauges in state
    setDashCd(0);
    setBrakeCd(0);
    setShieldCd(0);
    setGhostCd(0);
    setGravityCd(0);
    setShieldActive(0);
    setGhostActive(0);

    // Build main player launch ball body
    const activeSkinItem = SKINS_DB.find(s => s.id === progress.activeSkin);
    const pColor = activeSkinItem ? activeSkinItem.color : '#38bdf8';

    let localMass = 1.2;
    if (activeModifiers.includes('helium')) localMass = 0.35;
    else if (activeModifiers.includes('heavy')) localMass = 4.5;
    else if (activeModifiers.includes('nano_size')) localMass = 0.2;
    else if (activeModifiers.includes('titan_size')) localMass = 6.5;

    let localRestitution = 0.62;
    if (activeModifiers.includes('clay_ball')) localRestitution = 0.0;
    else if (activeModifiers.includes('bounce')) localRestitution = 0.96;

    let localFriction = 0.08;
    if (activeModifiers.includes('anti_friction')) localFriction = 0.0;
    else if (activeModifiers.includes('ice')) localFriction = 0.005;

    let localRadius = 14;
    if (activeModifiers.includes('nano_size')) localRadius = 6;
    else if (activeModifiers.includes('titan_size')) localRadius = 28;
    else if (activeModifiers.includes('helium')) localRadius = 18;

    const ball: PhysicsBody = {
      id: progress.userId,
      type: 'dynamic',
      shape: 'circle',
      position: { ...lvl.startPosition },
      velocity: vec.create(0, 0),
      acceleration: vec.create(0, 0),
      mass: localMass,
      inverseMass: 1 / localMass,
      restitution: localRestitution,
      friction: localFriction,
      radius: localRadius,
      baseRadius: localRadius,
      temperature: 20, // 20C baseline
      angle: 0,
      angularVelocity: 0,
      color: pColor,
      trail: [],
      skinId: progress.activeSkin
    };

    if (activeModifiers.includes('shield') || activeModifiers.includes('ghost_phasing')) {
      ball.shieldActiveTimer = 999999;
    }
    if (activeModifiers.includes('ghost_phasing')) {
      ball.ghostModeTimer = 999999;
    }

    engine.bodies = [ball];

    // If multiplayer mode, augment with simulated competing player spheres (bots or room synced players)
    if (gameMode === 'multiplayer' || activeRoom) {
      const rivalColors = ['#f43f5e', '#a855f7', '#fb923c'];
      const rivalNames = ['CosmicSpecter', 'VaporDrifter', 'AetherDodge'];

      rivalNames.forEach((name, idx) => {
        // Offset starting coordinates slightly
        const rivalBall: PhysicsBody = {
          id: `rival_${idx}`,
          type: 'dynamic',
          shape: 'circle',
          position: { x: lvl.startPosition.x, y: lvl.startPosition.y + (idx + 1) * 8 },
          velocity: vec.create(0, 0),
          acceleration: vec.create(0, 0),
          mass: 1.2,
          inverseMass: 1 / 1.2,
          restitution: 0.6,
          friction: 0.05,
          radius: 13,
          baseRadius: 13,
          temperature: 20,
          angle: 0,
          angularVelocity: 0,
          color: rivalColors[idx],
          trail: []
        };
        engine.bodies.push(rivalBall);
      });
    }

    setBodies([...engine.bodies]);
  };

  // 3. Precise 60fps RequestAnimationFrame physics polling cycle
  useEffect(() => {
    let animId: number;
    let prevTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - prevTime) / 1000;
      prevTime = now;

       // Tick ability cooldown offsets in real-time
       const cdDiff = activeModifiers.includes('infinite_brakes') ? dt * 30 : dt;
       setDashCd(prev => Math.max(0, prev - cdDiff));
       setBrakeCd(prev => Math.max(0, prev - cdDiff));
       setShieldCd(prev => Math.max(0, prev - dt));
       setGhostCd(prev => Math.max(0, prev - dt));
       setGravityCd(prev => Math.max(0, prev - dt));

      setShieldActive(prev => Math.max(0, prev - dt));
      setGhostActive(prev => Math.max(0, prev - dt));

      // Advance game timer if active
      if (timerActive && !levelSuccess && !isReplaying) {
        setElapsedTime(prev => prev + dt);
      }

      // Check and update Replay launch vectors triggers
      if (isReplaying) {
        setReplayTime(prev => {
          const nextTime = prev + dt; // dt is absolute elapsed real-world time step inside loop
          
          if (nextReplayLaunchIndex < successfulRunLaunches.length) {
            const nextL = successfulRunLaunches[nextReplayLaunchIndex];
            if (nextTime >= nextL.time) {
              if (engineRef.current) {
                const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
                if (mainBall) {
                  // Synchronize ball coordinate and impulse
                  mainBall.position = { ...nextL.position };
                  mainBall.velocity = { ...nextL.velocity };
                  sfx.play('bounce');
                  setLastCollision({
                    x: nextL.position.x,
                    y: nextL.position.y,
                    color: '#facc15', // Gold particle explosion on virtual triggers!
                    id: Date.now() + Math.random()
                  });
                }
              }
              setNextReplayLaunchIndex(prevIdx => prevIdx + 1);
            }
          }
          return nextTime;
        });
      }

      if (engineRef.current && (!levelSuccess || isReplaying)) {
        // Set dynamic live scientific overrides before step tick execution
        const sp = scientificParamsRef.current;
        engineRef.current.gravityMultiplierY = sp.gravityYMod;
        engineRef.current.gravityMultiplierX = sp.gravityXMod;
        engineRef.current.restitutionMultiplier = sp.restitutionMod;
        engineRef.current.frictionMultiplier = sp.frictionMod;
        engineRef.current.fluidViscosityMultiplier = sp.fluidViscosityMod;
        engineRef.current.fluidBuoyancyMultiplier = sp.fluidBuoyancyMod;
        engineRef.current.collisionImpulseMultiplier = sp.collisionImpulseMod;
        engineRef.current.windMultiplierX = windXMod;
        engineRef.current.windMultiplierY = windYMod;
        engineRef.current.boundaryElasticity = boundaryElasticityMod;
        engineRef.current.quantumVibrations = sp.quantumVibrationsMod;
        engineRef.current.atmosphereDensity = sp.atmosphereDensityMod;

        // Custom live advanced variables sync
        engineRef.current.gravitationalWaveAmplitude = sp.gravitationalWaveAmplitude;
        engineRef.current.gravitationalWaveFrequency = sp.gravitationalWaveFrequency;
        engineRef.current.thermodynamicHeat = sp.thermodynamicHeat;
        engineRef.current.magneticFieldCurl = sp.magneticFieldCurl;
        engineRef.current.darkEnergyExpansion = sp.darkEnergyExpansion;
        engineRef.current.timeDilationScale = sp.timeDilationScale;

        // Extra scientific settings sync
        engineRef.current.blackHoleFactor = sp.blackHoleFactor;
        engineRef.current.centrifugalVortex = sp.centrifugalVortex;
        engineRef.current.antiMatterShield = sp.antiMatterShield;
        engineRef.current.newtonianGConstant = sp.newtonianGConstant;
        engineRef.current.planckConstantScale = sp.planckConstantScale;
        engineRef.current.subSteps = sp.subSteps;
        engineRef.current.obstacleRestitutionMod = sp.obstacleRestitutionMod;
        engineRef.current.obstacleFrictionMod = sp.obstacleFrictionMod;
        engineRef.current.objectRules = sp.objectRules;

        // Run with slow-mo timescale 0.4x if in replaying mode, or 0.45x if slowmo is active, combined with the live Dilation Warp slider!
        const scaleStep = (isReplaying ? 0.4 : (activeModifiers.includes('slowmo') ? physicsTimeScale * 0.45 : physicsTimeScale)) * sp.timeDilationScale;
        
        // Dynamically inject active physical modifiers forces/behaviors to the ball
        const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
        if (mainBall && engineRef.current.hasFirstLaunched) {
          if (activeModifiers.includes('cosmic_storm')) {
            const stormForce = Math.sin(performance.now() / 250) * 0.28;
            mainBall.velocity = vec.add(mainBall.velocity, vec.create(stormForce, 0.04));
          }
          if (activeModifiers.includes('goal_attractor')) {
            const goalPos = currentLevel.goal.position;
            const delta = vec.sub(goalPos, mainBall.position);
            const distance = vec.len(delta);
            if (distance > 12) {
              const pullDir = vec.norm(delta);
              mainBall.velocity = vec.add(mainBall.velocity, vec.scale(pullDir, 0.16));
            }
          }
          if (activeModifiers.includes('vortex_axis')) {
            currentLevel.obstacles.forEach(obs => {
              const delta = vec.sub(obs.position, mainBall.position);
              const distance = vec.len(delta);
              if (distance < 240 && distance > 5) {
                const pullDir = vec.norm(delta);
                const pullStrength = 0.15 * (1 - distance / 240);
                mainBall.velocity = vec.add(mainBall.velocity, vec.scale(pullDir, pullStrength));
              }
            });
          }
          if (activeModifiers.includes('quantum_jitter')) {
            if (Math.random() < 0.06) {
              mainBall.position.x += (Math.random() - 0.5) * 8;
              mainBall.position.y += (Math.random() - 0.5) * 8;
            }
          }
        }

        engineRef.current.update(dt * scaleStep, currentLevel, (winningBodyId) => {
          if (winningBodyId === progress.userId) {
            if (isReplaying) {
              // Slow-motion successful replay finished!
              setIsReplaying(false);
              setLevelSuccess(true);
              setPhysicsTimeScale(1.0);
              sfx.play('goal');
            } else {
              handleStageSuccess();
            }
          } else {
            if (!isReplaying) {
              setLevelSuccess(true);
              setTimerActive(false);
              sfx.play('reset');
              alert('A rival sphere reached the Void Gate first! Keep practicing your vector speed angles.');
            }
          }
        });

        // Track velocity history for recharts
        const historyBall = engineRef.current.bodies.find(b => b.id === progress.userId);
        if (historyBall) {
          const vel = vec.len(historyBall.velocity);
          setVelocityHistory(prev => {
            const newHistory = [...prev, { time: elapsedTime, velocity: vel }];
            // Keep only last 5 seconds
            return newHistory.filter(h => elapsedTime - h.time < 5);
          });
        }

        // Copy positions to trigger React graphics re-render
        setBodies([...engineRef.current.bodies]);

        if (timerActive && !levelSuccess && !isReplaying) {
          const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
          if (mainBall && engineRef.current.hasFirstLaunched) {
            currentAttemptTrailRef.current.push({ x: mainBall.position.x, y: mainBall.position.y });
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentLevel, timerActive, levelSuccess, physicsTimeScale, isReplaying, nextReplayLaunchIndex, successfulRunLaunches]);

  const handleStageSuccess = () => {
    setLevelSuccess(true);
    setTimerActive(false);

    // Vibration feedback on level completion
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Save successful run's input vectors sequence for playback
    setSuccessfulRunLaunches([...currentAttemptLaunches]);

    // Save successful run's coordinates trail for ghost visualizing
    setBestTrails(prev => ({
      ...prev,
      [currentLevelId]: [...currentAttemptTrailRef.current]
    }));

    // Compute star rankings against targets
    let stars: 'gold' | 'silver' | 'bronze' = 'bronze';
    let baseAward = 20;

    if (elapsedTime <= currentLevel.goldTime) {
      stars = 'gold';
      baseAward = 60;
    } else if (elapsedTime <= currentLevel.silverTime) {
      stars = 'silver';
      baseAward = 35;
    }

    setAwardedCredits(baseAward);
    setStarRating(stars);

    // Daily Missions progress checkers
    const triggeredCount = currentLevel.interactives.filter(i => i.isTriggered).length;
    let bonusAward = 0;
    
    setMissions(prevMissions => {
      return prevMissions.map(m => {
        if (m.completed) return m;

        let nextProg = m.progress;
        if (m.id === 'mission_fast') {
          if (elapsedTime <= 10.0) nextProg = 1;
        } else if (m.id === 'mission_targets') {
          nextProg = Math.max(m.progress, triggeredCount);
        } else if (m.id === 'mission_levels') {
          nextProg += 1;
        }

        const isNowCompleted = nextProg >= m.target;
        if (isNowCompleted) {
          bonusAward += m.reward;
        }

        return {
          ...m,
          progress: nextProg,
          completed: isNowCompleted
        };
      });
    });

    // Persist completion state
    handleUpdateProgress(prev => {
      const record = prev.completedLevels[currentLevelId];
      const best = record ? Math.min(record.bestTime, elapsedTime) : elapsedTime;
      return {
        ...prev,
        credits: prev.credits + baseAward + bonusAward,
        completedLevels: {
          ...prev.completedLevels,
          [currentLevelId]: { completed: true, bestTime: best }
        }
      };
    });
  };

  const handleStartReplay = () => {
    if (successfulRunLaunches.length === 0) {
      alert('Launch your ball to reach the Void Gate first so you can play back the recorded inputs!');
      return;
    }
    sfx.play('portal');
    setIsReplaying(true);
    setReplayTime(0);
    setNextReplayLaunchIndex(0);
    setLevelSuccess(false);
    setTimerActive(false);
    
    // Reset simulation
    initializePhysicsForLevel(currentLevel);
  };

  const handleStopReplay = () => {
    setIsReplaying(false);
    setPhysicsTimeScale(1.0);
    setLevelSuccess(true);
    initializePhysicsForLevel(currentLevel);
  };

  // Keyboard controls hotkeys and special abilities [Esc, R, W, A, S, D, Q, E, Space]
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // Avoid key triggers if typing in chat or other custom forms
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Level reset hotkey
      if (key === 'r') {
        sfx.play('reset');
        initializePhysicsForLevel(currentLevel);
        return;
      }

      // Check if we have active level running
      if (levelSuccess || isReplaying) return;

      // Restrict power-ups / abilities actions when no_abilities modifier is selected
      if (activeModifiers.includes('no_abilities')) {
        const actionKeys = ['w', 's', 'e', 'q', ' ', 'shift', 'arrowup', 'arrowdown'];
        if (actionKeys.includes(key)) {
          sfx.play('reset');
          return;
        }
      }

      // 1. Dash Ability (W or ArrowUp)
      if (key === 'w' || e.key === 'ArrowUp') {
        if (dashCd > 0) return;
        if (engineRef.current) {
          const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
          if (mainBall) {
            e.preventDefault();
            setWaitingForFirstTap(false);
            engineRef.current.hasFirstLaunched = true; // Any key triggers first launch!
            setDashCd(activeModifiers.includes('hyper_dash') ? 0.35 : 3.0);
            sfx.play('portal');
            const speedNow = vec.len(mainBall.velocity);
            const dir = speedNow > 0.2 ? vec.norm(mainBall.velocity) : vec.create(0, -1);
            // Apply heavy pulse thrust
            mainBall.velocity = vec.add(mainBall.velocity, vec.scale(dir, 14));
            
            // Spawn blue shockwave pulse coordinate
            setLastCollision({
              x: mainBall.position.x,
              y: mainBall.position.y,
              color: '#38bdf8',
              id: Date.now() + Math.random()
            });
          }
        }
      }

      // 2. Emergency Brake (S or ArrowDown)
      if (key === 's' || e.key === 'ArrowDown') {
        if (brakeCd > 0) return;
        if (engineRef.current) {
          const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
          if (mainBall) {
            e.preventDefault();
            setWaitingForFirstTap(false);
            engineRef.current.hasFirstLaunched = true;
            setBrakeCd(2.5);
            sfx.play('bounce');
            mainBall.velocity = vec.create(0, 0);
            mainBall.acceleration = vec.create(0, 0);
            
            // Spawn crystal explosion particles
            setLastCollision({
              x: mainBall.position.x,
              y: mainBall.position.y,
              color: '#fbbf24',
              id: Date.now() + Math.random()
            });
          }
        }
      }

      // 3. Deflector Force Shield (E)
      if (key === 'e') {
        if (shieldCd > 0) return;
        if (engineRef.current) {
          const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
          if (mainBall) {
            e.preventDefault();
            setWaitingForFirstTap(false);
            setShieldCd(5.0);
            setShieldActive(1.5);
            sfx.play('button');
            mainBall.shieldActiveTimer = 1.5;

            setLastCollision({
              x: mainBall.position.x,
              y: mainBall.position.y,
              color: '#a78bfa',
              id: Date.now() + Math.random()
            });
          }
        }
      }

      // 4. Ghost Phase Shift (Q)
      if (key === 'q') {
        if (ghostCd > 0) return;
        if (engineRef.current) {
          const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
          if (mainBall) {
            e.preventDefault();
            setWaitingForFirstTap(false);
            setGhostCd(6.0);
            setGhostActive(1.2);
            sfx.play('portal');
            mainBall.ghostModeTimer = 1.2;

            setLastCollision({
              x: mainBall.position.x,
              y: mainBall.position.y,
              color: '#34d399',
              id: Date.now() + Math.random()
            });
          }
        }
      }

      // 5. Gravity Flip Swap (Space or Shift)
      if (e.key === ' ' || e.key === 'Shift') {
        if (gravityCd > 0) return;
        if (engineRef.current) {
          const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
          if (mainBall) {
            e.preventDefault();
            setWaitingForFirstTap(false);
            engineRef.current.hasFirstLaunched = true;
            setGravityCd(4.0);
            sfx.play('bounce');
            
            // Trigger reversing inverter
            mainBall.gravityInverterTimer = 5.0;

            setLastCollision({
              x: mainBall.position.x,
              y: mainBall.position.y,
              color: '#f87171',
              id: Date.now() + Math.random()
            });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [currentLevel, progress.userId, levelSuccess, isReplaying, dashCd, brakeCd, shieldCd, ghostCd, gravityCd]);

  // Aim launching operations
  const handleStageLaunchInitiated = (clickPos: Vector2D) => {
    // Slingshot aims start dragging from the ball's coordinate
    const mainBall = bodies.find(b => b.id === progress.userId);
    if (!mainBall) return;

    setDragStart({ ...mainBall.position });
    if (clickPos && (clickPos.x !== 0 || clickPos.y !== 0)) {
      setDragCurrent({ x: clickPos.x, y: clickPos.y });
    } else {
      setDragCurrent({ ...mainBall.position });
    }
  };

  // Mouse drag moving aiming
  const handleMouseMoveWorld = (e: React.MouseEvent) => {
    if (!dragStart) return;
    const canvas = document.getElementById('physics-main-stage') as HTMLCanvasElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setDragCurrent({ x, y });
  };

  // Touch drag moving aiming
  const handleTouchMoveWorld = (e: React.TouchEvent) => {
    if (!dragStart) return;
    if (e.touches.length === 0) return;
    const canvas = document.getElementById('physics-main-stage') as HTMLCanvasElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    setDragCurrent({ x, y });
  };

  // Mouse release firing ball projectile
  const handleMouseUpWorld = () => {
    if (!dragStart || !dragCurrent) return;

    const pullVec = vec.sub(dragStart, dragCurrent);
    // Magnify vector force for satisfying speed impact - scaled by user settings
    let launchForce = vec.scale(pullVec, 0.08 * launchSensitivity);
    if (activeModifiers.includes('reverse_vector')) {
      // Pull acts as attraction booster rather than linear repeller slingshot!
      launchForce = vec.scale(launchForce, -1.0);
    }

    // Apply linear acceleration vector to player ball
    if (engineRef.current) {
      engineRef.current.hasFirstLaunched = true;
      setWaitingForFirstTap(false);
      const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
      if (mainBall) {
        mainBall.velocity = launchForce;
        sfx.play('bounce');

        // Record launch vector events for Replay feature
        if (!isReplaying) {
          setCurrentAttemptLaunches(prev => [
            ...prev,
            {
              position: { ...mainBall.position },
              velocity: { ...launchForce },
              time: elapsedTime
            }
          ]);
        }
      }
    }

    // Reset Aim Indicators vectors
    setDragStart(null);
    setDragCurrent(null);
  };

  // Load next consecutive level
  const handleNextLevel = () => {
    if (currentLevelId < 500) {
      setCurrentLevelId(prev => prev + 1);
    } else {
      alert('You have fully conquered all 500 Absolute Infinity stages! You are now a Grandmaster of Physics.');
    }
  };

  // Creator sandbox placement clicks
  const handleCanvasSandboxStamp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameMode !== 'sandbox' || sandboxBrush === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create obstacle structures based on selected visual stamp
    sfx.play('button');
    const template: LevelConfig = { ...currentLevel };
    
    // Ensure lists are initialized
    if (!template.obstacles) template.obstacles = [];
    if (!template.fluids) template.fluids = [];
    if (!template.interactives) template.interactives = [];
    if (!template.gravityFields) template.gravityFields = [];
    if (!template.portals) template.portals = [];

    if (sandboxBrush === 'box') {
      template.obstacles.push({
        id: `sandbox_${Date.now()}`,
        shape: 'box',
        position: vec.create(x, y),
        width: 100,
        height: 25,
        angle: 0,
        color: '#475569'
      });
    } else if (sandboxBrush === 'bouncer') {
      template.obstacles.push({
        id: `sandbox_${Date.now()}`,
        shape: 'circle',
        position: vec.create(x, y),
        radius: 35,
        angle: 0,
        color: '#22c55e',
        restitution: 0.95
      });
    } else if (sandboxBrush === 'fluid') {
      template.fluids.push({
        id: `sandbox_${Date.now()}`,
        x: x - 60,
        y: y - 40,
        width: 120,
        height: 80,
        density: 1.3,
        dragCoefficient: 0.03,
        color: 'rgba(14, 165, 233, 0.35)'
      });
    } else if (sandboxBrush === 'button') {
      const gateId = `gate_${Date.now()}`;
      // Add pressure door
      template.obstacles.push({
        id: gateId,
        shape: 'box',
        position: vec.create(x + 80, y),
        width: 20,
        height: 100,
        angle: 0,
        color: '#f43f5e'
      });
      // Add pressure button linked to door
      template.interactives.push({
        id: `btn_${Date.now()}`,
        type: 'button',
        position: vec.create(x, y),
        color: '#f43f5e',
        isTriggered: false,
        targetId: gateId
      });
    } else if (sandboxBrush === 'spike') {
      template.interactives.push({
        id: `spike_${Date.now()}`,
        type: 'spike',
        position: vec.create(x, y),
        color: '#ef4444',
        isTriggered: false
      });
    } else if (sandboxBrush === 'attractor') {
      template.gravityFields.push({
        id: `attractor_${Date.now()}`,
        position: vec.create(x, y),
        radius: 175,
        strength: -5.0,
        type: 'radial',
        color: 'rgba(168, 85, 247, 0.45)'
      });
    } else if (sandboxBrush === 'vortex') {
      template.gravityFields.push({
        id: `vortex_${Date.now()}`,
        position: vec.create(x, y),
        radius: 150,
        strength: -7.0,
        type: 'vortex',
        color: 'rgba(236, 72, 153, 0.4)'
      });
    } else if (sandboxBrush === 'portal') {
      const portalId = `portal_${Date.now()}`;
      template.portals.push({
        id: portalId,
        posA: vec.create(Math.max(40, x - 100), y),
        posB: vec.create(Math.min(960, x + 100), y),
        radius: 28,
        color: '#06b6d4',
        angleA: 0,
        angleB: Math.PI
      });
    }

    setCurrentLevel(template);
  };

  const handleClearSandbox = () => {
    sfx.play('reset');
    // Revert sandbox elements to a blank stage configuration
    const blank: LevelConfig = {
      id: 999,
      name: 'Creative Sandbox Arena',
      theme: '🛠️ Sandbox Creator',
      gravity: { x: 0, y: 0.28 },
      wind: { x: 0, y: 0 },
      startPosition: { x: 100, y: 150 },
      goal: { position: { x: 900, y: 500 }, radius: 32, color: 'rgba(234, 179, 8, 0.4)' },
      obstacles: [],
      portals: [],
      gravityFields: [],
      fluids: [],
      forceZones: [],
      interactives: [],
      goldTime: 10,
      silverTime: 20,
      bronzeTime: 35
    };
    setCurrentLevel(blank);
    initializePhysicsForLevel(blank);
  };

  const handleLoadSandbox = () => {
    const saved = localStorage.getItem('aether_phys_sandbox_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LevelConfig;
        setCurrentLevel(parsed);
        initializePhysicsForLevel(parsed);
        return true;
      } catch (e) {
        console.error('Failed to load sandbox save', e);
      }
    }
    return false;
  };

  // Export active sandbox level configuration as a base64 string
  const handleExportLevelCode = () => {
    try {
      const codeData = {
        obstacles: currentLevel.obstacles,
        fluids: currentLevel.fluids,
        forceZones: currentLevel.forceZones,
        interactives: currentLevel.interactives,
        gravityFields: currentLevel.gravityFields,
        portals: currentLevel.portals,
        goal: currentLevel.goal,
        startPosition: currentLevel.startPosition
      };
      const codeString = btoa(JSON.stringify(codeData));
      navigator.clipboard.writeText(codeString);
      setLevelCodeMessage('Level code copied to clipboard!');
      sfx.play('button');
      setTimeout(() => setLevelCodeMessage(''), 4005);
    } catch (e) {
      setLevelCodeMessage('Failed to generate level code.');
    }
  };

  // Import custom sandbox level from a base64 string
  const handleImportLevelCode = () => {
    try {
      setImportError('');
      if (!importCodeValue.trim()) return;
      const decodedString = atob(importCodeValue.trim());
      const parsed = JSON.parse(decodedString);

      const loadedLevel: LevelConfig = {
        id: 999,
        name: 'Shared Space Arena',
        theme: '🛠️ Sandbox Creator',
        gravity: currentLevel.gravity,
        wind: currentLevel.wind,
        startPosition: parsed.startPosition || { x: 100, y: 150 },
        goal: parsed.goal || { position: { x: 900, y: 500 }, radius: 32, color: 'rgba(234, 179, 8, 0.4)' },
        obstacles: parsed.obstacles || [],
        portals: parsed.portals || [],
        gravityFields: parsed.gravityFields || [],
        fluids: parsed.fluids || [],
        forceZones: parsed.forceZones || [],
        interactives: parsed.interactives || [],
        goldTime: 10,
        silverTime: 20,
        bronzeTime: 35
      };

      setCurrentLevel(loadedLevel);
      initializePhysicsForLevel(loadedLevel);
      sfx.play('portal');
      setImportCodeValue('');
      setLevelCodeMessage('Level imported successfully!');
      setTimeout(() => setLevelCodeMessage(''), 4005);
    } catch (err) {
      setImportError('Invalid level code syntax.');
    }
  };

  if (showMenu) {
    return (
      <MainMenuScreen
        progress={progress}
        onSelectMode={(mode) => {
          sfx.play('portal');
          setGameMode(mode);
          setShowMenu(false);
          if (mode === 'sandbox') {
            const loaded = handleLoadSandbox();
            if (!loaded) {
              handleClearSandbox();
            }
          } else if (mode === 'escape_room') {
            setCurrentLevelId(1001);
            initializePhysicsForLevel(generateLevel(1001));
          } else if (mode === 'zero_gravity') {
            setCurrentLevelId(2001);
            initializePhysicsForLevel(generateLevel(2001));
          } else if (mode === 'tempest_storm') {
            setCurrentLevelId(3001);
            initializePhysicsForLevel(generateLevel(3001));
          } else {
            setCurrentLevelId(1);
            initializePhysicsForLevel(generateLevel(1));
          }
        }}
        onStartChaos={() => {
          sfx.play('portal');
          setGameMode('campaign');
          setCurrentLevelId(9999);
          setShowMenu(false);
          initializePhysicsForLevel(generateLevel(9999));
        }}
      />
    );
  }

  return (
    <div
      onMouseMove={handleMouseMoveWorld}
      onMouseUp={handleMouseUpWorld}
      onTouchMove={handleTouchMoveWorld}
      onTouchEnd={handleMouseUpWorld}
      className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col font-sans select-none overflow-x-hidden selection:bg-indigo-500/30"
    >
      
      {/* Sleek Theme Top Header Bar */}
      <header className="h-16 bg-[#1E293B] border-b border-slate-700 flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-40 shadow-[0_4px_25px_rgba(15,23,42,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] transition hover:scale-105 duration-200">
            <Sparkle className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Aether Physics
            </span>
            <p className="text-[10px] text-indigo-400 font-mono font-medium tracking-wider uppercase">2D Physics Grid &amp; Puzzles</p>
          </div>
        </div>

        {/* Global Progress Metrics and Sleek Tools */}
        <div className="flex items-center gap-4">
          
          <button
            onClick={() => {
              sfx.play('portal');
              setShowMenu(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition duration-200 border border-slate-700 shadow-sm"
          >
            🏠 Main Menu
          </button>
          
          {/* Credits pills matching design */}
          <div className="hidden sm:flex gap-3">
            <div className="bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
              <div className="w-3.5 h-3.5 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]"></div>
              <span className="text-xs font-semibold font-mono text-amber-400">{progress.credits}</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-700 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            {/* Sound Synthesizer toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 bg-slate-800/65 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-white rounded-xl transition duration-200"
              title="Toggle sound synthesizer"
            >
              {progress.soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => { sfx.play('button'); setSettingsOpen(true); }}
              className="p-2 bg-slate-800/65 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white rounded-xl transition duration-200"
              title="Show performance & gameplay settings"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Aesthetics Shop Trigger */}
            <button
              onClick={() => { sfx.play('button'); setShopOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold rounded-xl transition duration-200 shadow-[0_4px_15px_rgba(79,70,229,0.35)] hover:scale-[1.02]"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Shop
            </button>

            {/* Account authentication login */}
            <button
              onClick={() => { sfx.play('button'); setAccountOpen(true); }}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/65 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium rounded-xl transition duration-200"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" /> {progress.email ? progress.username : 'Cloud Sync'}
            </button>
          </div>

        </div>
      </header>

      {/* Main Campaign/Designer Arena Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Game Mode Selector Tabs */}
        <div className="flex items-center justify-between gap-4 bg-[#1E293B]/70 border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
          <div className="flex gap-1.5">
            <button
              onClick={() => { sfx.play('button'); setGameMode('campaign'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'campaign'
                  ? 'bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Campaign (500 Levels)
            </button>
            <button
              onClick={() => {
                sfx.play('portal');
                setGameMode('zero_gravity');
                setZeroGravityEnabled(true);
                setCurrentLevelId(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'zero_gravity'
                  ? 'bg-purple-600 text-white shadow-[0_4px_15px_rgba(147,51,234,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-purple-900/10'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5 text-purple-300 animate-spin animate-duration-3000" /> Zero-G Space
            </button>
            <button
              onClick={() => {
                sfx.play('portal');
                setGameMode('abilities_speedrun');
                setZeroGravityEnabled(false);
                setCurrentLevelId(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'abilities_speedrun'
                  ? 'bg-amber-600 text-white shadow-[0_4px_15px_rgba(217,119,6,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-amber-900/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Key Speedrun
            </button>
            <button
              onClick={() => {
                sfx.play('portal');
                setGameMode('multiplayer');
                // Force simulation restart with multiplayer rivals
                setCurrentLevelId(prev => prev);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'multiplayer'
                  ? 'bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> PvP / Co-op Lobbies
            </button>
            <button
              onClick={() => {
                sfx.play('portal');
                setGameMode('escape_room');
                setCurrentLevelId(1001);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'escape_room'
                  ? 'bg-emerald-605 bg-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Escape Rooms (3 Stages)
            </button>
            <button
              onClick={() => {
                sfx.play('portal');
                setGameMode('zero_gravity');
                setCurrentLevelId(2001);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'zero_gravity'
                  ? 'bg-pink-600 text-white shadow-[0_4px_15px_rgba(219,39,119,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Zero-G Void (3 Stages)
            </button>
            <button
              onClick={() => {
                sfx.play('portal');
                setGameMode('tempest_storm');
                setCurrentLevelId(3001);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'tempest_storm'
                  ? 'bg-cyan-600 text-white shadow-[0_4px_15px_rgba(8,145,178,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Wind className="w-3.5 h-3.5" /> Gravity Storm (3 Stages)
            </button>
            <button
              onClick={() => {
                sfx.play('button');
                setGameMode('sandbox');
                const loaded = handleLoadSandbox();
                if (!loaded) {
                  handleClearSandbox();
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 outline-none ${
                gameMode === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Creative Sandbox
            </button>
          </div>

          <div className="pr-2 hidden sm:block">
            <span className="text-xs text-slate-400 font-mono">
              Current Mode: <b className="text-indigo-400 uppercase">{gameMode}</b>
            </span>
          </div>
        </div>

        {/* Dynamic Sandbox Designer Options Toolbar */}
        {gameMode === 'sandbox' && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">🛠️ Level Custom Sandbox Designer</span>
                <span className="text-[10.5px] text-slate-400 font-mono">Select a physical component brush and click inside the canvas stage to place objects</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleClearSandbox}
                  className="px-3.5 py-1.5 bg-red-950/30 border border-red-900/40 hover:bg-red-950 text-red-450 hover:text-red-400 text-xs font-bold rounded-xl transition"
                >
                  Reset / Clear Canvas
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSandboxBrush('box')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'box'
                    ? 'bg-slate-100 text-slate-950 border-white font-black scale-105 shadow-md shadow-white/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🧱 Platform [Box]
              </button>
              <button
                onClick={() => setSandboxBrush('bouncer')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'bouncer'
                    ? 'bg-green-600 text-white border-green-500 font-black scale-105 shadow-md shadow-green-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🟢 Bouncy Circle
              </button>
              <button
                onClick={() => setSandboxBrush('fluid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'fluid'
                    ? 'bg-sky-600 text-white border-sky-500 font-black scale-105 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                💧 Water Reservoir
              </button>
              <button
                onClick={() => setSandboxBrush('button')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'button'
                    ? 'bg-rose-600 text-white border-rose-500 font-black scale-105 shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🔑 Button &amp; Door
              </button>
              <button
                onClick={() => setSandboxBrush('spike')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'spike'
                    ? 'bg-red-600 text-white border-red-500 font-black scale-105 shadow-md shadow-red-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🔺 Spike Trap
              </button>
              <button
                onClick={() => setSandboxBrush('attractor')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'attractor'
                    ? 'bg-purple-600 text-white border-purple-500 font-black scale-105 shadow-md shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-450 border-slate-800 hover:border-slate-700'
                }`}
              >
                🌀 Gravity Blackhole
              </button>
              <button
                onClick={() => setSandboxBrush('vortex')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'vortex'
                    ? 'bg-fuchsia-600 text-white border-fuchsia-455 font-black scale-105 shadow-md shadow-fuchsia-500/20'
                    : 'bg-slate-950 text-slate-455 border-slate-800 hover:border-slate-700'
                }`}
              >
                🌪️ Gravity Vortex
              </button>
              <button
                onClick={() => setSandboxBrush('portal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  sandboxBrush === 'portal'
                    ? 'bg-cyan-600 text-white border-cyan-500 font-black scale-105 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-455 border-slate-800 hover:border-slate-700'
                }`}
              >
                🌌 Portal Pair
              </button>
            </div>

            {/* Level Exporter and Importer tools block */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportLevelCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
                >
                  📤 Copy Sandbox Level Code
                </button>
                {levelCodeMessage && (
                  <span className="text-[11.5px] font-mono text-emerald-400 animate-pulse font-bold">{levelCodeMessage}</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Paste shared level code here..."
                  value={importCodeValue}
                  onChange={(e) => setImportCodeValue(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 font-mono w-full focus:outline-none focus:border-indigo-500/85"
                />
                <button
                  onClick={handleImportLevelCode}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition flex-shrink-0"
                >
                  📥 Load Code
                </button>
                {importError && (
                  <span className="text-[10px] font-mono text-red-405 font-bold flex-shrink-0">{importError}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Multiplayer Rooms component */}
        {gameMode === 'multiplayer' && !activeRoom && (
          <MultiplayerRoom
            progress={progress}
            onJoinRoom={(rid, lid) => {
              // Simulate room setup
              const fakeRoom: RoomType = {
                roomId: rid,
                hostId: progress.userId,
                levelId: lid,
                status: 'waiting',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                players: {
                  [progress.userId]: {
                    id: progress.userId,
                    username: progress.username,
                    activeSkinId: progress.activeSkin,
                    position: { x: 100, y: 150 },
                    velocity: { x: 0, y: 0 },
                    isReady: true,
                    color: '#0ea5e9'
                  },
                  'rival_zephyr': {
                    id: 'rival_zephyr',
                    username: 'SonicDiver',
                    activeSkinId: 'skin_gold',
                    position: { x: 100, y: 150 },
                    velocity: { x: 0, y: 0 },
                    isReady: true,
                    color: '#fbbf24'
                  }
                }
              };
              setActiveRoom(fakeRoom);
              setCurrentLevelId(lid);
            }}
            onExitRoom={() => setActiveRoom(null)}
            activeRoom={activeRoom}
            onUpdateRoomState={(rid, updater) => {
              setActiveRoom(prev => prev ? updater(prev) : null);
            }}
          />
        )}

        {/* Main Canvas and Side Info Bento Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Renderer viewport */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Sleek Campaign Hero Card & Level Header */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 border border-indigo-500/20 rounded-2xl p-5 shadow-2 structure relative overflow-hidden">
              {/* Background design vector SVG */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                    ACTIVE ADVENTURE ERA: {getEraName(currentLevelId).toUpperCase()}
                  </div>
                  
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
                    {currentLevel.name} <span className="text-indigo-500 underline decoration-indigo-500/40 underline-offset-4">LEVEL {currentLevelId}</span>
                  </h2>

                  <div className="flex items-center gap-3 max-w-sm pt-1">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentLevelId / 500) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{currentLevelId}/500 LEVELS CONQUERED</span>
                  </div>
                </div>

                {/* Clock Speed Time & Control widget */}
                <div className="flex items-center gap-4 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block tracking-wider leading-none">Stopwatch</span>
                    <span className="font-mono text-lg font-bold text-indigo-450">
                      {elapsedTime.toFixed(2)}s
                    </span>
                  </div>

                  <div className="h-6 w-[1px] bg-slate-800"></div>

                  <button
                    onClick={() => { sfx.play('reset'); initializePhysicsForLevel(currentLevel); }}
                    className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-400 rounded-lg transition"
                    title="Reset simulation loop [R]"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stage success dialog */}
            {isReplaying && (
              <div className="p-4 bg-slate-900/90 border border-indigo-500/80 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Video className="w-4 h-4 animate-pulse animate-duration-1000" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs tracking-tight">Slow-Motion Replay Playback (0.4x Speed)</h5>
                    <p className="text-[10px] text-indigo-400 font-mono mt-0.5">
                      Watching launch timestamps sequence inputs... Time: {replayTime.toFixed(1)}s
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStopReplay}
                  className="px-3.5 py-1.5 bg-red-650 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition uppercase tracking-wider"
                >
                  Stop Replay
                </button>
              </div>
            )}

            {levelSuccess && !isReplaying && (
              <div className="p-5 bg-gradient-to-r from-emerald-950/40 to-slate-900/80 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-tight">Void Gate Secured! Cleared in {elapsedTime.toFixed(2)}s</h4>
                    <p className="text-xs text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Ranked {starRating.toUpperCase()} Star Time! +{awardedCredits} Credits earned
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStartReplay}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-705"
                  >
                    <Video className="w-3.5 h-3.5" /> Play Slow-Mo Replay
                  </button>
                  <button
                    onClick={handleNextLevel}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 tracking-wide uppercase"
                  >
                    Conquer Next Level <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Click-Drag aimed active Canvas viewport */}
            <div onClick={sandboxBrush !== 'none' ? handleCanvasSandboxStamp : undefined}>
              <PhysicsCanvas
                level={currentLevel}
                bodies={bodies}
                dragStart={dragStart}
                dragCurrent={dragCurrent}
                canLaunch={!levelSuccess}
                onLaunch={handleStageLaunchInitiated}
                launchScale={0.08 * launchSensitivity}
                trajectorySteps={trajectorySteps}
                lastCollision={lastCollision}
                elapsedTime={elapsedTime}
                successfulRunTrail={bestTrails[currentLevelId] || []}
                activeModifiers={activeModifiers}
                glowEnabled={glowEnabled}
                maxParticlesCap={maxParticlesCap}
                isDebugMode={isDebugMode}
              />
            </div>

            {/* Chaos Challenge Modifier Deck Panel */}
            <div id="chaos-modifier-deck" className="bg-[#1E293B]/70 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Physics Modifier Deck
                  </h4>
                  <p className="text-[10.5px] text-slate-400">Customize physical forces and ball traits for any level across campaigns &amp; sandbox modes.</p>
                </div>
                {activeModifiers.length > 0 && (
                  <button
                    onClick={() => { sfx.play('reset'); setActiveModifiers([]); }}
                    className="px-2.5 py-1 text-[10px] uppercase font-bold text-rose-450 text-rose-405 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                  >
                    Clear All ({activeModifiers.length})
                  </button>
                )}
              </div>

              {/* Grid of cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  { id: 'ice', label: 'Ice Friction', desc: 'Slick low friction (0.005)', icon: '❄️' },
                  { id: 'bounce', label: 'Bouncy Ball', desc: 'High restitution elasticity (0.96)', icon: '🥎' },
                  { id: 'helium', label: 'Helium Balloon', desc: 'Floating and light (0.35 mass)', icon: '🎈' },
                  { id: 'shield', label: 'Permanent Shield', desc: 'Protected from hazard contact damage', icon: '🛡️' },
                  { id: 'slowmo', label: 'Time Slow-Mo', desc: 'Run physics in slow motion (0.45x speed)', icon: '⏰' },
                  { id: 'heavy', label: 'Heavy Sphere', desc: 'Unstoppable momentum (4.5 mass)', icon: '🗿' },
                  { id: 'low_gravity', label: 'Low Gravity', desc: 'Gravity pull diminished by 75%', icon: '🌌' },
                  { id: 'hyper_dash', label: 'Rapid Dash', desc: 'Super fast dash recharge (0.35s)', icon: '🚀' },
                  { id: 'reverse_vector', label: 'Reverse Slingshot', desc: 'Drags ball towards mouse instead of repelling', icon: '🔄' },
                  { id: 'spike_hazard', label: 'Extra Goal Spikes', desc: 'Adds extra hazard spikes around the goal', icon: '🌶️' },
                  { id: 'inversion', label: 'Invert Gravity', desc: 'Flips directional gravity vertical pull', icon: '🔮' },
                  { id: 'cosmic_storm', label: 'Wind Current', desc: 'Swaying horizontal active wind forces', icon: '🌀' },
                  { id: 'clay_ball', label: 'Plastic Clay', desc: 'Clings to walls (0 restitution)', icon: '🧱' },
                  { id: 'nano_size', label: 'Micro Ball', desc: 'Sub-atomic tiny ball (6px width)', icon: '🔍' },
                  { id: 'titan_size', label: 'Titan Ball', desc: 'Super heavy massive ball (28px width)', icon: '☄️' },
                  { id: 'double_gravity', label: 'Super Gravity', desc: 'Increases gravity pull by 2.25x', icon: '🪐' },
                  { id: 'vortex_axis', label: 'Magnetizer', desc: 'Shelves pull the ball with raw magnetism', icon: '🧲' },
                  { id: 'bouncy_walls', label: 'Bouncy Walls', desc: 'All static walls gain extreme bounce', icon: '🧱' },
                  { id: 'anti_friction', label: 'Zero Drag', desc: 'Disables air friction resistance', icon: 'vacuum' }, // Wait, vacuum? Unicode vacuumer or emoji 🌪️ or 🌪️ is fine. Let's use 🌪️.
                  { id: 'ghost_phasing', label: 'Phaser Phase', desc: 'Pass through lasers and spikes unharmed', icon: '👻' },
                  { id: 'rainbow_trail', label: 'Rainbow Trail', desc: 'Generates rainbow trail particles', icon: '🌈' },
                  { id: 'goal_attractor', label: 'Goal Gravity', desc: 'Goal core actively pulls ball towards it', icon: '🕳️' },
                  { id: 'infinite_brakes', label: 'Zero CD Brake', desc: 'Activates instant brake triggers (0.1s cd)', icon: '🛑' },
                  { id: 'quantum_jitter', label: 'Quantum Jitter', desc: 'Aether safe random offset teleports', icon: '⚛️' }
                ].map((mod) => {
                  const isActive = activeModifiers.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        sfx.play('button');
                        setActiveModifiers(prev =>
                          prev.includes(mod.id)
                            ? prev.filter(x => x !== mod.id)
                            : [...prev, mod.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-[82px] outline-none cursor-pointer ${
                        isActive
                           ? 'bg-indigo-600/30 border-indigo-400/80 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                           : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/30 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[14px]">
                          {mod.id === 'anti_friction' ? '🌪️' : mod.icon}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
                      </div>
                      <div className="w-full">
                        <span className="text-[10.5px] font-bold text-white block truncate leading-tight">{mod.label}</span>
                        <span className="text-[9px] text-slate-450 block mt-0.5 leading-none truncate" title={mod.desc}>
                          {mod.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-8 items-stretch">
              {/* Scientific Live Laboratory panel */}
              <ScientificLab
                engineRef={engineRef}
                scientificParamsRef={scientificParamsRef}
                onInstantReset={() => initializePhysicsForLevel(currentLevel)}
                ballVelocity={(() => {
                  const ball = bodies.find(b => b.id === progress.userId);
                  return ball ? ball.velocity : { x: 0, y: 0 };
                })()}
              />

              {/* Material Science Object Adjustments panel */}
              <MaterialSciencePanel
                scientificParamsRef={scientificParamsRef}
                sfx={sfx}
              />
            </div>

            {/* Instructions Tips block */}
            <div className="p-4 bg-[#1E293B]/60 border border-slate-750 rounded-2xl flex gap-3.5 items-start shadow-lg">
              <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block uppercase tracking-wider">Slingshot Aim &amp; Launch Mechanics</span>
                <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed">
                  <b>How to play:</b> Click and pull back from the sphere inside the canvas to draw your aim slingshot vector line. Release the mouse button to propel the ball forward. Propel yourself through gravitational fields, liquids, and portals, bypassing spikes and gates, to enter the spinning yellow Goal Core. Press <b>[R]</b> to reset and retry instantly.
                </p>
              </div>
            </div>

          </div>

          {/* Right Sidebar - Rankings and level explorer */}
          <div className="space-y-6">
            
            <LeaderboardBoard
              levelId={currentLevelId}
              onSelectLevel={(id) => setCurrentLevelId(id)}
              localBestTime={progress.completedLevels[currentLevelId]?.bestTime}
            />

            {/* Simulation Telemetry Dashboard Widget */}
            <div className="bg-[#1E293B]/60 border border-slate-755 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest block">🚀 Physics Tuner & Telemetry</span>
                <span className="text-[10.5px] text-slate-450 block pb-1 border-b border-slate-800">Customize slingshot sensitivity, prediction scopes, and live vector analytics.</span>
              </div>

              {/* Dynamic Real-time HUD stats */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-850">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] text-slate-500 font-mono uppercase block">Orbital Velocity</span>
                  <span className="text-[12.5px] font-mono font-bold text-white tracking-tight">
                    {(() => {
                      const ball = bodies.find(b => b.id === progress.userId);
                      if (!ball) return '0.0 px/s';
                      const vel = Math.abs(Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2) * 50);
                      return `${vel.toFixed(1)} px/s`;
                    })()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] text-slate-500 font-mono uppercase block">G-Force Loading</span>
                  <span className="text-[12.5px] font-mono font-bold text-indigo-400 tracking-tight">
                    {(() => {
                      const ball = bodies.find(b => b.id === progress.userId);
                      if (!ball) return '0.10 G';
                      const acc = Math.abs(Math.sqrt(ball.acceleration.x ** 2 + ball.acceleration.y ** 2) * 4);
                      return `${Math.max(0.08, acc).toFixed(2)} G`;
                    })()}
                  </span>
                </div>
              </div>
              <VelocityChart data={velocityHistory} />

              {/* Slingshot sensitivity select pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-300 font-mono">Debug Visualization</span>
                  <button 
                    onClick={() => setIsDebugMode(!isDebugMode)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${isDebugMode ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {isDebugMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                <label className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                  <span>Slingshot Launch Drive</span>
                  <span className="text-indigo-400 font-bold font-mono">{launchSensitivity.toFixed(1)}x Speed</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/40 rounded-xl border border-slate-800">
                  {[
                    { label: 'Normal', val: 1.0 },
                    { label: 'Glide', val: 1.5 },
                    { label: 'Hyper', val: 2.0 },
                    { label: 'Jet', val: 2.5 }
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => { sfx.play('button'); setLaunchSensitivity(opt.val); }}
                      className={`py-1.5 px-0.5 text-[9.5px] font-bold font-mono rounded-lg transition-all ${
                        launchSensitivity === opt.val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physic cycle simulation rate multiplier pills */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                  <span>Simulation Time Scale</span>
                  <span className="text-emerald-400 font-bold font-mono">{physicsTimeScale.toFixed(1)}x Warp</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/40 rounded-xl border border-slate-800">
                  {[
                    { label: 'Cinemat', val: 0.6 },
                    { label: 'Original', val: 1.0 },
                    { label: 'Fast', val: 1.5 },
                    { label: 'Warp', val: 2.0 }
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => { sfx.play('button'); setPhysicsTimeScale(opt.val); }}
                      className={`py-1.5 px-0.5 text-[9.5px] font-bold font-mono rounded-lg transition-all ${
                        physicsTimeScale === opt.val
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trajectory projection steps selection slider */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-slate-400 font-mono">Dynamic Trajectory Path</span>
                  <span className="text-indigo-400 font-mono font-bold">{trajectorySteps} frames</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="10"
                  value={trajectorySteps}
                  onChange={(e) => { setTrajectorySteps(Number(e.target.value)); }}
                  className="w-full accent-indigo-500 bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>

              {/* Thermal Settings Menu */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <button 
                  onClick={() => setIsThermalMenuOpen(!isThermalMenuOpen)}
                  className="flex items-center justify-between w-full text-xs font-bold text-red-400 font-mono uppercase tracking-widest block"
                >
                  <span>🔥 Thermodynamic Control</span>
                  <span>{isThermalMenuOpen ? '▼' : '▲'}</span>
                </button>
                {isThermalMenuOpen && [
                    { label: 'Heat', val: thermodynamicHeat, set: setThermodynamicHeat, min: -50, max: 100, step: 5, color: 'accent-red-500' },
                    { label: 'Fluid Viscos', val: fluidViscosityMod, set: setFluidViscosityMod, min: 0, max: 5, step: 0.1, color: 'accent-sky-500' },
                    { label: 'Fluid Buoyancy', val: fluidBuoyancyMod, set: setFluidBuoyancyMod, min: 0, max: 2, step: 0.1, color: 'accent-sky-500' },
                    { label: 'Atmosphere', val: atmosphereDensityMod, set: setAtmosphereDensityMod, min: 0.1, max: 5, step: 0.1, color: 'accent-slate-400' },
                ].map(item => (
                    <div key={item.label}>
                        <div className="flex justify-between text-[10.5px]">
                            <span className="text-slate-400 font-mono">{item.label}</span>
                            <span className="text-white font-mono font-bold">{item.val.toFixed(1)}</span>
                        </div>
                        <input type="range" min={item.min} max={item.max} step={item.step} value={item.val} onChange={(e) => item.set(Number(e.target.value))} className={`w-full ${item.color} bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer`} />
                    </div>
                ))}
              </div>

              {/* Gravity Settings Menu */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <button 
                  onClick={() => setIsPhysicsMenuOpen(!isPhysicsMenuOpen)}
                  className="flex items-center justify-between w-full text-xs font-bold text-emerald-400 font-mono uppercase tracking-widest block"
                >
                  <span>🌍 Gravity & Mechanics</span>
                  <span>{isPhysicsMenuOpen ? '▼' : '▲'}</span>
                </button>
                {isPhysicsMenuOpen && [
                    { label: 'Gravity X', val: gravityXMod, set: setGravityXMod, min: -2, max: 2, step: 0.1, color: 'accent-emerald-500' },
                    { label: 'Gravity Y', val: gravityYMod, set: setGravityYMod, min: -2, max: 2, step: 0.1, color: 'accent-emerald-500' },
                    { label: 'Newtonian G', val: newtonianGConstant, set: setNewtonianGConstant, min: 0, max: 5, step: 0.1, color: 'accent-emerald-500' },
                    { label: 'Restitution', val: restitutionMod, set: setRestitutionMod, min: 0, max: 2, step: 0.1, color: 'accent-amber-500' },
                    { label: 'Friction', val: frictionMod, set: setFrictionMod, min: 0, max: 2, step: 0.1, color: 'accent-amber-500' },
                ].map(item => (
                    <div key={item.label}>
                        <div className="flex justify-between text-[10.5px]">
                            <span className="text-slate-400 font-mono">{item.label}</span>
                            <span className="text-white font-mono font-bold">{item.val.toFixed(1)}</span>
                        </div>
                        <input type="range" min={item.min} max={item.max} step={item.step} value={item.val} onChange={(e) => item.set(Number(e.target.value))} className={`w-full ${item.color} bg-slate-950 rounded-lg appearance-none h-1 cursor-pointer`} />
                    </div>
                ))}
              </div>
            </div>

            {/* Gemini AI Gravity Assistant Box */}
            <div className="bg-[#1E293B]/60 border border-slate-750 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-[0.05] pointer-events-none text-indigo-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest block">🌌 Gemini AI Gravity Consultant</span>
                <span className="text-[10.5px] text-slate-400 block pb-1 border-b border-slate-800">Stuck or seeking speedrun mastery? Get real-time trajectory consulting based on active level layout.</span>
              </div>

              {aiHint ? (
                <div className="p-3 bg-slate-950/65 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono relative">
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Assisted Telemetry Advice:</span>
                  <p className="whitespace-pre-line">{aiHint}</p>
                </div>
              ) : null}

              {aiError ? (
                <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-150 font-mono">
                  {aiError}
                </div>
              ) : null}

              <button
                disabled={loadingAi}
                onClick={async () => {
                  setLoadingAi(true);
                  setAiError('');
                  try {
                    const response = await fetch('/api/ai/hint', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        level: currentLevel,
                        playerPos: bodies.find(b => b.type === 'dynamic')?.position,
                        activeSkin: progress.activeSkin
                      })
                    });
                    const data = await response.json();
                    if (data.reply) {
                      setAiHint(data.reply);
                    } else if (data.error) {
                      setAiError(data.error);
                    } else {
                      setAiError('Unexpected response from consultant.');
                    }
                  } catch (err) {
                    setAiError('Consultation network error. Ensure dev server has restarted.');
                  } finally {
                    setLoadingAi(false);
                  }
                }}
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  loadingAi
                    ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-505 text-white font-extrabold shadow-[0_4px_12px_rgba(79,70,229,0.3)]'
                }`}
              >
                {loadingAi ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    Querying Orbital Core...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Request AI Telemetry Hint
                  </>
                )}
              </button>
            </div>

            {/* Orb Control Center & Keyboard Mechanics Panel */}
            <div className="bg-[#1E293B]/70 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest block flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" /> Orb Control Center
                </span>
                <span className="text-[10px] bg-indigo-505/10 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-semibold font-mono animate-pulse">
                  5 Systems Active
                </span>
              </div>

              {/* Zero Gravity Modifier Toggle */}
              <div className="bg-slate-950/45 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Radio className={`w-3.5 h-3.5 text-purple-400 ${zeroGravityEnabled || gameMode === 'zero_gravity' ? 'animate-pulse' : ''}`} /> Zero Gravity Mode
                    </span>
                    <p className="text-[10px] text-slate-400 leading-tight">Removes gravity forces. Stay in the air until you launch!</p>
                  </div>
                  <button
                    onClick={() => {
                      sfx.play('button');
                      if (gameMode === 'zero_gravity') {
                        alert('Zero-G Drift gamemode keeps weightless activated! To play with gravity, select the Campaign tab above.');
                        return;
                      }
                      setZeroGravityEnabled(!zeroGravityEnabled);
                      if (engineRef.current) {
                        engineRef.current.isZeroGravity = !zeroGravityEnabled;
                      }
                    }}
                    className={`w-10 h-5 p-0.5 rounded-full transition-colors duration-200 focus:outline-none flex ${
                      zeroGravityEnabled || gameMode === 'zero_gravity' ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
                {(!engineRef.current?.hasFirstLaunched) && (
                  <div className="bg-purple-950/20 border border-purple-500/20 p-2 rounded-lg text-[9.5px] font-medium text-purple-300 font-mono leading-relaxed">
                    ⚙️ <b>WAITING FOR LAUNCH</b><br/>
                    The sphere is held in place. Click and drag anywhere to launch, or press any control key to begin.
                  </div>
                )}
              </div>

              {/* Abilities Grid */}
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Special Abilities:</span>

                {/* 1. Dash */}
                <button
                  onClick={() => {
                    if (dashCd > 0) return;
                    if (engineRef.current) {
                      const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
                      if (mainBall) {
                        engineRef.current.hasFirstLaunched = true;
                        setDashCd(3.0);
                        sfx.play('portal');
                        const speedNow = vec.len(mainBall.velocity);
                        const dir = speedNow > 0.2 ? vec.norm(mainBall.velocity) : vec.create(0, -1);
                        mainBall.velocity = vec.add(mainBall.velocity, vec.scale(dir, 14));
                        setLastCollision({ x: mainBall.position.x, y: mainBall.position.y, color: '#38bdf8', id: Date.now() + Math.random() });
                      }
                    }
                  }}
                  className="w-full text-left bg-slate-950/45 border border-slate-800 p-2.5 rounded-xl space-y-2 transition duration-200 hover:border-slate-700/80 hover:bg-slate-900/40 block focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-sky-600 text-[10.5px] font-mono font-bold text-white shadow">
                        W
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-100 block">Thrust Dash Boost</span>
                        <p className="text-[9.5px] text-slate-400 leading-none">Instant momentum strike</p>
                      </div>
                    </div>
                    {dashCd > 0 ? (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{dashCd.toFixed(1)}s</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                    )}
                  </div>
                  {dashCd > 0 && (
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(dashCd / 3.0) * 100}%` }} />
                    </div>
                  )}
                </button>

                {/* 2. Micro-Brake */}
                <button
                  onClick={() => {
                    if (brakeCd > 0) return;
                    if (engineRef.current) {
                      const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
                      if (mainBall) {
                        engineRef.current.hasFirstLaunched = true;
                        setBrakeCd(2.5);
                        sfx.play('bounce');
                        mainBall.velocity = vec.create(0, 0);
                        mainBall.acceleration = vec.create(0, 0);
                        setLastCollision({ x: mainBall.position.x, y: mainBall.position.y, color: '#fbbf24', id: Date.now() + Math.random() });
                      }
                    }
                  }}
                  className="w-full text-left bg-slate-950/45 border border-slate-800 p-2.5 rounded-xl space-y-2 transition duration-200 hover:border-slate-700/80 hover:bg-slate-900/40 block focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-600 text-[10.5px] font-mono font-bold text-white shadow">
                        S
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-100 block">Emergency Brake</span>
                        <p className="text-[9.5px] text-slate-400 leading-none">Freeze velocity in place</p>
                      </div>
                    </div>
                    {brakeCd > 0 ? (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{brakeCd.toFixed(1)}s</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                    )}
                  </div>
                  {brakeCd > 0 && (
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(brakeCd / 2.5) * 100}%` }} />
                    </div>
                  )}
                </button>

                {/* 3. Force Shield */}
                <button
                  onClick={() => {
                    if (shieldCd > 0) return;
                    if (engineRef.current) {
                      const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
                      if (mainBall) {
                        setShieldCd(5.0);
                        setShieldActive(1.5);
                        sfx.play('button');
                        mainBall.shieldActiveTimer = 1.5;
                        setLastCollision({ x: mainBall.position.x, y: mainBall.position.y, color: '#a78bfa', id: Date.now() + Math.random() });
                      }
                    }
                  }}
                  className="w-full text-left bg-slate-950/45 border border-slate-800 p-2.5 rounded-xl space-y-2 transition duration-200 hover:border-slate-700/80 hover:bg-slate-900/40 block focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-purple-600 text-[10.5px] font-mono font-bold text-white shadow">
                        E
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-100 block">Force Shield</span>
                        <p className="text-[9.5px] text-slate-400 leading-none">Deflect and safe from resets</p>
                      </div>
                    </div>
                    {shieldActive > 0 ? (
                      <span className="text-[10px] text-blue-400 animate-pulse font-mono font-bold">ON ({shieldActive.toFixed(1)}s)</span>
                    ) : shieldCd > 0 ? (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{shieldCd.toFixed(1)}s</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                    )}
                  </div>
                  {shieldActive > 0 ? (
                    <div className="h-1 w-full bg-slate-850 rounded-full overflow-hidden animate-pulse">
                      <div className="h-full bg-blue-400 animate-pulse" style={{ width: `${(shieldActive / 1.5) * 100}%` }} />
                    </div>
                  ) : shieldCd > 0 ? (
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${(shieldCd / 5.0) * 100}%` }} />
                    </div>
                  ) : null}
                </button>

                {/* 4. Ghost Phase */}
                <button
                  onClick={() => {
                    if (ghostCd > 0) return;
                    if (engineRef.current) {
                      const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
                      if (mainBall) {
                        setGhostCd(6.0);
                        setGhostActive(1.2);
                        sfx.play('portal');
                        mainBall.ghostModeTimer = 1.2;
                        setLastCollision({ x: mainBall.position.x, y: mainBall.position.y, color: '#34d399', id: Date.now() + Math.random() });
                      }
                    }
                  }}
                  className="w-full text-left bg-slate-950/45 border border-slate-800 p-2.5 rounded-xl space-y-2 transition duration-200 hover:border-slate-700/80 hover:bg-slate-900/40 block focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-[10.5px] font-mono font-bold text-white shadow">
                        Q
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-100 block">Phase Shift</span>
                        <p className="text-[9.5px] text-slate-400 leading-none">Bypass spikes and lasers</p>
                      </div>
                    </div>
                    {ghostActive > 0 ? (
                      <span className="text-[10px] text-emerald-400 animate-pulse font-mono font-bold">ON ({ghostActive.toFixed(1)}s)</span>
                    ) : ghostCd > 0 ? (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{ghostCd.toFixed(1)}s</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                    )}
                  </div>
                  {ghostActive > 0 ? (
                    <div className="h-1 w-full bg-slate-850 rounded-full overflow-hidden animate-pulse">
                      <div className="h-full bg-emerald-400 animate-pulse" style={{ width: `${(ghostActive / 1.2) * 100}%` }} />
                    </div>
                  ) : ghostCd > 0 ? (
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: `${(ghostCd / 6.0) * 100}%` }} />
                    </div>
                  ) : null}
                </button>

                {/* 5. Gravity Flip */}
                <button
                  onClick={() => {
                    if (gravityCd > 0) return;
                    if (engineRef.current) {
                      const mainBall = engineRef.current.bodies.find(b => b.id === progress.userId);
                      if (mainBall) {
                        engineRef.current.hasFirstLaunched = true;
                        setGravityCd(4.0);
                        sfx.play('bounce');
                        mainBall.gravityInverterTimer = 5.0;
                        setLastCollision({ x: mainBall.position.x, y: mainBall.position.y, color: '#f87171', id: Date.now() + Math.random() });
                      }
                    }
                  }}
                  className="w-full text-left bg-slate-950/45 border border-slate-800 p-2.5 rounded-xl space-y-2 transition duration-200 hover:border-slate-700/80 hover:bg-slate-900/40 block focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center px-1.5 h-5 rounded bg-red-600 text-[9px] font-mono font-bold text-white shadow">
                        Space
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-100 block">Gravity Flip</span>
                        <p className="text-[9.5px] text-slate-400 leading-none">Reverse local gravitational pull</p>
                      </div>
                    </div>
                    {gravityCd > 0 ? (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{gravityCd.toFixed(1)}s</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                    )}
                  </div>
                  {gravityCd > 0 && (
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(gravityCd / 4.0) * 100}%` }} />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Daily Missions widgets panel */}
            <div className="bg-[#1E293B]/60 border border-slate-750 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest block">🎯 Daily Missions</span>
                <span className="text-[10px] font-mono text-slate-400 capitalize">Today</span>
              </div>
              <div className="space-y-3">
                {missions.map(m => {
                  const percent = Math.min(100, (m.progress / m.target) * 100);
                  return (
                    <div key={m.id} className="bg-slate-950/45 p-3 rounded-xl border border-slate-800 space-y-1.5 transition hover:border-slate-700/80">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">{m.title}</span>
                          <p className="text-[10.5px] text-slate-400 leading-snug">{m.description}</p>
                        </div>
                        {m.completed ? (
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            Done
                          </span>
                        ) : (
                          <span className="text-[9.5px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                            +{m.reward}c
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>Progress</span>
                          <span>{m.progress}/{m.target} ({Math.round(percent)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${m.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Cosmetics */}
            <div className="bg-[#1E293B]/60 border border-slate-750 rounded-2xl p-5 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest block border-b border-slate-750 pb-2">Active Cosmetics</span>
              <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-800">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{
                    background: SKINS_DB.find(s => s.id === progress.activeSkin)?.color || '#38bdf8',
                    boxShadow: `0 0 12px ${SKINS_DB.find(s => s.id === progress.activeSkin)?.glowColor || '#0ea5e9'}`
                  }}
                />
                <div>
                  <span className="text-[11px] font-bold text-white block">Equipped Theme Skin</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {progress.activeSkin}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Global Level Bento Explorer */}
        {gameMode === 'campaign' && (
          <LevelSelector
            progress={progress}
            currentLevelId={currentLevelId}
            onSelectLevel={(id) => setCurrentLevelId(id)}
          />
        )}

        {gameMode === 'escape_room' && (
          <div className="p-6 bg-[#121A2E]/80 border border-slate-750 rounded-2xl space-y-4 shadow-xl">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" /> Handcrafted Escape Room Rooms
              </h3>
              <p className="text-[11.5px] text-slate-400 leading-snug">
                Collect special powers (Speed Increases ⚡, Dimension Shrinking 🔍, Gravity Inverters ⇅) to solve physical puzzles and unlock pressure-sensitive heavy locked barrier gates! Escape the containment cells and secure the portal gates.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1001, 1002, 1003].map(id => {
                const isCurrent = currentLevelId === id;
                const progressRecord = progress.completedLevels[id];
                const isCleared = progressRecord?.completed;
                const bestTimeString = progressRecord?.bestTime ? `${progressRecord.bestTime.toFixed(1)}s` : 'Not Cleared';
                
                return (
                  <button
                    key={id}
                    onClick={() => {
                      sfx.play('portal');
                      setCurrentLevelId(id);
                    }}
                    className={`p-4 rounded-xl text-left border flex flex-col justify-between h-28 hover:scale-[1.01] transition-all duration-200 outline-none ${
                      isCurrent 
                        ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30' 
                        : 'bg-slate-950/35 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase font-bold">Cell {id - 1000}</span>
                        {isCleared && (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Cleared ✓</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block mt-1">
                        {id === 1001 ? 'The Pressure Cell' : id === 1002 ? 'Dimension Gate' : 'Gravity Cage'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Best Time: <b className="text-white">{bestTimeString}</b>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Cosmetics shop slide dialog */}
      <ShopModal
        progress={progress}
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        onUpdateProgress={handleUpdateProgress}
      />

      {/* Cloud Account Syncing login slide */}
      <AccountModal
        progress={progress}
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        onLoggedIn={() => {}}
        onUpdateProgress={handleUpdateProgress}
      />

      {/* Gameplay & Performance Engine Settings Menu Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-750 max-w-lg w-full rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-indigo-400 rotate-45" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Engine &amp; Performance Settings</h3>
                  <p className="text-[10px] text-slate-400">Optimize Canvas graphics &amp; gameplay accuracy.</p>
                </div>
              </div>
              <button
                onClick={() => { sfx.play('button'); setSettingsOpen(false); }}
                className="p-1 px-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-5 flex-1">
              
              {/* Option 1: Canvas Glow Shadows Toggle */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Aesthetic Shadow Glow Filter</span>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    Emits soft volumetric backlights on space hazards &amp; planets. <b>Toggle off for a 2x-3x performance boost on weaker hardware.</b>
                  </span>
                </div>
                <button
                  onClick={() => {
                    sfx.play('button');
                    setGlowEnabled(prev => !prev);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 outline-none focus:ring-1 focus:ring-indigo-455 ${
                    glowEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      glowEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Option 2: Particles Peak Count Capacity */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Maximum Particles Capacity</span>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    Caps maximum explosion sparks &amp; visual trailing dusts allowed at once on the simulation timeline.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: '30 (Eco)', val: 30 },
                    { label: '80 (Medium)', val: 80 },
                    { label: '150 (Max)', val: 150 }
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        sfx.play('button');
                        setMaxParticlesCap(opt.val);
                      }}
                      className={`py-2 text-[10px] font-bold font-mono rounded-xl border transition-all ${
                        maxParticlesCap === opt.val
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Slingshot Trajectory Length */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Orbit Prediction Line Length</span>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    Controls total forecasting steps processed in real-time when aiming with the launch slingshot.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: '30 Steps (Lag-free)', val: 30 },
                    { label: '60 Steps (Ideal)', val: 60 },
                    { label: '120 Steps (Detailed)', val: 120 }
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        sfx.play('button');
                        setTrajectorySteps(opt.val);
                      }}
                      className={`py-2 text-[10px] font-bold font-mono rounded-xl border transition-all ${
                        trajectorySteps === opt.val
                          ? 'bg-teal-600 border-teal-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 4: Instant Reset on Spike or Lava Trigger */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Immediate Spike Restart</span>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    When hitting lasers or spikes, triggers instant clean stage regeneration and cooldown clears immediately with zero delays.
                  </span>
                </div>
                <button
                  onClick={() => {
                    sfx.play('button');
                    setInstantResetEnabled(prev => !prev);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 outline-none focus:ring-1 focus:ring-indigo-455 ${
                    instantResetEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      instantResetEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

            {/* Footer Close */}
            <div className="border-t border-slate-800 pt-4 mt-6">
              <button
                onClick={() => { sfx.play('button'); setSettingsOpen(false); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all duration-150"
              >
                Apply &amp; Seal Configuration
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Small subtle layout label footer */}
      <footer className="py-8 text-center text-slate-600 border-t border-slate-900 mt-12 bg-slate-950">
        <p className="text-xs font-mono">Crafted with high performance HTML5 Canvas. Pure client-side calculations.</p>
      </footer>

    </div>
  );
}

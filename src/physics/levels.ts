/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelConfig, Obstacle, Portal, GravityField, FluidBody, ForceZone, InteractiveElement, GoalArea } from '../types';

// Seeded PRNG for deterministic level layouts
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns raw decimal 0.0 -> 1.0
  public next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns int between min (inclusive) and max (exclusive)
  public range(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min));
  }

  // Pick random element from list
  public pick<T>(arr: T[]): T {
    return arr[this.range(0, arr.length)];
  }
}

// Map level ID to an theme/era name
export function getEraName(levelId: number): string {
  if (levelId <= 50) return '🚀 Space Graviton';
  if (levelId <= 100) return '💧 Deep Sea Buoyancy';
  if (levelId <= 150) return '🌀 Portal Void';
  if (levelId <= 200) return '💨 Wind Turbine';
  if (levelId <= 250) return '🌴 Bounce Jungle';
  if (levelId <= 300) return '🌌 Celestial Axis';
  if (levelId <= 350) return '🚨 Laser Refinery';
  if (levelId <= 400) return '🧲 Magneto Mines';
  if (levelId <= 450) return '🔥 Chaos Crucible';
  return '♾️ Absolute Infinity';
}

// Seeded generator for 500+ beautiful puzzles
export function generateLevel(id: number): LevelConfig {
  if (id === 9999) {
    return generateChaosLevel(id);
  }
  if (id >= 1001 && id <= 1003) {
    return generateEscapeRoomLevel(id);
  }
  if (id >= 2001 && id <= 2003) {
    return generateZeroGravityLevel(id);
  }
  if (id >= 3001 && id <= 3003) {
    return generateGravityStormLevel(id);
  }
  const rng = new SeededRandom(id * 97.432);

  const era = getEraName(id);
  const title = `Level ${id}: ${getRandomLevelName(id, rng)}`;

  // Default parameters
  let gravity = { x: 0, y: 0.3 };
  let wind = { x: 0, y: 0 };
  let startX = 100;
  let startY = 150;
  let goalX = 900;
  let goalY = 500;

  const obstacles: Obstacle[] = [];
  const portals: Portal[] = [];
  const gravityFields: GravityField[] = [];
  const fluids: FluidBody[] = [];
  const forceZones: ForceZone[] = [];
  const interactives: InteractiveElement[] = [];

  // Theme-specific overrides
  switch (era) {
    case '🚀 Space Graviton':
      gravity = { x: 0, y: 0.05 }; // super weak orbital gravity
      wind = { x: 0, y: 0 };
      // Generate some orbital gravity wells
      for (let i = 0; i < rng.range(3, 5); i++) {
        gravityFields.push({
          id: `grav_${i}`,
          position: { x: rng.range(250, 750), y: rng.range(150, 480) },
          radius: rng.range(120, 180),
          strength: rng.next() > 0.45 ? -0.18 : 0.18, // attractor vs repeller
          type: 'radial',
          color: 'rgba(99, 102, 241, 0.28)' // Indigo glow
        });
      }
      // Celestial slingshot warp tunnel (linked portal)
      portals.push({
        id: 'space_portal_warp',
        posA: { x: rng.range(180, 280), y: rng.range(160, 420) },
        posB: { x: rng.range(720, 820), y: rng.range(160, 420) },
        radius: 24,
        color: '#6366f1',
        angleA: rng.next() * Math.PI,
        angleB: rng.next() * Math.PI
      });
      // Kinetic acceleration fields
      for (let i = 0; i < 2; i++) {
        forceZones.push({
          id: `space_accel_${i}`,
          x: rng.range(300, 600),
          y: rng.range(180, 400),
          width: 80,
          height: 140,
          force: { x: rng.next() > 0.5 ? 0.45 : -0.45, y: 0.1 },
          color: 'rgba(139, 92, 246, 0.12)'
        });
      }
      break;

    case '💧 Deep Sea Buoyancy':
      gravity = { x: 0, y: 0.38 }; // heavy outer gravity
      fluids.push({
        id: 'sea_fluid_1',
        x: rng.range(150, 250),
        y: rng.range(80, 180),
        width: rng.range(500, 650),
        height: rng.range(320, 420),
        density: 1.35, // High buoyancy pushes ball up
        dragCoefficient: 0.024,
        color: 'rgba(14, 165, 233, 0.32)' // light sky blue water
      });
      // Bubbling vertical thermal updraft force column
      forceZones.push({
        id: 'thermal_bubble_vent',
        x: rng.range(350, 550),
        y: 180,
        width: 140,
        height: 300,
        force: { x: 0, y: -0.6 }, // strong upward thrust
        color: 'rgba(56, 189, 248, 0.16)'
      });
      // Underwater spikes & hazard mines
      for (let i = 0; i < rng.range(3, 5); i++) {
        interactives.push({
          id: `spike_${i}`,
          type: 'spike',
          position: { x: rng.range(300, 750), y: rng.range(420, 560) },
          color: '#ef4444', 
          isTriggered: false
        });
      }
      // Add a scale shrinker powerup to navigate narrow marine pathways
      interactives.push({
        id: `ocean_shrink_${id}`,
        type: 'powerup_shrink',
        position: { x: rng.range(200, 400), y: rng.range(120, 260) },
        color: '#a78bfa',
        isTriggered: false
      });
      break;

    case '🌀 Portal Void':
      gravity = { x: 0, y: 0.28 };
      // Spawn two linked portal pairs for crazy sequence chain reactions!
      portals.push({
        id: 'port_1',
        posA: { x: rng.range(220, 300), y: rng.range(150, 300) },
        posB: { x: rng.range(700, 800), y: rng.range(150, 300) },
        radius: 26,
        color: '#f97316', // Orange A
        angleA: 0,
        angleB: Math.PI
      });
      portals.push({
        id: 'port_extra_blue',
        posA: { x: rng.range(310, 450), y: rng.range(360, 520) },
        posB: { x: rng.range(550, 680), y: rng.range(360, 520) },
        radius: 26,
        color: '#3b82f6', // Cobalt Portal
        angleA: -Math.PI / 2,
        angleB: Math.PI / 2
      });
      // Middle grid partition barriers
      obstacles.push({
        id: 'void_partition',
        shape: 'box',
        position: { x: 500, y: 325 },
        width: 25,
        height: 480,
        angle: 0,
        color: '#334155'
      });
      // Add background gravity attractors siphoning ball towards portals
      for (let i = 0; i < 2; i++) {
        gravityFields.push({
          id: `void_grav_${i}`,
          position: { x: i === 0 ? 280 : 720, y: 320 },
          radius: 110,
          strength: -0.22,
          type: 'radial',
          color: 'rgba(99, 102, 241, 0.18)'
        });
      }
      // Add key gravity inverters
      if (rng.next() > 0.4) {
        interactives.push({
          id: `gravity_inv_${id}`,
          type: 'powerup_invert',
          position: { x: 500, y: 65 },
          color: '#ec4899',
          isTriggered: false
        });
      }
      break;

    case '💨 Wind Turbine':
      gravity = { x: 0, y: 0.25 };
      // Generate violent horizontal wind tunnels
      for (let i = 0; i < rng.range(3, 5); i++) {
        const isHoriz = rng.next() > 0.45;
        forceZones.push({
          id: `wind_${i}`,
          x: rng.range(180, 680),
          y: rng.range(120, 480),
          width: isHoriz ? rng.range(220, 380) : 130,
          height: isHoriz ? 130 : rng.range(220, 380),
          force: isHoriz ? { x: rng.next() > 0.5 ? 0.42 : -0.42, y: 0.05 } : { x: 0.05, y: rng.next() > 0.5 ? 0.42 : -0.42 },
          color: 'rgba(20, 184, 166, 0.14)' // transparent teal gust
        });
      }
      // Turbine bumper boards with super elasticity
      for (let i = 0; i < rng.range(2, 4); i++) {
        obstacles.push({
          id: `turbine_blade_${i}`,
          shape: 'box',
          position: { x: rng.range(280, 720), y: rng.range(180, 460) },
          width: 120,
          height: 15,
          angle: rng.next() * Math.PI,
          color: '#14b8a6',
          restitution: 1.15 // bouncy physical catapult launcher
        });
      }
      break;

    case '🌴 Bounce Jungle':
      gravity = { x: 0, y: 0.28 };
      // Filled with massive bouncy trampoline barriers
      for (let i = 0; i < rng.range(7, 10); i++) {
        obstacles.push({
          id: `jungle_bounce_${i}`,
          shape: 'circle',
          position: { x: rng.range(220, 780), y: rng.range(120, 480) },
          radius: rng.range(22, 45),
          angle: 0,
          color: '#10b981', // emerald bouncy cushions
          restitution: 1.1 // extreme bounce!
        });
      }
      // Add sticky mud fluids slowing you down
      for (let i = 0; i < 2; i++) {
        fluids.push({
          id: `jungle_sap_${i}`,
          x: rng.range(300, 650),
          y: rng.range(180, 450),
          width: 145,
          height: 95,
          density: 1.5,
          dragCoefficient: 0.08,
          color: 'rgba(234, 179, 8, 0.25)' // mud sap yellow
        });
      }
      // Scattered rocket speed boosters to leap over mud
      for (let i = 0; i < 2; i++) {
        interactives.push({
          id: `jungle_speed_${i}`,
          type: 'powerup_speed',
          position: { x: rng.range(200, 800), y: rng.range(150, 460) },
          color: '#06b6d4',
          isTriggered: false
        });
      }
      break;

    case '🌌 Celestial Axis':
      gravity = { x: 0, y: 0.1 };
      // Twin purple cosmic wormhole portals
      portals.push({
        id: 'sky_axis_port_a',
        posA: { x: rng.range(200, 380), y: rng.range(160, 480) },
        posB: { x: rng.range(620, 800), y: rng.range(160, 480) },
        radius: 26,
        color: '#a855f7',
        angleA: Math.PI / 3,
        angleB: -Math.PI / 3
      });
      // High gravity vortex spiral orbits siphoning trajectory path
      for (let i = 0; i < rng.range(3, 5); i++) {
        gravityFields.push({
          id: `galaxy_vort_${i}`,
          position: { x: rng.range(280, 720), y: rng.range(150, 480) },
          radius: rng.range(135, 200),
          strength: rng.next() > 0.5 ? -0.28 : 0.28,
          type: 'vortex',
          color: 'rgba(168, 85, 247, 0.24)' // rotating purple cosmos fields
        });
      }
      // Spatial floating kinematic bumper
      obstacles.push({
        id: 'sky_lift',
        shape: 'box',
        position: { x: 500, y: 300 },
        width: 180,
        height: 22,
        angle: Math.PI / 8,
        color: '#d946ef',
        restitution: 0.95
      });
      break;

    case '🚨 Laser Refinery':
      gravity = { x: 0, y: 0.32 };
      // Dual interlocking security locks obstructing paths
      const doorA_Id = `ref_door_A_${id}`;
      const doorB_Id = `ref_door_B_${id}`;

      obstacles.push({
        id: doorA_Id,
        shape: 'box',
        position: { x: 380, y: rng.range(150, 400) },
        width: 25,
        height: 156,
        angle: 0,
        color: '#ef4444' // Crimson door laser shield
      });
      obstacles.push({
        id: doorB_Id,
        shape: 'box',
        position: { x: 680, y: rng.range(200, 480) },
        width: 25,
        height: 156,
        angle: 0,
        color: '#fbbf24' // lock barrier B
      });
      // Remote secure unlocking terminals
      interactives.push({
        id: 'keypad_btn_A',
        type: 'button',
        position: { x: rng.range(150, 300), y: rng.range(420, 520) },
        color: '#ef4444',
        isTriggered: false,
        targetId: doorA_Id
      });
      interactives.push({
        id: 'keypad_btn_B',
        type: 'heavy_button', // requires raw weight to unlock!
        position: { x: rng.range(420, 550), y: rng.range(180, 280) },
        color: '#fbbf24',
        isTriggered: false,
        targetId: doorB_Id
      });
      // Horizontal & vertical security laser scanners
      for (let i = 0; i < rng.range(2, 4); i++) {
        interactives.push({
          id: `ref_laser_${i}`,
          type: 'laser',
          position: { x: rng.range(200, 750), y: rng.range(120, 480) },
          width: i % 2 === 0 ? rng.range(120, 220) : 0,
          height: i % 2 !== 0 ? rng.range(120, 220) : 0,
          color: 'rgba(244, 63, 94, 0.95)',
          isTriggered: false
        });
      }
      break;

    case '🧲 Magneto Mines':
      gravity = { x: 0, y: 0.18 };
      // Alternating intense grid of localized magnetic pulses
      for (let i = 0; i < rng.range(4, 7); i++) {
        const isAttract = i % 2 === 0;
        gravityFields.push({
          id: `mine_mag_${i}`,
          position: { x: 180 + i * 130, y: rng.range(150, 480) },
          radius: 110,
          strength: isAttract ? -0.38 : 0.38,
          type: 'radial',
          color: isAttract ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)'
        });
      }
      // Electromagnetic high-rebound guide rails pushing ball violently
      obstacles.push({
        id: 'mag_rail_1',
        shape: 'box',
        position: { x: 400, y: 480 },
        width: 250,
        height: 18,
        angle: -Math.PI / 12,
        color: '#3b82f6',
        restitution: 1.25
      });
      obstacles.push({
        id: 'mag_rail_2',
        shape: 'box',
        position: { x: 600, y: 150 },
        width: 250,
        height: 18,
        angle: Math.PI / 12,
        color: '#ef4444',
        restitution: 1.25
      });
      break;

    case '🔥 Chaos Crucible':
    case '♾️ Absolute Infinity':
    default:
      gravity = { x: 0, y: 0.25 };
      // Giant fluid pool
      fluids.push({
        id: 'chaos_water',
        x: rng.range(300, 480),
        y: rng.range(350, 420),
        width: 280,
        height: 180,
        density: 1.25,
        dragCoefficient: 0.02,
        color: 'rgba(56, 189, 248, 0.28)'
      });
      // Linked vortex portals siphoning projectiles
      portals.push({
        id: 'chaos_portal_pair',
        posA: { x: rng.range(150, 250), y: rng.range(400, 500) },
        posB: { x: rng.range(750, 850), y: rng.range(150, 250) },
        radius: 26,
        color: '#10b981',
        angleA: Math.PI / 4,
        angleB: -Math.PI / 2
      });
      // Safety key locks
      const chaosDoor = 'chaos_door_barrier';
      obstacles.push({
        id: chaosDoor,
        shape: 'box',
        position: { x: rng.range(700, 800), y: rng.range(400, 510) },
        width: 28,
        height: 130,
        angle: 0,
        color: '#eab308'
      });
      interactives.push({
        id: 'chaos_trigger_pad',
        type: 'heavy_button',
        position: { x: rng.range(150, 250), y: rng.range(180, 260) },
        color: '#eab308',
        isTriggered: false,
        targetId: chaosDoor
      });
      // Danger hazard spikes
      for (let i = 0; i < rng.range(3, 5); i++) {
        interactives.push({
          id: `chaos_spike_${i}`,
          type: 'spike',
          position: { x: rng.range(350, 750), y: rng.range(150, 520) },
          color: '#ef4444',
          isTriggered: false
        });
      }
      // Twisting background space vortex puller
      gravityFields.push({
        id: 'chaos_vortex_center',
        position: { x: 500, y: 250 },
        radius: 160,
        strength: -0.28,
        type: 'vortex',
        color: 'rgba(236, 72, 153, 0.2)'
      });
      break;
  }

  // Populate Default Grid Boundaries & Shelves to make the run more puzzle-like
  // Generates randomized platform shelves to prevent just falling from start straight to goal
  const floorShelvesCount = rng.range(3, 6);
  for (let i = 0; i < floorShelvesCount; i++) {
    const shelfX = rng.range(220, 780);
    const shelfY = rng.range(220, 500);
    const width = rng.range(130, 260);
    const height = 18;
    obstacles.push({
      id: `shelf_${i}`,
      shape: 'box',
      position: { x: shelfX, y: shelfY },
      width,
      height,
      angle: rng.range(-15, 15) * (Math.PI / 180), // subtle angles
      color: '#475569' // slate grey shelves
    });

    // Spawn a shiny collectible star suspended above shelves to provide premium targets
    if (rng.next() > 0.35) {
      interactives.push({
        id: `star_shelf_${id}_${i}`,
        type: 'star',
        position: { x: shelfX + rng.range(-30, 30), y: shelfY - rng.range(40, 70) },
        color: '#fbbf24',
        isTriggered: false
      });
    }
  }

  // Scatter a speed powerup sometimes to boost playground slingshot kinetic acceleration
  if (rng.next() > 0.4) {
    interactives.push({
      id: `std_speed_pwr_${id}`,
      type: 'powerup_speed',
      position: { x: rng.range(300, 700), y: rng.range(220, 420) },
      color: '#3b82f6',
      isTriggered: false
    });
  }

  // --- Massive Object Expansion Request & Spreading ---
  // The user requested 50 new objects that can appear, and to spread obstacles out more.
  // We expand the map virtually and insert 50 diverse objects.
  
  // Spread start and goal far apart
  if (rng.next() > 0.5) {
    startX = rng.range(40, 120);
    startY = rng.range(50, 150);
    goalX = rng.range(880, 960);
    goalY = rng.range(480, 580);
  }

  // Generate unique new random obstacle / interactives spread evenly but widely
  // Scale the number of objects gradually as the level progresses
  const numObjects = Math.min(80, Math.floor(id * 1.5) + 3);
  for (let i = 0; i < numObjects; i++) {
    const rx = rng.range(50, 950);
    const ry = rng.range(50, 600);
    
    // Avoid spawning right on top of start/goal
    if (Math.abs(rx - startX) < 120 && Math.abs(ry - startY) < 120) continue;
    if (Math.abs(rx - goalX) < 120 && Math.abs(ry - goalY) < 120) continue;

    const rType = rng.next();
    
    if (rType < 0.1) {
      // 10% chance for a floating box obstacle
      obstacles.push({
        id: `extra_obj_box_${id}_${i}`,
        shape: 'box',
        position: { x: rx, y: ry },
        width: rng.range(15, 65),
        height: rng.range(15, 35),
        angle: rng.range(0, 360) * (Math.PI / 180),
        color: '#475569', // subtle grey
        restitution: rng.range(0.2, 1.2)
      });
    } else if (rType < 0.2) {
      // 10% chance for a circular pinball bumper
      obstacles.push({
        id: `extra_obj_circle_${id}_${i}`,
        shape: 'circle',
        position: { x: rx, y: ry },
        radius: rng.range(10, 22),
        angle: 0,
        color: '#fb923c', // orange bumper
        restitution: rng.range(1.1, 1.8)
      });
    } else if (rType < 0.3) {
      // 10% chance for lava
      fluids.push({
        id: `extra_lava_${id}_${i}`,
        x: rx - 35, y: ry - 35, width: 70, height: 70,
        density: 1.5, dragCoefficient: 0.1,
        color: 'rgba(239, 68, 68, 0.5)', type: 'lava'
      });
    } else if (rType < 0.4) {
      // 10% chance for liquid nitrogen
      fluids.push({
        id: `extra_nitrogen_${id}_${i}`,
        x: rx - 40, y: ry - 40, width: 80, height: 80,
        density: 0.8, dragCoefficient: 0.6,
        color: 'rgba(56, 189, 248, 0.4)', type: 'liquid_nitrogen'
      });
    } else if (rType < 0.45) {
      // 5% chance for bouncy pad
      interactives.push({
        id: `extra_bouncy_${id}_${i}`,
        type: 'bouncy_pad',
        position: { x: rx, y: ry },
        width: 60, height: 20,
        color: '#10b981', isTriggered: false
      });
    } else if (rType < 0.5) {
      // 5% chance for a teleporter
      interactives.push({
        id: `extra_tele_${id}_${i}`,
        type: 'teleporter',
        position: { x: rx, y: ry },
        color: '#a855f7', isTriggered: false
      });
    } else if (rType < 0.6) {
      // 10% chance for heater/freezer
      interactives.push({
        id: `extra_temp_${id}_${i}`,
        type: rng.next() > 0.5 ? 'heater' : 'freezer',
        position: { x: rx, y: ry },
        color: '#f43f5e', isTriggered: false
      });
    } else if (rType < 0.70) {
      // 10% chance for a small spike hazard
      interactives.push({
        id: `extra_obj_spike_${id}_${i}`,
        type: 'spike',
        position: { x: rx, y: ry },
        color: '#ef4444',
        isTriggered: false
      });
    } else if (rType < 0.75) {
      // 5% chance for a conveyor belt
      interactives.push({
        id: `extra_conveyor_${id}_${i}`,
        type: 'conveyor_belt',
        position: { x: rx, y: ry },
        width: rng.range(80, 160),
        color: '#475569',
        isTriggered: false
      });
    } else if (rType < 0.80) {
      // 5% chance for a tar pit
      interactives.push({
        id: `extra_tarpit_${id}_${i}`,
        type: 'tar_pit',
        position: { x: rx, y: ry },
        color: '#0f172a',
        isTriggered: false
      });
    } else if (rType < 0.85) {
      // 5% chance for a magnet (replacing partially star)
      interactives.push({
        id: `extra_magnet_${id}_${i}`,
        type: 'magnet',
        position: { x: rx, y: ry },
        color: '#ef4444',
        isTriggered: false
      });
    } else if (rType < 0.92) {
      // 7% chance for a collectible star
      interactives.push({
        id: `extra_obj_star_${id}_${i}`,
        type: 'star',
        position: { x: rx, y: ry },
        color: '#facc15',
        isTriggered: false
      });
    } else if (rType < 0.97) {
      // 8% chance for a tiny gravity anomaly
      gravityFields.push({
        id: `extra_obj_grav_${id}_${i}`,
        position: { x: rx, y: ry },
        radius: rng.range(60, 110),
        strength: rng.next() > 0.5 ? 0.12 : -0.12,
        type: 'radial',
        color: 'rgba(168, 85, 247, 0.12)'
      });
    } else {
      // 10% chance for a localized wind gust (fan)
      forceZones.push({
        id: `extra_obj_wind_${id}_${i}`,
        x: rx - 40,
        y: ry - 40,
        width: 80,
        height: 80,
        force: {
          x: rng.range(-0.6, 0.6),
          y: rng.range(-0.6, 0.6)
        },
        color: 'rgba(20, 184, 166, 0.2)',
        type: 'fan'
      });
    }
  }

  // Create Goal Area
  const goal: GoalArea = {
    position: { x: goalX, y: goalY },
    radius: 32,
    color: 'rgba(234, 179, 8, 0.4)' // neon gold overlay
  };

  // Determine competitive star target times based on level complexity/number of nodes
  const levelComplexity = obstacles.length + portals.length + gravityFields.length + interactives.length;
  const baseEstimate = 4.5 + levelComplexity * 1.2;
  const goldTime = Number(baseEstimate.toFixed(1));
  const silverTime = Number((baseEstimate * 1.45).toFixed(1));
  const bronzeTime = Number((baseEstimate * 2.1).toFixed(1));

  return {
    id,
    name: title,
    theme: era,
    gravity,
    wind,
    startPosition: { x: startX, y: startY },
    goal,
    obstacles,
    portals,
    gravityFields,
    fluids,
    forceZones,
    interactives,
    goldTime,
    silverTime,
    bronzeTime
  };
}

// Handcrafted introducing names list
function getRandomLevelName(id: number, rng: SeededRandom): string {
  const scienceTerms = [
    'Quantum Vector', 'Kinetic Drift', 'Bending Gravity', 'Hydropress Node',
    'Friction Valley', 'Gale Turbine', 'Aether Vortex', 'Thermal Draft',
    'Elastic rebound', 'Portal Re-injection', 'Momentum Cascade', 'Sinking Hollows',
    'Chamber of Locks', 'Celestial Alignment', 'Orbit Defrost', 'Cybernetic Refinery'
  ];
  return `${rng.pick(scienceTerms)} ${id % 7 === 0 ? 'MK-II' : id % 11 === 0 ? 'Prime' : ''}`;
}

export function generateEscapeRoomLevel(id: number): LevelConfig {
  const obstacles: Obstacle[] = [];
  const portals: Portal[] = [];
  const gravityFields: GravityField[] = [];
  const fluids: FluidBody[] = [];
  const forceZones: ForceZone[] = [];
  const interactives: InteractiveElement[] = [];

  let name = '';
  // Level theme setup
  let startPosition = { x: 100, y: 500 };
  let goalPosition = { x: 900, y: 300 };

  if (id === 1001) {
    name = "🔓 Escape Room 1: The Micro-Squeeze Tunnel";
    startPosition = { x: 100, y: 520 };
    goalPosition = { x: 900, y: 520 };

    obstacles.push({
      id: 'division_wall',
      shape: 'box',
      position: { x: 500, y: 325 },
      width: 30,
      height: 650,
      angle: 0,
      color: '#475569'
    });

    obstacles.push({
      id: 'escape_door_1',
      shape: 'box',
      position: { x: 500, y: 570 },
      width: 40,
      height: 120,
      angle: 0,
      color: '#f43f5e'
    });

    obstacles.push({
      id: 'narrow_gap_bottom',
      shape: 'box',
      position: { x: 260, y: 440 },
      width: 160,
      height: 20,
      angle: 0,
      color: '#334155'
    });

    obstacles.push({
      id: 'narrow_gap_top',
      shape: 'box',
      position: { x: 260, y: 400 }, // 20px gap, standard ball radius 14 doesn't fit, shrunk radius 7 fits!
      width: 160,
      height: 20,
      angle: 0,
      color: '#334155'
    });

    // Collectable shrinking power-up
    interactives.push({
      id: 'shrink_pwr_1',
      type: 'powerup_shrink',
      position: { x: 120, y: 440 },
      color: '#a855f7',
      isTriggered: false
    });

    // Button to trigger the door, placed behind the squeeze gap!
    interactives.push({
      id: 'escape_btn_1',
      type: 'button',
      position: { x: 410, y: 420 },
      color: '#f43f5e',
      isTriggered: false,
      targetId: 'escape_door_1'
    });

    // Glowing helper decoration light
    gravityFields.push({
      id: 'light_decor',
      position: { x: 500, y: 150 },
      radius: 120,
      strength: 0.1,
      type: 'radial',
      color: 'rgba(168, 85, 247, 0.1)'
    });
  } 
  
  else if (id === 1002) {
    name = "🔓 Escape Room 2: Gravity Inversion Chamber";
    startPosition = { x: 120, y: 520 };
    goalPosition = { x: 910, y: 140 };

    obstacles.push({
      id: 'middle_deck',
      shape: 'box',
      position: { x: 500, y: 325 },
      width: 750,
      height: 20,
      angle: 0,
      color: '#475569'
    });

    obstacles.push({
      id: 'locked_ceiling_gate',
      shape: 'box',
      position: { x: 800, y: 140 },
      width: 20,
      height: 180,
      angle: 0,
      color: '#10b981'
    });

    // Pickable Gravity Inverter on bottom floor
    interactives.push({
      id: 'invert_pwr_1',
      type: 'powerup_invert',
      position: { x: 420, y: 520 },
      color: '#10b981',
      isTriggered: false
    });

    // Unlocks the ceiling gate, positioned above the shelf
    interactives.push({
      id: 'escape_btn_2',
      type: 'button',
      position: { x: 200, y: 90 },
      color: '#10b981',
      isTriggered: false,
      targetId: 'locked_ceiling_gate'
    });

    obstacles.push({
      id: 'safety_block',
      shape: 'box',
      position: { x: 540, y: 460 },
      width: 140,
      height: 20,
      angle: 0,
      color: '#334155'
    });
  } 
  
  else {
    name = "🔓 Escape Room 3: Chrono-Laser Gatehouse";
    startPosition = { x: 100, y: 120 };
    goalPosition = { x: 900, y: 540 };

    obstacles.push({
      id: 'maze_wall_1',
      shape: 'box',
      position: { x: 300, y: 200 },
      width: 20,
      height: 380,
      angle: 0,
      color: '#475569'
    });

    obstacles.push({
      id: 'maze_wall_2',
      shape: 'box',
      position: { x: 650, y: 450 },
      width: 20,
      height: 380,
      angle: 0,
      color: '#475569'
    });

    obstacles.push({
      id: 'clockwork_gate',
      shape: 'box',
      position: { x: 850, y: 460 },
      width: 20,
      height: 180,
      angle: 0,
      color: '#fbbf24'
    });

    // Placed collectables
    interactives.push({
      id: 'speed_pwr_1',
      type: 'powerup_speed',
      position: { x: 150, y: 520 },
      color: '#f59e0b',
      isTriggered: false
    });

    interactives.push({
      id: 'escape_btn_3',
      type: 'heavy_button', // requires raw momentum kinetic impact energy!
      position: { x: 480, y: 540 },
      color: '#fbbf24',
      isTriggered: false,
      targetId: 'clockwork_gate'
    });

    interactives.push({
      id: 'chamber_laser_guard',
      type: 'laser',
      position: { x: 310, y: 380 },
      width: 330,
      height: 0,
      color: 'rgba(239, 68, 68, 0.9)',
      isTriggered: false
    });
  }

  return {
    id,
    name,
    theme: '🔐 Escape Strategy',
    gravity: { x: 0, y: 0.25 },
    wind: { x: 0, y: 0 },
    startPosition,
    goal: { position: goalPosition, radius: 28, color: 'rgba(234, 179, 8, 0.45)' },
    obstacles,
    portals,
    gravityFields,
    fluids,
    forceZones,
    interactives,
    goldTime: 12,
    silverTime: 22,
    bronzeTime: 40
  };
}

export function generateZeroGravityLevel(id: number): LevelConfig {
  const obstacles: Obstacle[] = [];
  const portals: Portal[] = [];
  const gravityFields: GravityField[] = [];
  const fluids: FluidBody[] = [];
  const forceZones: ForceZone[] = [];
  const interactives: InteractiveElement[] = [];

  let name = '';
  let startPosition = { x: 100, y: 325 };
  let goalPosition = { x: 900, y: 325 };

  if (id === 2001) {
    name = "🌌 Zero-G Void 1: Vector Slalom";
    startPosition = { x: 100, y: 325 };
    goalPosition = { x: 900, y: 325 };

    obstacles.push({
      id: 'slalom_wall_1',
      shape: 'box',
      position: { x: 300, y: 150 },
      width: 40,
      height: 350,
      angle: 0,
      color: '#38bdf8'
    });

    obstacles.push({
      id: 'slalom_wall_2',
      shape: 'box',
      position: { x: 550, y: 500 },
      width: 40,
      height: 350,
      angle: 0,
      color: '#38bdf8'
    });

    obstacles.push({
      id: 'slalom_wall_3',
      shape: 'box',
      position: { x: 750, y: 150 },
      width: 40,
      height: 350,
      angle: 0,
      color: '#38bdf8'
    });

    interactives.push({
      id: 'star_zg_1',
      type: 'star',
      position: { x: 300, y: 450 },
      color: '#fbbf24',
      isTriggered: false
    });

    interactives.push({
      id: 'star_zg_2',
      type: 'star',
      position: { x: 750, y: 450 },
      color: '#fbbf24',
      isTriggered: false
    });
  } else if (id === 2002) {
    name = "🌌 Zero-G Void 2: The Quantum Core";
    startPosition = { x: 100, y: 325 };
    goalPosition = { x: 900, y: 325 };

    obstacles.push({
      id: 'core_door',
      shape: 'box',
      position: { x: 750, y: 325 },
      width: 30,
      height: 300,
      angle: 0,
      color: '#ef4444'
    });

    gravityFields.push({
      id: 'repeller_core',
      position: { x: 500, y: 325 },
      radius: 120,
      strength: -0.25,
      type: 'radial',
      color: 'rgba(239, 68, 68, 0.15)'
    });

    obstacles.push({
      id: 'cage_top',
      shape: 'box',
      position: { x: 500, y: 180 },
      width: 140,
      height: 10,
      angle: 0,
      color: '#475569'
    });

    interactives.push({
      id: 'core_btn_1',
      type: 'button',
      position: { x: 500, y: 140 },
      color: '#10b981',
      isTriggered: false,
      targetId: 'core_door'
    });

    interactives.push({
      id: 'core_star',
      type: 'star',
      position: { x: 500, y: 325 },
      color: '#fbbf24',
      isTriggered: false
    });
  } else {
    name = "🌌 Zero-G Void 3: The Event Horizon";
    startPosition = { x: 120, y: 550 };
    goalPosition = { x: 880, y: 120 };

    gravityFields.push({
      id: 'black_hole',
      position: { x: 500, y: 325 },
      radius: 200,
      strength: 0.35,
      type: 'radial',
      color: 'rgba(99, 102, 241, 0.25)'
    });

    interactives.push({
      id: 'vent_laser_1',
      type: 'laser',
      position: { x: 500, y: 325 },
      width: 400,
      height: 0,
      color: 'rgba(244, 63, 94, 0.85)',
      isTriggered: false
    });

    interactives.push({
      id: 'orbit_star_1',
      type: 'star',
      position: { x: 380, y: 220 },
      color: '#fbbf24',
      isTriggered: false
    });

    interactives.push({
      id: 'orbit_star_2',
      type: 'star',
      position: { x: 620, y: 430 },
      color: '#fbbf24',
      isTriggered: false
    });
  }

  return {
    id,
    name,
    theme: '🌌 Zero-G Void',
    gravity: { x: 0, y: 0 },
    wind: { x: 0, y: 0 },
    startPosition,
    goal: { position: goalPosition, radius: 28, color: 'rgba(99, 102, 241, 0.5)' },
    obstacles,
    portals,
    gravityFields,
    fluids,
    forceZones,
    interactives,
    goldTime: 12,
    silverTime: 22,
    bronzeTime: 42
  };
}

export function generateGravityStormLevel(id: number): LevelConfig {
  const obstacles: Obstacle[] = [];
  const portals: Portal[] = [];
  const gravityFields: GravityField[] = [];
  const fluids: FluidBody[] = [];
  const forceZones: ForceZone[] = [];
  const interactives: InteractiveElement[] = [];

  let name = '';
  let startPosition = { x: 100, y: 500 };
  let goalPosition = { x: 900, y: 150 };

  if (id === 3001) {
    name = "🌀 Tempest 1: Solar Winds";
    startPosition = { x: 100, y: 520 };
    goalPosition = { x: 900, y: 180 };

    forceZones.push({
      id: 'wind_left_zone',
      x: 300,
      y: 100,
      width: 400,
      height: 450,
      force: { x: 0.18, y: -0.1 },
      color: 'rgba(56, 189, 248, 0.15)'
    });

    obstacles.push({
      id: 'gale_wall',
      shape: 'box',
      position: { x: 500, y: 350 },
      width: 40,
      height: 250,
      angle: 0.4,
      color: '#475569'
    });

    interactives.push({
      id: 'gale_star_1',
      type: 'star',
      position: { x: 500, y: 150 },
      color: '#fbbf24',
      isTriggered: false
    });
  } else if (id === 3002) {
    name = "🌀 Tempest 2: Shifting Singularity";
    startPosition = { x: 100, y: 325 };
    goalPosition = { x: 900, y: 325 };

    gravityFields.push({
      id: 'vortex_left',
      position: { x: 350, y: 200 },
      radius: 140,
      strength: 0.28,
      type: 'radial',
      color: 'rgba(168, 85, 247, 0.2)'
    });

    gravityFields.push({
      id: 'vortex_right',
      position: { x: 650, y: 450 },
      radius: 140,
      strength: -0.28,
      type: 'radial',
      color: 'rgba(236, 72, 153, 0.2)'
    });

    interactives.push({
      id: 'gale_star_2',
      type: 'star',
      position: { x: 500, y: 325 },
      color: '#fbbf24',
      isTriggered: false
    });
  } else {
    name = "🌀 Tempest 3: Hurricane Void";
    startPosition = { x: 100, y: 150 };
    goalPosition = { x: 900, y: 520 };

    forceZones.push({
      id: 'cyclone_bottom',
      x: 200,
      y: 350,
      width: 600,
      height: 250,
      force: { x: -0.22, y: -0.05 },
      color: 'rgba(244, 63, 94, 0.15)'
    });

    obstacles.push({
      id: 'center_shield',
      shape: 'box',
      position: { x: 500, y: 300 },
      width: 150,
      height: 30,
      angle: -0.3,
      color: '#64748b'
    });

    interactives.push({
      id: 'storm_star_3',
      type: 'star',
      position: { x: 500, y: 180 },
      color: '#fbbf24',
      isTriggered: false
    });
  }

  return {
    id,
    name,
    theme: '🌀 Gravity Storm',
    gravity: { x: 0, y: 0.35 },
    wind: { x: 0.1, y: 0 },
    startPosition,
    goal: { position: goalPosition, radius: 28, color: 'rgba(236, 72, 153, 0.5)' },
    obstacles,
    portals,
    gravityFields,
    fluids,
    forceZones,
    interactives,
    goldTime: 12,
    silverTime: 25,
    bronzeTime: 45
  };
}

export function generateChaosLevel(id: number): LevelConfig {
  const rng = new SeededRandom(id + Math.floor(Math.random() * 10000));
  
  const startPosition = { x: 80, y: rng.range(150, 450) };
  const goalPosition = { x: 920, y: rng.range(150, 450) };

  const obstacles: Obstacle[] = [];
  const portals: Portal[] = [];
  const gravityFields: GravityField[] = [];
  const fluids: FluidBody[] = [];
  const forceZones: ForceZone[] = [];
  const interactives: InteractiveElement[] = [];

  const placeWackyObject = (typeIdx: number, x: number, y: number) => {
    const oId = `chaos_${typeIdx}_${Date.now()}_${Math.floor(rng.next() * 1000)}`;
    switch (typeIdx) {
      case 0:
        obstacles.push({ id: oId, shape: 'circle', position: { x, y }, radius: 36, angle: 0, color: '#f43f5e', restitution: 1.35 });
        break;
      case 1:
        obstacles.push({ id: oId, shape: 'circle', position: { x, y }, radius: 24, angle: 0, color: '#06b6d4', restitution: 1.5 });
        break;
      case 2:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 80, height: 20, angle: 0.2, color: '#1e293b', restitution: 0.0 });
        break;
      case 3:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 60, height: 16, angle: -0.5, color: '#fbbf24', restitution: 1.6 });
        break;
      case 4:
        portals.push({ id: oId, posA: { x, y }, posB: { x: x + 150, y: y - 100 }, radius: 25, color: '#f97316', angleA: rng.next() * Math.PI, angleB: rng.next() * Math.PI });
        break;
      case 5:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 120, height: 12, angle: 0.1, color: '#93c5fd', restitution: 0.95 });
        break;
      case 6:
        fluids.push({ id: oId, x: x - 50, y: y - 30, width: 100, height: 60, density: 1.25, dragCoefficient: 0.05, color: 'rgba(34, 197, 94, 0.35)' });
        break;
      case 7:
        fluids.push({ id: oId, x: x - 60, y: y - 40, width: 120, height: 80, density: -0.8, dragCoefficient: 0.1, color: 'rgba(234, 179, 8, 0.25)' });
        break;
      case 8:
        forceZones.push({ id: oId, x: x - 80, y: y - 40, width: 160, height: 80, force: { x: 0.55, y: 0 }, color: 'rgba(14, 165, 233, 0.15)' });
        break;
      case 9:
        forceZones.push({ id: oId, x: x - 50, y: y - 100, width: 100, height: 200, force: { x: 0, y: -0.6 }, color: 'rgba(239, 68, 68, 0.1)' });
        break;
      case 10:
        forceZones.push({ id: oId, x: x - 60, y: y - 50, width: 120, height: 100, force: { x: 0, y: 0.58 }, color: 'rgba(124, 58, 237, 0.12)' });
        break;
      case 11:
        gravityFields.push({ id: oId, position: { x, y }, radius: 160, strength: -7.5, type: 'radial', color: 'rgba(168, 85, 247, 0.3)' });
        break;
      case 12:
        gravityFields.push({ id: oId, position: { x, y }, radius: 140, strength: 6.8, type: 'vortex', color: 'rgba(6, 182, 212, 0.25)' });
        break;
      case 13:
        gravityFields.push({ id: oId, position: { x, y }, radius: 120, strength: 5.5, type: 'radial', color: 'rgba(236, 72, 153, 0.25)' });
        break;
      case 14:
        interactives.push({ id: oId, type: 'star', position: { x, y }, color: '#fbbf24', isTriggered: false });
        break;
      case 15:
        interactives.push({ id: oId, type: 'powerup_speed', position: { x, y }, color: '#3b82f6', isTriggered: false });
        break;
      case 16:
        interactives.push({ id: oId, type: 'powerup_shrink', position: { x, y }, color: '#ec4899', isTriggered: false });
        break;
      case 17:
        interactives.push({ id: oId, type: 'powerup_invert', position: { x, y }, color: '#a855f7', isTriggered: false });
        break;
      case 18:
        interactives.push({ id: oId, type: 'button', position: { x, y }, color: '#10b981', isTriggered: false, targetId: `gate_${oId}` });
        obstacles.push({ id: `gate_${oId}`, shape: 'box', position: { x: x + 60, y: y + 80 }, width: 14, height: 90, angle: 0, color: '#10b981' });
        break;
      case 19:
        interactives.push({ id: oId, type: 'heavy_button', position: { x, y }, color: '#d946ef', isTriggered: false });
        break;
      case 20:
        interactives.push({ id: oId, type: 'spike', position: { x, y }, color: '#ef4444', isTriggered: false });
        break;
      case 21:
        interactives.push({ id: oId, type: 'spike', position: { x, y }, color: '#ef4444', isTriggered: false });
        interactives.push({ id: `${oId}_2`, type: 'spike', position: { x: x + 40, y }, color: '#ef4444', isTriggered: false });
        break;
      case 22:
        gravityFields.push({ id: oId, position: { x, y }, radius: 100, strength: -0.01, type: 'radial', color: 'rgba(255, 255, 255, 0.15)' });
        break;
      case 23:
        obstacles.push({ id: oId, shape: 'circle', position: { x, y }, radius: 15, angle: 0, color: '#fbbf24', restitution: 1.25 });
        break;
      case 24:
        fluids.push({ id: oId, x: x - 40, y: y - 40, width: 80, height: 80, density: 1.7, dragCoefficient: 0.01, color: 'rgba(236, 72, 153, 0.4)' });
        break;
      case 25:
        forceZones.push({ id: oId, x: x - 50, y: y - 50, width: 100, height: 100, force: { x: 0, y: 0.45 }, color: 'rgba(244, 63, 94, 0.15)' });
        break;
      case 26:
        forceZones.push({ id: oId, x: x - 50, y: y - 50, width: 100, height: 100, force: { x: -0.45, y: 0 }, color: 'rgba(56, 189, 248, 0.15)' });
        break;
      case 27:
        gravityFields.push({ id: oId, position: { x, y }, radius: 180, strength: -8.0, type: 'radial', color: 'rgba(139, 92, 246, 0.35)' });
        break;
      case 28:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 100, height: 25, angle: 0, color: '#10b981', restitution: 1.45 });
        break;
      case 29:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 80, height: 16, angle: 0.8, color: '#eab308', restitution: 1.2 });
        break;
      case 31:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 45, height: 45, angle: 0.3, color: '#a855f7', restitution: 1.1 });
        break;
      case 32:
        gravityFields.push({ id: oId, position: { x, y }, radius: 120, strength: -4.5, type: 'vortex', color: 'rgba(244, 63, 94, 0.25)' });
        break;
      case 33:
        portals.push({ id: oId, posA: { x, y }, posB: { x: x - 120, y: y + 80 }, radius: 26, color: '#06b6d4', angleA: Math.PI * 0.25, angleB: Math.PI * 1.25 });
        break;
      case 34:
        gravityFields.push({ id: oId, position: { x, y }, radius: 110, strength: 6.5, type: 'radial', color: 'rgba(251, 191, 36, 0.3)' });
        break;
      case 35:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 16, height: 110, angle: -0.2, color: '#bae6fd', restitution: 0.95 });
        break;
      case 36:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 75, height: 18, angle: 0.4, color: '#ec4899', restitution: 1.3 });
        break;
      case 37:
        interactives.push({ id: oId, type: 'spike', position: { x, y }, color: '#ef4444', isTriggered: false });
        interactives.push({ id: `${oId}_b`, type: 'spike', position: { x: x - 30, y }, color: '#ef4444', isTriggered: false });
        interactives.push({ id: `${oId}_c`, type: 'spike', position: { x: x + 30, y }, color: '#ef4444', isTriggered: false });
        break;
      case 38:
        fluids.push({ id: oId, x: x - 35, y: y - 35, width: 70, height: 75, density: 0.9, dragCoefficient: 0.25, color: 'rgba(244, 63, 94, 0.4)' });
        break;
      case 39:
        interactives.push({ id: oId, type: 'powerup_speed', position: { x, y }, color: '#4f46e5', isTriggered: false });
        break;
      case 40:
        portals.push({ id: oId, posA: { x, y }, posB: { x: 500, y: 300 }, radius: 24, color: '#a855f7', angleA: 0, angleB: Math.PI });
        break;
      case 41:
        gravityFields.push({ id: oId, position: { x, y }, radius: 155, strength: -7.0, type: 'radial', color: 'rgba(59, 130, 246, 0.3)' });
        break;
      case 42:
        gravityFields.push({ id: oId, position: { x, y }, radius: 130, strength: -5.8, type: 'vortex', color: 'rgba(236, 72, 153, 0.35)' });
        break;
      case 43:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 85, height: 14, angle: -0.1, color: '#10b981', restitution: 1.4 });
        break;
      case 44:
        gravityFields.push({ id: oId, position: { x, y }, radius: 110, strength: -1.2, type: 'radial', color: 'rgba(34, 211, 238, 0.25)' });
        break;
      case 45:
        interactives.push({ id: oId, type: 'star', position: { x, y }, color: '#fbbf24', isTriggered: false });
        break;
      case 46:
        obstacles.push({ id: oId, shape: 'circle', position: { x, y }, radius: 45, angle: 0, color: '#f43f5e', restitution: 1.45 });
        break;
      case 47:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 90, height: 18, angle: 0.6, color: '#818cf8', restitution: 1.15 });
        break;
      case 48:
        interactives.push({ id: oId, type: 'powerup_speed', position: { x, y }, color: '#06b6d4', isTriggered: false });
        break;
      case 49:
        portals.push({ id: oId, posA: { x, y }, posB: { x: goalPosition.x - 100, y: goalPosition.y }, radius: 28, color: '#6366f1', angleA: 0, angleB: 0 });
        break;
      case 50:
        fluids.push({ id: oId, x: x - 40, y: y - 40, width: 80, height: 80, density: -2.5, dragCoefficient: 0.15, color: 'rgba(34, 197, 94, 0.45)' });
        break;
      case 51:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 140, height: 10, angle: 0, color: '#f0fdfa', restitution: 0.05 });
        break;
      case 52:
        gravityFields.push({ id: oId, position: { x, y }, radius: 190, strength: -12.5, type: 'radial', color: 'rgba(239, 68, 68, 0.3)' });
        break;
      case 53:
        gravityFields.push({ id: oId, position: { x, y }, radius: 150, strength: 9.5, type: 'vortex', color: 'rgba(244, 114, 182, 0.35)' });
        break;
      case 54:
        gravityFields.push({ id: oId, position: { x, y }, radius: 150, strength: -9.5, type: 'vortex', color: 'rgba(56, 189, 248, 0.35)' });
        break;
      case 55:
        forceZones.push({ id: oId, x: x - 100, y: y - 25, width: 200, height: 50, force: { x: 0.95, y: 0 }, color: 'rgba(16, 185, 129, 0.2)' });
        break;
      case 56:
        gravityFields.push({ id: oId, position: { x, y }, radius: 210, strength: 11.0, type: 'radial', color: 'rgba(234, 179, 8, 0.3)' });
        break;
      case 57:
        forceZones.push({ id: oId, x: x - 60, y: y - 60, width: 120, height: 120, force: { x: 0, y: -0.32 }, color: 'rgba(79, 70, 229, 0.15)' });
        break;
      case 58:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 15, height: 150, angle: 0, color: '#ec4899', restitution: 1.65 });
        break;
      case 59:
        fluids.push({ id: oId, x: x - 45, y: y - 45, width: 90, height: 90, density: 3.2, dragCoefficient: 0.58, color: 'rgba(124, 58, 237, 0.45)' });
        break;
      case 60:
        portals.push({ id: oId, posA: { x, y }, posB: { x: x + 200, y: y + 50 }, radius: 28, color: '#22d3ee', angleA: Math.PI / 2, angleB: Math.PI * 1.5 });
        break;
      case 61:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 130, height: 35, angle: 0.7, color: '#4f46e5', restitution: 1.55 });
        break;
      case 62:
        interactives.push({ id: oId, type: 'powerup_speed', position: { x, y }, color: '#10b981', isTriggered: false });
        break;
      case 63:
        interactives.push({ id: oId, type: 'powerup_shrink', position: { x, y }, color: '#f43f5e', isTriggered: false });
        break;
      case 64:
        interactives.push({ id: oId, type: 'powerup_invert', position: { x, y }, color: '#06b6d4', isTriggered: false });
        break;
      case 65:
        interactives.push({ id: oId, type: 'spike', position: { x, y }, color: '#ef4444', isTriggered: false });
        interactives.push({ id: `${oId}_bar_2`, type: 'spike', position: { x: x + 35, y: y + 25 }, color: '#ef4444', isTriggered: false });
        break;
      case 66:
        interactives.push({ id: oId, type: 'button', position: { x, y }, color: '#22c55e', isTriggered: false, targetId: `sliding_gate_${oId}` });
        obstacles.push({ id: `sliding_gate_${oId}`, shape: 'box', position: { x: x - 40, y: y + 60 }, width: 100, height: 16, angle: -0.1, color: '#22c55e' });
        break;
      case 67:
        interactives.push({ id: oId, type: 'heavy_button', position: { x, y }, color: '#fb7185', isTriggered: false });
        break;
      case 68:
        gravityFields.push({ id: oId, position: { x, y }, radius: 220, strength: -16.0, type: 'radial', color: 'rgba(244, 63, 94, 0.4)' });
        break;
      case 69:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 90, height: 26, angle: 0.1, color: '#f59e0b', restitution: 1.85 });
        break;
      case 70:
        portals.push({ id: oId, posA: { x, y }, posB: { x: x - 220, y: y - 40 }, radius: 42, color: '#ec4899', angleA: 0, angleB: 0 });
        break;
      case 71:
        forceZones.push({ id: oId, x: x - 40, y: y - 80, width: 80, height: 160, force: { x: 0, y: 0.85 }, color: 'rgba(239, 68, 68, 0.18)' });
        break;
      case 72:
        forceZones.push({ id: oId, x: x - 40, y: y - 80, width: 80, height: 160, force: { x: 0, y: -0.85 }, color: 'rgba(34, 197, 94, 0.18)' });
        break;
      case 73:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 140, height: 10, angle: 1.57, color: '#fbbf24', restitution: 1.45 });
        break;
      case 74:
        gravityFields.push({ id: oId, position: { x, y }, radius: 130, strength: -0.05, type: 'radial', color: 'rgba(45, 212, 191, 0.2)' });
        break;
      case 75:
        forceZones.push({ id: oId, x: x - 30, y: y - 120, width: 60, height: 240, force: { x: 0, y: -0.98 }, color: 'rgba(6, 182, 212, 0.25)' });
        break;
      case 76:
        fluids.push({ id: oId, x: x - 50, y: y - 50, width: 100, height: 100, density: 1.9, dragCoefficient: 0.38, color: 'rgba(249, 115, 22, 0.55)' });
        break;
      case 77:
        fluids.push({ id: oId, x: x - 60, y: y - 40, width: 120, height: 80, density: 0.88, dragCoefficient: 0.005, color: 'rgba(14, 165, 233, 0.2)' });
        break;
      case 78:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 80, height: 80, angle: 0.78, color: '#d946ef', restitution: 1.75 });
        break;
      case 79:
        gravityFields.push({ id: oId, position: { x, y }, radius: 95, strength: -0.06, type: 'radial', color: 'rgba(255, 255, 255, 0.25)' });
        break;
      case 80:
        gravityFields.push({ id: oId, position: { x, y }, radius: 180, strength: -19.5, type: 'radial', color: 'rgba(0, 0, 0, 0.7)' });
        break;
      case 81:
        interactives.push({ id: oId, type: 'spike', position: { x, y }, color: '#a855f7', isTriggered: false });
        break;
      case 82:
        gravityFields.push({ id: oId, position: { x, y }, radius: 140, strength: -9.8, type: 'vortex', color: 'rgba(244, 63, 94, 0.45)' });
        break;
      case 83:
        fluids.push({ id: oId, x: x - 60, y: y - 60, width: 120, height: 120, density: 0.95, dragCoefficient: 0.88, color: 'rgba(100, 116, 139, 0.4)' });
        break;
      case 84:
        forceZones.push({ id: oId, x: x - 70, y: y - 70, width: 140, height: 140, force: { x: -0.3, y: -0.3 }, color: 'rgba(239, 68, 68, 0.22)' });
        break;
      case 85:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 190, height: 15, angle: 0, color: '#f43f5e', restitution: 1.62 });
        break;
      case 86:
        interactives.push({ id: oId, type: 'star', position: { x, y }, color: '#38bdf8', isTriggered: false });
        break;
      case 87:
        gravityFields.push({ id: oId, position: { x, y }, radius: 160, strength: -7.5, type: 'directional', direction: { x: 0.8, y: -0.2 }, color: 'rgba(251, 146, 60, 0.3)' });
        break;
      case 88:
        obstacles.push({ id: oId, shape: 'box', position: { x, y }, width: 220, height: 10, angle: 0, color: '#e2e8f0', restitution: 0.25 });
        break;
      case 89:
        obstacles.push({ id: `spinner_${oId}`, shape: 'box', position: { x, y }, width: 120, height: 16, angle: rng.next() * Math.PI, color: '#a855f7', restitution: 1.15 });
        break;
      case 90:
      default:
        obstacles.push({ id: oId, shape: 'circle', position: { x, y }, radius: 18, angle: 0, color: '#eab308', restitution: 1.30 });
        break;
    }
  };

  const densityCount = rng.range(12, 18);
  for (let i = 0; i < densityCount; i++) {
    const x = rng.range(220, 780);
    const y = rng.range(120, 480);
    const itemType = rng.range(0, 91);
    placeWackyObject(itemType, x, y);
  }

  interactives.push({
    id: 'chaos_star_mandatory',
    type: 'star',
    position: { x: rng.range(400, 600), y: rng.range(200, 400) },
    color: '#fbbf24',
    isTriggered: false
  });

  return {
    id: 9999,
    name: `Chaos Level: ${getRandomChaosName(id, rng)}`,
    theme: '🔥 Chaos Crucible',
    gravity: { x: (rng.next() - 0.5) * 0.3, y: rng.range(10, 35) / 100 },
    wind: { x: (rng.next() - 0.5) * 0.16, y: 0 },
    startPosition,
    goal: { position: goalPosition, radius: 28, color: 'rgba(244, 63, 94, 0.5)' },
    obstacles,
    portals,
    gravityFields,
    fluids,
    forceZones,
    interactives,
    goldTime: 12.0,
    silverTime: 24.0,
    bronzeTime: 42.0
  };
}

function getRandomChaosName(id: number, rng: SeededRandom): string {
  const wordsA = ['Wobbly', 'Turbulent', 'Hyper-Elastic', 'Oscillating', 'Phasing', 'Warped', 'Slippery', 'Seismic', 'Magnetic', 'Anomalous'];
  const wordsB = ['Vortex', 'Sling-Shot', 'Singularity', 'Mudslide', 'Bumper', 'Trampoline', 'Lethal Gate', 'Black Hole', 'Gravity Slip', 'Trio Pin'];
  return `${rng.pick(wordsA)} ${rng.pick(wordsB)}`;
}

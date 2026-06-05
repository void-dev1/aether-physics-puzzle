/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2D, PhysicsBody, LevelConfig, Portal, GravityField, FluidBody, ForceZone, InteractiveElement, Obstacle } from '../types';

// Robust 2D Vector Math Utilities
export const vec = {
  create: (x = 0, y = 0): Vector2D => ({ x, y }),
  add: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  scale: (v: Vector2D, s: number): Vector2D => ({ x: v.x * s, y: v.y * s }),
  dot: (v1: Vector2D, v2: Vector2D): number => v1.x * v2.x + v1.y * v2.y,
  cross: (v1: Vector2D, v2: Vector2D): number => v1.x * v2.y - v1.y * v2.x,
  len: (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y),
  dist: (v1: Vector2D, v2: Vector2D): number => Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2),
  norm: (v: Vector2D): Vector2D => {
    const l = Math.sqrt(v.x * v.x + v.y * v.y);
    return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
  },
  lerp: (v1: Vector2D, v2: Vector2D, t: number): Vector2D => ({
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t,
  }),
  rotate: (v: Vector2D, angle: number): Vector2D => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  }
};

export interface CollisionManifold {
  collided: boolean;
  normal: Vector2D;
  penetration: number;
}

export class CustomPhysicsEngine {
  public gravity: Vector2D;
  public bodies: PhysicsBody[] = [];
  public width = 1000;
  public height = 650;
  public isZeroGravity = false;
  public hasFirstLaunched = false;
  
  // Custom Scientific Live Overrides
  public gravityMultiplierY = 1.0;
  public gravityMultiplierX = 0.0;
  public restitutionMultiplier = 1.0;
  public frictionMultiplier = 1.0;
  public fluidViscosityMultiplier = 1.0;
  public fluidBuoyancyMultiplier = 1.0;
  public collisionImpulseMultiplier = 1.0;
  public windMultiplierX = 1.0;
  public windMultiplierY = 1.0;
  public boundaryElasticity: number | null = null;
  public quantumVibrations = 0.0;
  public atmosphereDensity = 1.0;
  
  // Advanced Live Scientific Fields
  public simulationClock = 0.0;
  public gravitationalWaveAmplitude = 0.0;
  public gravitationalWaveFrequency = 1.0;
  public thermodynamicHeat = 0.0;
  public magneticFieldCurl = 0.0;
  public darkEnergyExpansion = 0.0;
  public timeDilationScale = 1.0;
  
  // Custom Object Overrides
  public objectRules: Record<string, { isLethal?: boolean; isBouncy?: boolean; restitution?: number; disableFunction?: boolean; magneticPull?: boolean }> = {
    'laser': { isLethal: true, disableFunction: false, restitution: 0.5 },
    'spike': { isLethal: true, disableFunction: false, restitution: 0.5 },
    'button': { disableFunction: false },
    'door': { disableFunction: false }
  };
  public obstacleRestitutionMod = 1.0;
  public obstacleFrictionMod = 1.0;

  // Extra scientific fields
  public blackHoleFactor = 0.0;
  public centrifugalVortex = 0.0;
  public antiMatterShield = 0.0;
  public shatterOnExtremeTemp = false;
  public newtonianGConstant = 1.0;
  public planckConstantScale = 1.0;
  public subSteps = 2; // Default collision accuracy

  private accumulator = 0;
  private readonly fixedTimeStep = 1 / 60; // 60hz physics tick rate

  // Audio callback to trigger game sounds
  private onCollisionSound?: (type: 'bounce' | 'portal' | 'button' | 'goal' | 'reset' | 'laser') => void;
  private onCollisionEvent?: (x: number, y: number, type: 'bounce' | 'portal' | 'button' | 'goal' | 'reset' | 'laser', color?: string) => void;
  public onResetHandled?: () => void;

  constructor(gravity: Vector2D = { x: 0, y: 0.25 }) {
    this.gravity = gravity;
  }

  public setSoundHandler(handler: (type: 'bounce' | 'portal' | 'button' | 'goal' | 'reset' | 'laser') => void) {
    this.onCollisionSound = handler;
  }

  public setCollisionHandler(handler: (x: number, y: number, type: 'bounce' | 'portal' | 'button' | 'goal' | 'reset' | 'laser', color?: string) => void) {
    this.onCollisionEvent = handler;
  }

  public update(dt: number, level: LevelConfig, onGoalReached: (playerId: string) => void) {
    // Cap DT to prevent massive jumps when screen loses focus
    const frameTime = Math.min(dt, 0.1);
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedTimeStep) {
      const steps = Math.max(1, Math.min(16, this.subSteps));
      const subDt = this.fixedTimeStep / steps;
      for (let i = 0; i < steps; i++) {
        this.step(subDt, level, onGoalReached);
      }
      this.accumulator -= this.fixedTimeStep;
    }
  }

  private step(dt: number, level: LevelConfig, onGoalReached: (playerId: string) => void) {
    this.simulationClock += dt;
    // Freeze physics if launch hasn't been triggered yet (stay in air until player taps/drags)
    if (!this.hasFirstLaunched) {
      for (const body of this.bodies) {
        if (body.type === 'dynamic') {
          body.velocity = vec.create(0, 0);
          body.acceleration = vec.create(0, 0);
          body.trail = []; // Keep trail empty when suspended
        }
      }
    }

    // 1. Apply Environmental Forces
    for (const body of this.bodies) {
      if (body.type !== 'dynamic') continue;

      // Reset forces and add standard forces
      body.acceleration = vec.create(0, 0);

      // Thermal Zone interactions
      if (level.thermalZones) {
        for (const zone of level.thermalZones) {
          if (
            body.position.x >= zone.x &&
            body.position.x <= zone.x + zone.width &&
            body.position.y >= zone.y &&
            body.position.y <= zone.y + zone.height
          ) {
            body.temperature = (body.temperature ?? 20) + zone.tempChangeRate * dt * 10;
          }
        }
      }

      // Decelerate powerup active timers
      if (body.speedBoostTimer && body.speedBoostTimer > 0) {
        body.speedBoostTimer = Math.max(0, body.speedBoostTimer - dt);
      }
      if (body.shrinkTimer && body.shrinkTimer > 0) {
        body.shrinkTimer = Math.max(0, body.shrinkTimer - dt);
      }
      if (body.gravityInverterTimer && body.gravityInverterTimer > 0) {
        body.gravityInverterTimer = Math.max(0, body.gravityInverterTimer - dt);
      }
      if (body.shieldActiveTimer && body.shieldActiveTimer > 0) {
        body.shieldActiveTimer = Math.max(0, body.shieldActiveTimer - dt);
      }
      if (body.ghostModeTimer && body.ghostModeTimer > 0) {
        body.ghostModeTimer = Math.max(0, body.ghostModeTimer - dt);
      }

      // Dynamic physical radius scaling
      if (body.shrinkTimer && body.shrinkTimer > 0) {
        body.radius = 7;
      } else {
        body.radius = 14; // Default standard sphere
      }

      // Inverse gravity calculation if inverter is active
      let localGravity = (body.gravityInverterTimer && body.gravityInverterTimer > 0)
        ? vec.scale(level.gravity, -1.0)
        : level.gravity;

      // Force absolute zero gravity if zero-G active
      if (this.isZeroGravity) {
        localGravity = vec.create(0, 0);
      } else {
        // Apply custom live laboratory gravity overrides
        localGravity = vec.create(
          localGravity.x + (this.gravityMultiplierX * 0.25),
          localGravity.y * this.gravityMultiplierY
        );
      }

      // Scale gravity by Newtonian Constant G
      localGravity = vec.scale(localGravity, this.newtonianGConstant);

      // Gravitational Wave Oscillation field override
      if (this.gravitationalWaveAmplitude > 0) {
        const waveOffset = Math.sin(this.simulationClock * this.gravitationalWaveFrequency) * this.gravitationalWaveAmplitude * 0.12;
        localGravity = vec.add(localGravity, vec.create(0, waveOffset));
      }

      body.acceleration = vec.add(body.acceleration, localGravity);

      // Schwarzschild Singularity Pull (Black Hole)
      if (this.blackHoleFactor > 0) {
        const singularityCenter = vec.create(500, 325);
        const diff = vec.sub(singularityCenter, body.position);
        const distance = vec.len(diff);
        if (distance > 10) {
          const forceDir = vec.norm(diff);
          // Inverse square law pull
          const pull = (this.blackHoleFactor * 1400) / (distance * distance + 500);
          body.acceleration = vec.add(body.acceleration, vec.scale(forceDir, pull));
        }
      }

      // Centrifugal Rotational Vortex Field
      if (this.centrifugalVortex !== 0) {
        const center = vec.create(500, 325);
        const diff = vec.sub(body.position, center);
        const distance = vec.len(diff);
        if (distance > 10) {
          const dir = vec.norm(diff);
          const tangent = vec.create(-dir.y, dir.x);
          const vortexStrength = this.centrifugalVortex * 0.22;
          body.acceleration = vec.add(body.acceleration, vec.scale(tangent, vortexStrength));
        }
      }

      // Anti-Matter Edge repulsive pressure
      if (this.antiMatterShield > 0) {
        const repelLeft = Math.max(0, 150 - body.position.x);
        const repelRight = Math.max(0, body.position.x - (this.width - 150));
        const repelTop = Math.max(0, 150 - body.position.y);
        const repelBottom = Math.max(0, body.position.y - (this.height - 150));
        
        if (repelLeft > 0) body.acceleration.x += repelLeft * this.antiMatterShield * 0.08;
        if (repelRight > 0) body.acceleration.x -= repelRight * this.antiMatterShield * 0.08;
        if (repelTop > 0) body.acceleration.y += repelTop * this.antiMatterShield * 0.08;
        if (repelBottom > 0) body.acceleration.y -= repelBottom * this.antiMatterShield * 0.08;
      }

      // Global level wind
      body.acceleration = vec.add(body.acceleration, vec.create(
        level.wind.x * this.windMultiplierX,
        level.wind.y * this.windMultiplierY
      ));

      // Atmospheric drag
      if (this.atmosphereDensity > 0.01) {
        const currentSpeed = vec.len(body.velocity);
        if (currentSpeed > 0.01) {
          const atmosphericDrag = vec.scale(body.velocity, -0.004 * this.atmosphereDensity);
          body.acceleration = vec.add(body.acceleration, atmosphericDrag);
        }
      }

      // Thermodynamic Heat motion entropy (Brownian kinetic vibration)
      if (this.thermodynamicHeat > 0) {
        const heatForce = vec.create(
          (Math.random() - 0.5) * this.thermodynamicHeat * 0.035,
          (Math.random() - 0.5) * this.thermodynamicHeat * 0.035
        );
        body.acceleration = vec.add(body.acceleration, heatForce);
      }

      // Magnetic Field Curl drift force (Lorentz-force curling)
      if (this.magneticFieldCurl !== 0) {
        const speed = vec.len(body.velocity);
        if (speed > 0.01) {
          const normVel = vec.norm(body.velocity);
          const curlForce = vec.create(-normVel.y, normVel.x); // perpendicular curl vector
          body.acceleration = vec.add(body.acceleration, vec.scale(curlForce, speed * this.magneticFieldCurl * 0.1));
        }
      }

      // Dark Energy cosmic space expansion outward push
      if (this.darkEnergyExpansion > 0) {
        const centerPoint = vec.create(500, 325);
        const toBody = vec.sub(body.position, centerPoint);
        const dDist = vec.len(toBody);
        if (dDist > 1) {
          const forceDir = vec.norm(toBody);
          body.acceleration = vec.add(body.acceleration, vec.scale(forceDir, dDist * this.darkEnergyExpansion * 0.0015));
        }
      }

      // Quantum jitter vibrations displacement
      if (this.quantumVibrations > 0) {
        if (Math.random() < 0.15) {
          body.position = vec.add(body.position, vec.create(
            (Math.random() - 0.5) * this.quantumVibrations * 2.0 * this.planckConstantScale,
            (Math.random() - 0.5) * this.quantumVibrations * 2.0 * this.planckConstantScale
          ));
        }
      }

      // Apply Gravity Fields (radial attractors / repellers)
      for (const field of level.gravityFields) {
        const d = vec.sub(field.position, body.position);
        const dist = vec.len(d);
        if (dist <= field.radius && dist > 1) {
          const dir = vec.norm(d);
          if (field.type === 'radial') {
            const forceStrength = (field.strength * 50) / (dist * dist + 100);
            body.acceleration = vec.add(body.acceleration, vec.scale(dir, forceStrength));
          } else if (field.type === 'vortex') {
            const forceStrength = (field.strength * 30) / (dist + 50);
            const tangent = vec.create(-dir.y, dir.x);
            body.acceleration = vec.add(body.acceleration, vec.scale(tangent, forceStrength));
            body.acceleration = vec.add(body.acceleration, vec.scale(dir, forceStrength * 0.2)); // inward orbital drag
          } else if (field.type === 'directional' && field.direction) {
            body.acceleration = vec.add(body.acceleration, vec.scale(field.direction, field.strength));
          }
        }
      }

      // Apply Wind Force Zones (wind turbines)
      for (const zone of level.forceZones) {
        if (
          body.position.x >= zone.x &&
          body.position.x <= zone.x + zone.width &&
          body.position.y >= zone.y &&
          body.position.y <= zone.y + zone.height
        ) {
          if (zone.type === 'fan') {
            // Apply oscillating fan gusts
            const gust = Math.sin(this.simulationClock * 10) * 0.5 + 0.5; // 0 to 1 pulsating
            body.acceleration = vec.add(body.acceleration, vec.scale(zone.force, gust));
          } else {
             body.acceleration = vec.add(body.acceleration, zone.force);
          }
        }
      }

      // Apply Fluid Buoyancy and Quadratic Drag
      body.isWaterBuoy = false;
      for (const fluid of level.fluids) {
        // Submerge calculation (assume body circle is deep inside AABB box)
        if (body.shape === 'circle' && body.radius) {
          const ballLeft = body.position.x - body.radius;
          const ballRight = body.position.x + body.radius;
          const ballTop = body.position.y - body.radius;
          const ballBottom = body.position.y + body.radius;

          const fluidLeft = fluid.x;
          const fluidRight = fluid.x + fluid.width;
          const fluidTop = fluid.y;
          const fluidBottom = fluid.y + fluid.height;

          // Check intersection
          if (
            ballRight > fluidLeft &&
            ballLeft < fluidRight &&
            ballBottom > fluidTop &&
            ballTop < fluidBottom
          ) {
            body.isWaterBuoy = true;

            if (fluid.type === 'lava') {
              if (body.shieldActiveTimer && body.shieldActiveTimer > 0) {
                // Shield protects from lava
              } else {
                 // Lethal heat! Reset ball
                 this.onResetHandled?.();
                 body.position = { ...level.startPosition };
                 body.velocity = vec.create(0, 0);
                 continue;
              }
            } else if (fluid.type === 'liquid_nitrogen') {
              // Rapid freeze! Slow down drastically
              body.velocity = vec.scale(body.velocity, 0.95);
            } else if (fluid.type === 'acid') {
               // Acid drift
               if (!body.shieldActiveTimer || body.shieldActiveTimer <= 0) {
                 this.onResetHandled?.();
                 body.position = { ...level.startPosition };
                 body.velocity = vec.create(0, 0);
                 continue;
               }
            }

            // Percentage submerged estimation
            const heightInFluid = Math.min(ballBottom, fluidBottom) - Math.max(ballTop, fluidTop);
            const ratioSubmerged = Math.max(0, Math.min(1, heightInFluid / (body.radius * 2)));

            // Buoyant force acting upward: force = fluid_density * submerged_volume * local_gravity
            const buoyantMagnitude = uuidDensityForce(fluid.density * this.fluidBuoyancyMultiplier, ratioSubmerged, body.mass);
            const buoyantForce = vec.create(0, -buoyantMagnitude);
            body.acceleration = vec.add(body.acceleration, buoyantForce);

            // Viscous resistance of fluid (quadratic damping)
            const speed = vec.len(body.velocity);
            if (speed > 0.05) {
              const dragDir = vec.scale(vec.norm(body.velocity), -1);
              const dragMagnitude = 0.5 * fluid.dragCoefficient * this.fluidViscosityMultiplier * fluid.density * (body.radius * 2) * speed * speed;
              body.acceleration = vec.add(body.acceleration, vec.scale(dragDir, Math.min(dragMagnitude, speed * 2)));
            }
          }
        }
      }

      // Update linear velocity (Frame discretized step logic: 1.0 per frame)
      body.velocity = vec.add(body.velocity, body.acceleration);

      // Velocity thresholds / terminal speedcap in space or atmosphere
      const maxSpeed = body.isWaterBuoy ? 6 : (body.speedBoostTimer && body.speedBoostTimer > 0 ? 56 : 28);
      const speed = vec.len(body.velocity);
      if (speed > maxSpeed) {
        body.velocity = vec.scale(body.velocity, maxSpeed / speed);
      }
    }

    // Kinematic platforms pacing motion (moving gears & hazards)
    for (const body of this.bodies) {
      if (body.type === 'kinematic') {
        if (body.originalY !== undefined) {
          // Sinusoidal vertical movement
          const time = Date.now() / 1000;
          const targetY = body.originalY + Math.sin(time * 2) * 80;
          body.velocity = vec.create(0, targetY - body.position.y);
          body.position.y = targetY;
        }
      }
    }

    // 2. Integration: Update Positions
    for (const body of this.bodies) {
      if (body.type === 'static') continue;
      
      // Thermodynamics Update
      if (body.temperature !== undefined && body.baseRadius !== undefined) {
        // Temperature slowly normalizes to standard ambient 20C
        body.temperature += (20 - body.temperature) * 0.005;
        const tempDiff = body.temperature - 20;
        
        // Heat causes volumetric expansion; Cold shrinks it.
        body.radius = Math.max(5, body.baseRadius + tempDiff * 0.15); // min size of 5px
      }

      if (body.type !== 'kinematic') {
        body.position = vec.add(body.position, body.velocity);
        body.angle += body.angularVelocity;
      }
    }

    // 3. Portal Warps: Teleportation Mechanics
    const portalCooldowns = new Set<string>();
    for (const body of this.bodies) {
      if (body.type !== 'dynamic') continue;

      for (const portal of level.portals) {
        const distA = vec.dist(body.position, portal.posA);
        const distB = vec.dist(body.position, portal.posB);

        // Check entry into Portal A
        if (distA < portal.radius) {
          // Teleport to Portal B
          body.position = { ...portal.posB };
          // Rotate velocity vector based on portals angles differential
          const speed = vec.len(body.velocity);
          const outAngle = portal.angleB;
          body.velocity = vec.create(Math.cos(outAngle) * speed, Math.sin(outAngle) * speed);

          this.onCollisionSound?.('portal');
          break; // only one warp per step
        }
        // Check entry into Portal B
        else if (distB < portal.radius) {
          // Teleport to Portal A
          body.position = { ...portal.posA };
          // Rotate velocity vector based on portals angles differential
          const speed = vec.len(body.velocity);
          const outAngle = portal.angleA;
          body.velocity = vec.create(Math.cos(outAngle) * speed, Math.sin(outAngle) * speed);

          this.onCollisionSound?.('portal');
          break;
        }
      }
    }

    // 4. Collision Manifests Resolve
    this.resolveBoundaries();
    this.resolveDynamicCollisions(level);

    // 5. Check interactive environment triggers
    this.resolveInteractiveTriggers(level);

    // Update Interactive Elements Rotation
    for (const item of level.interactives) {
      if (item.angularVelocity) {
        item.angle = (item.angle || 0) + item.angularVelocity;
        item.angularVelocity *= 0.95; // apply friction/damping
        if (Math.abs(item.angularVelocity) < 0.001) item.angularVelocity = 0;
      }
    }

    // 6. Check Level Goal Target
    for (const body of this.bodies) {
      if (body.type === 'dynamic') {
        const distToGoal = vec.dist(body.position, level.goal.position);
        if (distToGoal <= level.goal.radius + (body.radius ?? 15)) {
          this.onCollisionSound?.('goal');
          onGoalReached(body.id);
        }
      }
    }

    // 7. Record visual trace trails at the end of the frame (Fully resolved & corrected coordinates!)
    for (const body of this.bodies) {
      if (body.type === 'static') continue;
      body.trail.push({ ...body.position });
      if (body.trail.length > 25) {
        body.trail.shift();
      }
    }
  }

  private resolveBoundaries() {
    for (const body of this.bodies) {
      if (body.type !== 'dynamic') continue;
      if (body.shape === 'circle' && body.radius) {
        const r = body.radius;
        const rest = this.boundaryElasticity !== null ? this.boundaryElasticity : (body.restitution * this.restitutionMultiplier);
        const frict = Math.max(0, Math.min(1.0, body.friction * this.frictionMultiplier));

        // Floor Collisions
        if (body.position.y > this.height - r) {
          body.position.y = this.height - r;
          body.velocity.y *= -rest;
          body.velocity.x *= (1 - frict);
          if (Math.abs(body.velocity.y) > 0.5) {
            this.onCollisionSound?.('bounce');
            this.onCollisionEvent?.(body.position.x, body.position.y, 'bounce', body.color);
            if (Math.abs(body.velocity.y) > 3.5 && typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(15);
            }
          }
        }
        // Ceiling Collisions
        if (body.position.y < r) {
          body.position.y = r;
          body.velocity.y *= -rest;
          body.velocity.x *= (1 - frict);
          if (Math.abs(body.velocity.y) > 0.5) {
            this.onCollisionSound?.('bounce');
            this.onCollisionEvent?.(body.position.x, body.position.y, 'bounce', body.color);
            if (Math.abs(body.velocity.y) > 3.5 && typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(15);
            }
          }
        }
        // Wall left
        if (body.position.x < r) {
          body.position.x = r;
          body.velocity.x *= -rest;
          body.velocity.y *= (1 - frict);
          if (Math.abs(body.velocity.x) > 0.5) {
            this.onCollisionSound?.('bounce');
            this.onCollisionEvent?.(body.position.x, body.position.y, 'bounce', body.color);
            if (Math.abs(body.velocity.x) > 3.5 && typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(15);
            }
          }
        }
        // Wall right
        if (body.position.x > this.width - r) {
          body.position.x = this.width - r;
          body.velocity.x *= -rest;
          body.velocity.y *= (1 - frict);
          if (Math.abs(body.velocity.x) > 0.5) {
            this.onCollisionSound?.('bounce');
            this.onCollisionEvent?.(body.position.x, body.position.y, 'bounce', body.color);
            if (Math.abs(body.velocity.x) > 3.5 && typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(15);
            }
          }
        }
      }
    }
  }

  private resolveDynamicCollisions(level: LevelConfig) {
    // Collect all collidable entities (including standard moving bodies & static level obstacles)
    for (const body of this.bodies) {
      if (body.type !== 'dynamic') continue;

      // Collisions against other dynamic bodies (PvP rooms interaction)
      for (const other of this.bodies) {
        if (body.id === other.id) continue;
        if (body.shape === 'circle' && other.shape === 'circle' && body.radius && other.radius) {
          const manifold = this.checkCircleToCircle(body, other);
          if (manifold.collided) {
            this.applyImpulseCollision(body, other, manifold);
          }
        }
      }

      // Collisions against Level Obstacles
      for (const obs of level.obstacles) {
        // If obstacle is active/collidable (e.g., doors that haven't been unlocked stay solid. Triggered doors are open and non-solid)
        if (obs.width === 0 || obs.height === 0) continue;

        if (obs.shape === 'box' && obs.width && obs.height) {
          const manifold = this.checkCircleToBox(body, obs);
          if (manifold.collided) {
            // Treat obstacle as infinite mass static physics body
            const dummyStatic: PhysicsBody = {
              id: obs.id,
              type: 'static',
              shape: 'box',
              position: obs.position,
              velocity: vec.create(0, 0),
              acceleration: vec.create(0, 0),
              mass: Infinity,
              inverseMass: 0,
              restitution: (obs.restitution ?? 0.6) * this.obstacleRestitutionMod,
              friction: 0.1 * this.obstacleFrictionMod,
              width: obs.width,
              height: obs.height,
              angle: obs.angle,
              angularVelocity: 0,
              color: obs.color,
              trail: []
            };

            this.applyImpulseCollision(body, dummyStatic, manifold);
          }
        } else if (obs.shape === 'circle' && obs.radius) {
          const manifold = this.checkCircleToStaticCircle(body, obs);
          if (manifold.collided) {
            const dummyCircle: PhysicsBody = {
              id: obs.id,
              type: 'static',
              shape: 'circle',
              position: obs.position,
              velocity: vec.create(),
              acceleration: vec.create(),
              mass: Infinity,
              inverseMass: 0,
              restitution: (obs.restitution ?? 0.8) * this.obstacleRestitutionMod,
              friction: 0.05 * this.obstacleFrictionMod,
              radius: obs.radius,
              angle: obs.angle,
              angularVelocity: 0,
              color: obs.color,
              trail: []
            };
            this.applyImpulseCollision(body, dummyCircle, manifold);
          }
        }
      }
    }
  }

  private applyImpulseCollision(body: PhysicsBody, other: PhysicsBody, manifold: CollisionManifold) {
    const normal = manifold.normal;

    // Relative velocity
    const rv = vec.sub(body.velocity, other.velocity);

    // Velocity along normal
    const velAlongNormal = vec.dot(rv, normal);

    // Do not resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Minimum restitution with custom scientific laboratory multiplier override
    // Thermodynamics: Heat increases elasticity. Cold reduces it (makes it brittle).
    let tempMod = 1.0;
    if (body.temperature !== undefined) {
       tempMod += (body.temperature - 20) * 0.01;
    }
    let e = Math.min(body.restitution, other.restitution) * this.restitutionMultiplier * Math.max(0.1, tempMod);
    e = Math.max(0, Math.min(1.8, e)); // Keep it in stable extreme range

    // Scalar impulse with custom amplification multiplier
    let j = -(1 + e) * velAlongNormal;
    j /= (body.inverseMass + other.inverseMass);
    j *= this.collisionImpulseMultiplier;

    // Apply impulse
    const impulse = vec.scale(normal, j);

    if (body.type === 'dynamic') {
      body.velocity = vec.add(body.velocity, vec.scale(impulse, body.inverseMass));
    }
    if (other.type === 'dynamic') {
      other.velocity = vec.sub(other.velocity, vec.scale(impulse, other.inverseMass));
    }

    // Positional corrective displacement (solves overlapping visual sinking)
    const percent = 0.55; // penetration percentage solved
    const slop = 0.01; // penetration allowance
    const correctionMagnitude = Math.max(0, manifold.penetration - slop) / (body.inverseMass + other.inverseMass) * percent;
    const correction = vec.scale(normal, correctionMagnitude);

    if (body.type === 'dynamic') {
      body.position = vec.add(body.position, vec.scale(correction, body.inverseMass));
      
      // Extreme thermal shattering/reset
      if (this.shatterOnExtremeTemp && (body.temperature ?? 20) > 80 || (body.temperature ?? 20) < -40) {
        this.onCollisionSound?.('reset');
        this.onCollisionEvent?.(body.position.x, body.position.y, 'reset', '#ef4444');
        this.onResetHandled?.();
      }
    }
    if (other.type === 'dynamic') {
      other.position = vec.sub(other.position, vec.scale(correction, other.inverseMass));
      
      // Extreme thermal shattering/reset (for other body)
      if (this.shatterOnExtremeTemp && (other.temperature ?? 20) > 80 || (other.temperature ?? 20) < -40) {
        this.onCollisionSound?.('reset');
        this.onCollisionEvent?.(other.position.x, other.position.y, 'reset', '#ef4444');
        this.onResetHandled?.();
      }
    }

    // Sound and particle, vibration alert
    if (Math.abs(velAlongNormal) > 0.4) {
      this.onCollisionSound?.('bounce');
      // Calculate contact approximate coordinate for nice particle explosion centering
      const contactX = body.position.x - normal.x * (body.radius ?? 14);
      const contactY = body.position.y - normal.y * (body.radius ?? 14);
      this.onCollisionEvent?.(contactX, contactY, 'bounce', body.color);

      if (Math.abs(velAlongNormal) > 3.0 && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }

  private checkCircleToCircle(c1: PhysicsBody, c2: PhysicsBody): CollisionManifold {
    const result: CollisionManifold = { collided: false, normal: vec.create(), penetration: 0 };
    if (!c1.radius || !c2.radius) return result;

    const d = vec.sub(c2.position, c1.position);
    const dist = vec.len(d);
    const radiusSum = c1.radius + c2.radius;

    if (dist >= radiusSum) return result;

    result.collided = true;
    if (dist === 0) {
      result.penetration = c1.radius;
      result.normal = vec.create(0, -1);
    } else {
      result.penetration = radiusSum - dist;
      result.normal = vec.scale(d, 1 / dist); // point from A to B
    }

    return result;
  }

  private checkCircleToStaticCircle(c1: PhysicsBody, c2: Obstacle): CollisionManifold {
    const result: CollisionManifold = { collided: false, normal: vec.create(), penetration: 0 };
    if (!c1.radius || !c2.radius) return result;

    const d = vec.sub(c2.position, c1.position);
    const dist = vec.len(d);
    const radiusSum = c1.radius + c2.radius;

    if (dist >= radiusSum) return result;

    result.collided = true;
    if (dist === 0) {
      result.penetration = c1.radius;
      result.normal = vec.create(0, -1);
    } else {
      result.penetration = radiusSum - dist;
      result.normal = vec.scale(d, 1 / dist);
    }

    return result;
  }

  private checkCircleToBox(circle: PhysicsBody, box: Obstacle | PhysicsBody): CollisionManifold {
    const result: CollisionManifold = { collided: false, normal: vec.create(0, 0), penetration: 0 };
    const r = circle.radius ?? 15;
    const boxW = (box.width ?? 0);
    const boxH = (box.height ?? 0);

    // Handle unrotated vs rotated Box
    const angle = box.angle;
    let localCirclePos = { ...circle.position };

    if (angle !== 0) {
      // Translate circle coordinate system relative to box center & angle rotation
      const dPos = vec.sub(circle.position, box.position);
      const rotated = vec.rotate(dPos, -angle);
      localCirclePos = vec.add(box.position, rotated);
    }

    // Find the closest point on AABB to Circle center
    const x = Math.max(box.position.x - boxW / 2, Math.min(localCirclePos.x, box.position.x + boxW / 2));
    const y = Math.max(box.position.y - boxH / 2, Math.min(localCirclePos.y, box.position.y + boxH / 2));

    // Distance vector
    const dx = localCirclePos.x - x;
    const dy = localCirclePos.y - y;
    const distSq = dx * dx + dy * dy;

    if (distSq >= r * r) return result;

    const dist = Math.sqrt(distSq);
    result.collided = true;
    result.penetration = r - dist;

    let localNormal = vec.create(0, -1);
    if (dist > 0) {
      localNormal = vec.create(dx / dist, dy / dist);
    } else {
      // Circle center is inside box. Select axis of least penetration
      const dl = localCirclePos.x - (box.position.x - boxW / 2);
      const dr = (box.position.x + boxW / 2) - localCirclePos.x;
      const dt = localCirclePos.y - (box.position.y - boxH / 2);
      const db = (box.position.y + boxH / 2) - localCirclePos.y;

      const minVal = Math.min(dl, dr, dt, db);
      if (minVal === dl) localNormal = vec.create(-1, 0);
      else if (minVal === dr) localNormal = vec.create(1, 0);
      else if (minVal === dt) localNormal = vec.create(0, -1);
      else localNormal = vec.create(0, 1);

      result.penetration = r + minVal;
    }

    // Convert localNormal back to global world coordinate coordinates
    if (angle !== 0) {
      result.normal = vec.rotate(localNormal, angle);
    } else {
      result.normal = { ...localNormal };
    }

    return result;
  }

  private resolveInteractiveTriggers(level: LevelConfig) {
    for (const body of this.bodies) {
      if (body.type !== 'dynamic') continue;

      for (const item of level.interactives) {
        // --- Magnetic Pull Override ---
        if (this.objectRules[item.type]?.magneticPull && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist > 0 && dist < 300) {
            const pullForce = 150 / (dist * dist); // Inverse square pull
            const pullDir = vec.norm(vec.sub(item.position, body.position));
            body.acceleration = vec.add(body.acceleration, vec.scale(pullDir, pullForce * 0.5));
          }
        }

        // Laser segments reset ball instantly to start position
        // Laser segments reset ball instantly to start position
        if (item.type === 'laser' && !item.isTriggered) {
          if (this.objectRules['laser']?.disableFunction) continue;
          if ((body.ghostModeTimer && body.ghostModeTimer > 0) || (body.shieldActiveTimer && body.shieldActiveTimer > 0)) {
            continue; // Immune to laser because of active shield or ghost phasing!
          }
          // Check box line projection intersection
          const isLethalHit = checkCircleLineIntersection(body.position, body.radius ?? 15, item.position, item.width ?? 0, item.height ?? 0);
          if (isLethalHit) {
            if (this.objectRules['laser']?.isLethal !== false) {
              body.position = { ...level.startPosition };
              body.velocity = vec.create(0, 0);
              this.onCollisionSound?.('laser');
              this.onResetHandled?.();
            } else if (this.objectRules['laser']?.isBouncy) {
               // Perform a bouncy collision
               const bounceNormal = vec.sub(body.position, item.position);
               const len = vec.len(bounceNormal);
               if (len > 0) {
                 const norm = vec.norm(bounceNormal);
                 const vDot = vec.dot(body.velocity, norm);
                 const rest = this.objectRules['laser']?.restitution ?? 0.8;
                 if (vDot < 0) {
                    body.velocity = vec.sub(body.velocity, vec.scale(norm, (1 + rest) * vDot));
                 }
               }
            }
          }
        }

        // Spike segments reset ball
        else if (item.type === 'spike') {
          if (this.objectRules['spike']?.disableFunction) continue;
          if ((body.ghostModeTimer && body.ghostModeTimer > 0) || (body.shieldActiveTimer && body.shieldActiveTimer > 0)) {
            continue; // Immune to spike traps!
          }
          const distance = vec.dist(body.position, item.position);
          if (distance <= (body.radius ?? 15) + 12) {
            if (this.objectRules['spike']?.isLethal !== false) {
              body.position = { ...level.startPosition };
              body.velocity = vec.create(0, 0);
              this.onCollisionSound?.('laser');
              this.onResetHandled?.();
            } else if (this.objectRules['spike']?.isBouncy) {
               const bounceNormal = vec.sub(body.position, item.position);
               const len = vec.len(bounceNormal);
               if (len > 0) {
                 const norm = vec.norm(bounceNormal);
                 const vDot = vec.dot(body.velocity, norm);
                 const rest = this.objectRules['spike']?.restitution ?? 0.8;
                 if (vDot < 0) {
                    body.velocity = vec.sub(body.velocity, vec.scale(norm, (1 + rest) * vDot));
                 }
               }
            }
          }
        }

        // Buttons trigger action
        else if (item.type === 'button') {
          if (this.objectRules['button']?.disableFunction) continue;
          const buttonRadius = 18;
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + buttonRadius) {
            if (!item.isTriggered) {
              item.isTriggered = true;
              this.onCollisionSound?.('button');

              // Open associated gates/doors
              if (item.targetId) {
                const targetDoor = level.obstacles.find(o => o.id === item.targetId);
                if (targetDoor && !this.objectRules['door']?.disableFunction) {
                  // visually hide & deflate physical bounds of door obstacle
                  targetDoor.width = 0;
                  targetDoor.height = 0;
                }
              }
            }
          }
        }

        // Heavy pressure buttons (require speed or high density ball block)
        else if (item.type === 'heavy_button') {
          if (this.objectRules['button']?.disableFunction) continue;
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 20) {
            const kineticEnergy = 0.5 * body.mass * vec.dot(body.velocity, body.velocity);
            if (kineticEnergy > 12 && !item.isTriggered) {
              item.isTriggered = true;
              this.onCollisionSound?.('button');

              if (item.targetId) {
                const door = level.obstacles.find(o => o.id === item.targetId);
                if (door && !this.objectRules['door']?.disableFunction) {
                  door.width = 0;
                  door.height = 0;
                }
              }
            }
          }
        }

        // Speed Boost Power-up Collectable
        else if (item.type === 'powerup_speed' && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 14) {
            item.isTriggered = true;
            body.speedBoostTimer = 5.0; // 5 seconds of speed
            const speedNow = vec.len(body.velocity);
            if (speedNow > 0.1) {
              body.velocity = vec.scale(vec.norm(body.velocity), Math.max(speedNow * 2.0, 22));
            } else {
              body.velocity = vec.create(0, -12); // launch upwards
            }
            this.onCollisionSound?.('button');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([60, 40, 60]);
            }
          }
        }

        // Size Shrink Power-up Collectable
        else if (item.type === 'powerup_shrink' && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 14) {
            item.isTriggered = true;
            body.shrinkTimer = 7.0; // 7 seconds
            this.onCollisionSound?.('button');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(50);
            }
          }
        }

        // Gravity Inverter Power-up Collectable
        else if (item.type === 'powerup_invert' && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 14) {
            item.isTriggered = true;
            body.gravityInverterTimer = 6.0; // 6 seconds
            body.velocity.y = -body.velocity.y - 3; // kick up/down
            this.onCollisionSound?.('button');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(85);
            }
          }
        }

        // Star Collectable
        else if (item.type === 'star' && !item.isTriggered) {
          if (this.objectRules['star']?.disableFunction) continue;
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 16) {
            item.isTriggered = true;
            this.onCollisionSound?.('button'); // trigger pleasant chime sound
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(35);
            }
          }
        }
        
        // Bouncy Pad (Mega Jump)
        else if (item.type === 'bouncy_pad' && !item.isTriggered) {
          const w = item.width ?? 60;
          const h = item.height ?? 20;
          const isHit = checkCircleLineIntersection(body.position, body.radius ?? 15, item.position, w, h);
          if (isHit) {
            body.velocity.y = -22; // massive jump upwards
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
            this.onCollisionSound?.('bounce');
          }
        }
        
        // Heater (Heats up ball and applies thermal jitter)
        else if (item.type === 'heater' && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + (item.width || 40)) {
            body.temperature = Math.min((body.temperature ?? 20) + 1.5, 100);
            body.velocity.x += (Math.random() - 0.5) * 5;
            body.velocity.y += (Math.random() - 0.5) * 5;
            // Angular impulse
            item.angularVelocity = (item.angularVelocity || 0) + (Math.random() - 0.5) * 0.1;
          }
        }
        
        // Freezer (Cools ball and drastically slows)
        else if (item.type === 'freezer' && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + (item.width || 40)) {
            body.temperature = Math.max((body.temperature ?? 20) - 1.5, -50);
            body.velocity = vec.scale(body.velocity, 0.9);
            // Angular impulse
            item.angularVelocity = (item.angularVelocity || 0) + (Math.random() - 0.5) * 0.1;
          }
        }
        
        // Teleporters (warp randomly nearby)
        else if (item.type === 'teleporter' && !item.isTriggered) {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 20) {
            item.isTriggered = true; // one-time use per level load!
            body.position.x += (Math.random() - 0.5) * 400;
            body.position.y += (Math.random() - 0.5) * 400;
            // keep inboundaries loosely
            body.position.x = Math.max(50, Math.min(this.width - 50, body.position.x));
            body.position.y = Math.max(50, Math.min(this.height - 50, body.position.y));
            this.onCollisionSound?.('portal');
          }
        }
        
        // Magnet (Attracts metallic bodies, we assume all bodies are metallic for now)
        else if (item.type === 'magnet') {
          if (this.objectRules['magnet']?.disableFunction) continue;
          const distSq = (body.position.x - item.position.x)**2 + (body.position.y - item.position.y)**2;
          if (distSq > 0 && distSq < 90000) { // 300px radius
            const pullForce = 2500 / distSq;
            const pullDir = vec.norm(vec.sub(item.position, body.position));
            body.acceleration = vec.add(body.acceleration, vec.scale(pullDir, pullForce));
          }
        }

        // Fan (Pushes bodies away directionally, let's assume it pushes UP for now)
        else if (item.type === 'fan') {
          if (this.objectRules['fan']?.disableFunction) continue;
          // Calculate distance on X and Y
          const dx = Math.abs(body.position.x - item.position.x);
          const dy = item.position.y - body.position.y; // positive if ball is above fan
          
          if (dx < 30 && dy > 0 && dy < 250) {
            const liftForce = (250 - dy) * 0.005;
            body.acceleration = vec.add(body.acceleration, vec.create(0, -liftForce));
          }
        }
        
        // Conveyor Belt (Translates items horizontally)
        else if (item.type === 'conveyor_belt') {
          if (this.objectRules['conveyor_belt']?.disableFunction) continue;
          const dx = Math.abs(body.position.x - item.position.x);
          const dy = body.position.y - item.position.y;
          
          if (dx < (item.width || 60)/2 && dy < 0 && dy > -((body.radius ?? 15) + 10)) {
            // Push right
            body.velocity.x += 0.8;
          }
        }
        
        // Tar pit (Drastically slows body until it gets stuck)
        else if (item.type === 'tar_pit') {
          const dist = vec.dist(body.position, item.position);
          if (dist <= (body.radius ?? 15) + 20) {
            body.velocity = vec.scale(body.velocity, 0.4);
            if (vec.len(body.velocity) < 0.1) {
              body.velocity = vec.create(0, 0); // Completely stuck!
            }
          }
        }
      }
    }
  }
}

// Helpers
function uuidDensityForce(density: number, subRatio: number, mass: number): number {
  // force = density * ratio * mass gravity factor
  return density * subRatio * 0.42 * mass;
}

function checkCircleLineIntersection(circle: Vector2D, r: number, origin: Vector2D, w: number, h: number): boolean {
  // Represents a horizontal or vertical laser ray starting from origin
  const laserEndX = origin.x + w;
  const laserEndY = origin.y + h;

  // Find closest point on line segment
  const ab = vec.create(laserEndX - origin.x, laserEndY - origin.y);
  const ac = vec.create(circle.x - origin.x, circle.y - origin.y);

  const abLenSq = ab.x * ab.x + ab.y * ab.y;
  if (abLenSq === 0) return vec.dist(circle, origin) <= r;

  let t = vec.dot(ac, ab) / abLenSq;
  t = Math.max(0, Math.min(1, t));

  const closestPoint = vec.create(origin.x + ab.x * t, origin.y + ab.y * t);
  const distance = vec.dist(circle, closestPoint);

  return distance <= r;
}

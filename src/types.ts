/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type BodyType = 'dynamic' | 'static' | 'kinematic';
export type ShapeType = 'circle' | 'box';

export interface PhysicsBody {
  id: string;
  type: BodyType;
  shape: ShapeType;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  inverseMass: number;
  restitution: number; // bounciness (0 to 1)
  friction: number; // surface resistance
  radius?: number; // for circle shapes
  width?: number; // for box shapes
  height?: number; // for box shapes
  angle: number;
  angularVelocity: number;
  color: string;
  isWaterBuoy?: boolean;
  trail: Vector2D[];
  skinId?: string;
  originalY?: number; // for kinematic pathing
  speedBoostTimer?: number; // power-up timers
  shrinkTimer?: number;
  gravityInverterTimer?: number;
  shieldActiveTimer?: number;
  ghostModeTimer?: number;
  temperature?: number;
  baseRadius?: number;
}

export interface Portal {
  id: string;
  posA: Vector2D;
  posB: Vector2D;
  radius: number;
  color: string;
  angleA: number; // injection angle out of A
  angleB: number; // injection angle out of B
}

export interface GravityField {
  id: string;
  position: Vector2D;
  radius: number;
  strength: number; // negative is attractor, positive is repeller
  type: 'radial' | 'vortex' | 'directional';
  direction?: Vector2D; // for directional fields
  color: string;
}

export interface FluidBody {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  density: number; // buoyancy factor
  dragCoefficient: number;
  color: string;
  type?: 'water' | 'lava' | 'liquid_nitrogen' | 'honey' | 'mud' | 'acid';
}

export interface ForceZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  force: Vector2D;
  color: string;
  type?: 'wind' | 'fan' | 'magnet';
}

export interface ThermalZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tempChangeRate: number; // Positive for heat, negative for cold
  color: string;
}

export interface InteractiveElement {
  id: string;
  type: 'button' | 'laser' | 'door' | 'star' | 'heavy_button' | 'spike' | 'powerup_speed' | 'powerup_shrink' | 'powerup_invert' | 'bouncy_pad' | 'heater' | 'freezer' | 'teleporter' | 'magnet' | 'fan' | 'conveyor_belt' | 'tar_pit';
  position: Vector2D;
  width?: number;
  height?: number;
  isTriggered: boolean;
  targetId?: string; // id of door or element it opens
  color: string;
  angle?: number;
  angularVelocity?: number;
}

export interface GoalArea {
  position: Vector2D;
  radius: number;
  color: string;
}

export interface Obstacle {
  id: string;
  shape: ShapeType;
  position: Vector2D;
  width?: number;
  height?: number;
  radius?: number;
  angle: number;
  color: string;
  restitution?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  theme: string;
  gravity: Vector2D;
  wind: Vector2D;
  startPosition: Vector2D;
  goal: GoalArea;
  obstacles: Obstacle[];
  portals: Portal[];
  gravityFields: GravityField[];
  fluids: FluidBody[];
  forceZones: ForceZone[];
  thermalZones: ThermalZone[];
  interactives: InteractiveElement[];
  goldTime: number; // seconds
  silverTime: number; // seconds
  bronzeTime: number;
}

export interface BallSkin {
  id: string;
  name: string;
  price: number;
  color: string;
  glowColor: string;
  style: 'solid' | 'gradient' | 'chrome' | 'electric' | 'slime' | 'portal';
  acquired: boolean;
}

export interface BallTrail {
  id: string;
  name: string;
  price: number;
  color: string;
  particleType: 'none' | 'smoke' | 'spark' | 'bubble' | 'rainbow';
  acquired: boolean;
}

export interface UserProgress {
  userId: string;
  email?: string | null;
  username: string;
  credits: number;
  completedLevels: Record<number, { completed: boolean; bestTime: number }>;
  purchasedSkins: string[];
  purchasedTrails: string[];
  activeSkin: string;
  activeTrail: string;
  soundEnabled: boolean;
  levelDesignerCreated: number; // counter of levels published
}

export interface RoomPlayer {
  id: string;
  username: string;
  activeSkinId: string;
  position: Vector2D;
  velocity: Vector2D;
  isReady: boolean;
  finishedTime?: number | null;
  color: string;
}

export interface MultiplayerRoom {
  roomId: string;
  hostId: string;
  levelId: number;
  status: 'waiting' | 'playing' | 'completed';
  players: Record<string, RoomPlayer>;
  createdAt: number;
  updatedAt: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  levelId: number;
  time: number; // seconds
  skinId: string;
  timestamp: number;
}

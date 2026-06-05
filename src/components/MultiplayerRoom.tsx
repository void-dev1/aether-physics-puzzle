/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProgress, MultiplayerRoom as RoomType, RoomPlayer } from '../types';
import { Users, Plus, Shield, Check, Star, RefreshCw } from 'lucide-react';
import { sfx } from './AudioEngine';

interface MultiplayerRoomProps {
  progress: UserProgress;
  onJoinRoom: (roomId: string, levelId: number) => void;
  onExitRoom: () => void;
  activeRoom: RoomType | null;
  onUpdateRoomState: (roomId: string, updater: (r: RoomType) => RoomType) => void;
}

// Generate unique mock room IDs
const generateRoomId = () => Math.random().toString(36).substring(2, 7).toUpperCase();

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({
  progress,
  onJoinRoom,
  onExitRoom,
  activeRoom,
  onUpdateRoomState,
}) => {
  const [roomsList, setRoomsList] = useState<RoomType[]>([]);
  const [selectedLevelStr, setSelectedLevelStr] = useState('1');
  const [roomNameInput, setRoomNameInput] = useState('');

  // Spawn some simulated rooms for matchmaking immediately
  useEffect(() => {
    const list: RoomType[] = [
      {
        roomId: 'VOID-7',
        hostId: 'host_nebula',
        levelId: 42,
        status: 'waiting',
        createdAt: Date.now() - 30000,
        updatedAt: Date.now(),
        players: {
          'host_nebula': { id: 'host_nebula', username: 'HelixRider', activeSkinId: 'skin_gold', position: { x: 100, y: 150 }, velocity: { x: 0, y: 0 }, isReady: true, color: '#f59e0b' },
          'player_quantum': { id: 'player_quantum', username: 'QuarkPro', activeSkinId: 'skin_emerald', position: { x: 100, y: 150 }, velocity: { x: 0, y: 0 }, isReady: false, color: '#10b981' }
        }
      },
      {
        roomId: 'GALE-9',
        hostId: 'host_typhoon',
        levelId: 154,
        status: 'waiting',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
        players: {
          'host_typhoon': { id: 'host_typhoon', username: 'ZephyrDraft', activeSkinId: 'skin_default', position: { x: 100, y: 150 }, velocity: { x: 0, y: 0 }, isReady: true, color: '#0ea5e9' }
        }
      }
    ];
    setRoomsList(list);
  }, []);

  const handleCreateRoom = () => {
    sfx.play('button');
    const levelId = parseInt(selectedLevelStr, 10);
    if (isNaN(levelId) || levelId < 1 || levelId > 500) {
      alert('Please select a valid level ID (1-500) to host matches!');
      return;
    }

    const newRoomId = generateRoomId();
    const newRoom: RoomType = {
      roomId: newRoomId,
      hostId: progress.userId,
      levelId,
      status: 'waiting',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: {
        [progress.userId]: {
          id: progress.userId,
          username: progress.username || 'Anonymous Spherer',
          activeSkinId: progress.activeSkin,
          position: { x: 100, y: 150 },
          velocity: { x: 0, y: 0 },
          isReady: true,
          color: '#38bdf8'
        }
      }
    };

    setRoomsList(prev => [newRoom, ...prev]);
    onJoinRoom(newRoomId, levelId);
  };

  const handleJoinOpenRoom = (room: RoomType) => {
    sfx.play('portal');

    // Check capacity max size 4
    const playerCount = Object.keys(room.players).length;
    if (playerCount >= 4) {
      alert('This room is full! Capacity is capped at 4 co-op players.');
      return;
    }

    // Join room
    onJoinRoom(room.roomId, room.levelId);
  };

  const handleSetReady = () => {
    if (!activeRoom) return;
    sfx.play('bounce');

    onUpdateRoomState(activeRoom.roomId, prev => {
      const updatedPlayers = { ...prev.players };
      if (updatedPlayers[progress.userId]) {
        updatedPlayers[progress.userId].isReady = !updatedPlayers[progress.userId].isReady;
      }
      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  const handleStartLobbyMatch = () => {
    if (!activeRoom) return;
    sfx.play('goal');

    // Check if everyone is ready
    const allReady = (Object.values(activeRoom.players) as RoomPlayer[]).every(p => p.isReady);
    if (!allReady) {
      alert('All players must click READY before you can initialize the physics simulation!');
      return;
    }

    onUpdateRoomState(activeRoom.roomId, prev => ({
      ...prev,
      status: 'playing'
    }));
  };

  if (activeRoom) {
    const isHost = activeRoom.hostId === progress.userId;
    const playersList = Object.values(activeRoom.players) as RoomPlayer[];

    return (
      <div className="bg-[#1E293B]/60 border border-slate-750 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-750 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Users className="w-5 h-5 text-indigo-400 font-mono" /> Matchmaking Room: {activeRoom.roomId}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Level Era target: Level {activeRoom.levelId}
            </span>
          </div>

          <button
            onClick={onExitRoom}
            className="text-xs text-red-400 hover:text-red-300 font-mono border border-red-950 px-3.5 py-1.5 rounded-lg hover:bg-red-950/20 transition duration-150 cursor-pointer"
          >
            Leave Match Lobby
          </button>
        </div>

        {/* Players List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {playersList.map(p => {
            const isSelf = p.id === progress.userId;
            const pIsHost = activeRoom.hostId === p.id;

            return (
              <div
                key={p.id}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 ${
                  p.isReady ? 'border-emerald-600/60 bg-emerald-950/10' : 'border-slate-800 bg-slate-950/30'
                }`}
              >
                {/* Host indicator tag */}
                {pIsHost && (
                  <span className="absolute top-2.5 left-2.5 bg-yellow-500/10 text-yellow-450 border border-yellow-500/25 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Host
                  </span>
                )}

                {/* Outer concentric profile spheres */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center relative shadow-lg mb-3"
                  style={{
                    border: `3.5px solid ${p.color}`,
                    boxShadow: `0 0 14px ${p.color}40`
                  }}
                >
                  <Users className="w-6 h-6 text-slate-200" />
                </div>

                <div className="text-center">
                  <span className="text-sm font-bold text-white block truncate max-w-[120px]">
                    {p.username} {isSelf && '(You)'}
                  </span>
                  <span className="text-[10px] text-slate-550 font-mono mt-0.5 block">
                    Skin ID: {p.activeSkinId}
                  </span>
                </div>

                {/* Ready indicator */}
                <div className="mt-4">
                  {p.isReady ? (
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full border border-emerald-500/25 flex items-center gap-1 leading-none">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full border border-slate-700/50 flex items-center gap-1 leading-none">
                      <RefreshCw className="w-3 h-3 animate-pulse" /> Unready
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Slots Available spacing card */}
          {Array.from({ length: 4 - playersList.length }).map((_, i) => (
            <div key={`empty_${i}`} className="flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/10 text-center text-slate-500">
              <Users className="w-6 h-6 text-slate-700 mb-2" />
              <span className="text-xs font-mono">Slot Available</span>
              <span className="text-[10px] text-slate-600 mt-1">Waiting for player...</span>
            </div>
          ))}
        </div>

        {/* Lobby controls */}
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-405 font-mono text-center sm:text-left leading-relaxed">
            Multiplayer Sync Mode: When play begins, you will see your friends' spheres as glowing orbits alongside your ball. Race to hit the portal and exit first!
          </p>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleSetReady}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition duration-150 flex-1 sm:flex-initial cursor-pointer"
            >
              {activeRoom.players[progress.userId]?.isReady ? 'Unready' : 'Click to Ready'}
            </button>

            {isHost && (
              <button
                onClick={handleStartLobbyMatch}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs rounded-xl transition duration-150 shadow-[0_4px_15px_rgba(79,70,229,0.35)] flex-1 sm:flex-initial cursor-pointer"
              >
                Launch Simulation
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="bg-[#1E293B]/60 border border-slate-750 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-750 pb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <Users className="w-5 h-5 text-indigo-400" /> Co-Op &amp; PvP Arena Rooms
          </h3>
          <p className="text-xs text-slate-400">Match up to 4 players globally or host a training room to play with friends</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="500"
            value={selectedLevelStr}
            onChange={e => setSelectedLevelStr(e.target.value)}
            className="w-20 px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-550 text-white rounded-xl text-xs font-mono outline-none text-center"
            title="Level selection (1-500)"
          />
          <button
            onClick={handleCreateRoom}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs rounded-xl transition duration-150 flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Host New Room
          </button>
        </div>
      </div>

      {/* Available Rooms grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest pl-1">Available Lobby Pools</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomsList.map(room => {
            const size = Object.keys(room.players).length;
            return (
              <div
                key={room.roomId}
                className="p-4 bg-slate-950/20 border border-slate-800/80 rounded-xl hover:border-indigo-550/30 flex items-center justify-between transition group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-455 transition">{room.roomId}</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-705 text-slate-300 rounded text-[9px] font-mono leading-none">
                      Level: {room.levelId}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Host: {room.players[room.hostId]?.username || 'Anonymous'} | Created: {new Date(room.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {size}/4 Players
                  </span>
                  <button
                    onClick={() => handleJoinOpenRoom(room)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold text-xs rounded-lg transition duration-150 cursor-pointer"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            );
          })}

          {roomsList.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs font-mono">
              No active matchmaking lobby pools found. Spawn a fresh room to host tournament rounds!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

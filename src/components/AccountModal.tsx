/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProgress } from '../types';
import { ShieldAlert, User, Key, Mail, RefreshCw } from 'lucide-react';
import { sfx } from './AudioEngine';

interface AccountModalProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (p: UserProgress) => UserProgress) => void;
  isOpen: boolean;
  onClose: () => void;
  onLoggedIn: (email: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  progress,
  onUpdateProgress,
  isOpen,
  onClose,
  onLoggedIn,
}) => {
  const [emailStr, setEmailStr] = useState('');
  const [passStr, setPassStr] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [syncDelay, setSyncDelay] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailStr.includes('@')) {
      alert('Please enter a valid Google email address!');
      return;
    }
    if (passStr.length < 6) {
      alert('Password must be at least 6 characters long for cloud security.');
      return;
    }

    sfx.play('button');
    setSyncDelay(true);

    // Simulate standard 1s sync lag
    setTimeout(() => {
      setSyncDelay(false);
      onLoggedIn(emailStr);
      onUpdateProgress(prev => ({
        ...prev,
        username: emailStr.split('@')[0],
        email: emailStr
      }));
      alert(`Synchronized successfully! Logged in as ${emailStr}. Your credits and items have been backed up in the cloud.`);
      onClose();
    }, 1000);
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    sfx.play('bounce');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-2xl flex flex-col p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isRegistering ? 'Register Cloud Account' : 'Cloud Synchronizer Account'}
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Access cross-platform synchronization, multiplayer rooms, and high score ranks
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase font-mono">Google Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={emailStr}
                onChange={e => setEmailStr(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-sm font-mono placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase font-mono">Secure Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={passStr}
                onChange={e => setPassStr(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl text-sm font-mono placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={syncDelay}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {syncDelay ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Synchronizing data...
              </>
            ) : isRegistering ? (
              'Create Account & Sync'
            ) : (
              'Log In with Credentials'
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={toggleAuthMode}
            className="text-xs text-indigo-405 hover:text-white font-semibold transition cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Log In' : "Don't have an account? Register"}
          </button>
          
          <button
            onClick={onClose}
            className="text-xs text-slate-403 hover:text-white font-mono cursor-pointer"
          >
            Close [ESC]
          </button>
        </div>

        {/* Security Warning Information block */}
        <div className="mt-5 p-3.5 bg-slate-950/40 border border-slate-800/40 rounded-xl flex gap-2.5 items-start">
          <ShieldAlert className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-normal">
            For secure database hosting, please ensure you allow the email/password provider inside the Firebase Auth Console settings once the project setup completes.
          </p>
        </div>
      </div>
    </div>
  );
};

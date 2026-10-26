/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, Trophy, LogOut, AlertCircle, CheckCircle2, Volume2 } from 'lucide-react';
import { RoomData, BuzzEvent, Player } from '../hooks/useQuizRoom';

interface PlayerViewProps {
  roomCode: string;
  room: RoomData | null;
  currentUser: { id: string; name: string; isHost: boolean };
  buzzes: BuzzEvent[];
  participants: Player[];
  onPressBuzzer: () => Promise<void>;
  onLeaveRoom: () => void;
}

export function PlayerView({
  roomCode,
  room,
  currentUser,
  buzzes,
  participants,
  onPressBuzzer,
  onLeaveRoom,
}: PlayerViewProps) {
  const myBuzz = buzzes.find((b) => b.playerId === currentUser.id);
  const myPosition = myBuzz ? myBuzz.position : null;
  const isArmed = room?.buzzerState ?? false;
  const currentPlayer = participants.find((p) => p.id === currentUser.id);
  const score = currentPlayer?.score || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Header mobile-first */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-pink-600/30">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Joueur</span>
            <span className="font-bold text-base text-white tracking-tight">{currentUser.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-mono font-bold text-amber-400 shadow-inner">
            SALON: {roomCode}
          </div>
          <button
            onClick={onLeaveRoom}
            className="p-2.5 bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-xl transition border border-slate-700/60"
            title="Quitter le salon"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-between p-6 max-w-md mx-auto w-full text-center">
        
        {/* Question Banner */}
        <div className="w-full bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isArmed ? 'bg-emerald-400 animate-ping' : 'bg-amber-500'}`}></span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              {isArmed ? "Buzzer Armé !" : "En attente de l'animateur"}
            </span>
          </div>
          <p className="text-base md:text-lg font-semibold text-slate-100 leading-snug">
            {room?.currentQuestion || "Préparez-vous ! L'animateur va poser la question."}
          </p>
        </div>

        {/* Big 3D Buzzer Button Section */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-6">
          {myBuzz ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className={`w-52 h-52 rounded-full flex flex-col items-center justify-center shadow-2xl border-8 transition-all ${
                myPosition === 1 
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 border-emerald-300 text-slate-950 shadow-emerald-500/50' 
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-orange-500/50'
              }`}>
                <Trophy className="w-14 h-14 mb-1 animate-bounce" />
                <span className="text-4xl font-black">#{myPosition}</span>
                <span className="text-xs font-black uppercase tracking-wider mt-1">
                  {myPosition === 1 ? "1er ! Gagné !" : "Validé !"}
                </span>
              </div>
              <div className="mt-6 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg w-full">
                <p className="text-emerald-400 font-bold text-base flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Tu as buzzé en {myPosition}e position !
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {myPosition === 1 ? "🏆 Le plus rapide ! Attendez la validation." : "Bien joué ! Restez attentif pour la suite."}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative group flex items-center justify-center">
              {/* Pulsing glow background when armed */}
              {isArmed && (
                <div className="absolute -inset-8 bg-red-600/30 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
              )}

              <button
                onClick={onPressBuzzer}
                disabled={!isArmed}
                className={`w-64 h-64 md:w-72 md:h-72 rounded-full font-black text-3xl uppercase tracking-wider shadow-2xl transition-all transform active:scale-95 flex flex-col items-center justify-center relative z-10 select-none border-8 ${
                  isArmed
                    ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-red-700 border-rose-300 text-white shadow-[0_0_60px_rgba(239,68,68,0.6)] cursor-pointer hover:scale-105 active:shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                    : 'bg-gradient-to-tr from-slate-800 to-slate-900 border-slate-700 text-slate-500 shadow-inner cursor-not-allowed opacity-90'
                }`}
              >
                <Zap className={`w-20 h-20 mb-2 drop-shadow-lg ${isArmed ? 'text-amber-300 fill-current animate-bounce' : 'text-slate-600'}`} />
                <span className="drop-shadow-md">BUZZ !</span>
                <span className="text-xs font-bold mt-1 tracking-widest uppercase opacity-90">
                  {isArmed ? "APPUYEZ VITE !" : "INACTIF"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Score & Status Bar */}
        <div className="w-full bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${isArmed ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></div>
            <div className="text-left">
              <span className="text-xs font-bold block text-slate-300">
                {isArmed ? "Buzzer Ouvert !" : "Buzzer Verrouillé"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {isArmed ? "Soyez le plus rapide" : "En attente de l'animateur"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
            <span className="text-amber-400 font-black text-lg">{score} pts</span>
          </div>
        </div>

      </main>
    </div>
  );
}

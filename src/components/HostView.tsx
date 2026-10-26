/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Trophy, Play, RotateCcw, Plus, Minus, 
  LogOut, HelpCircle, Sparkles, Award, Zap, CheckCircle2, Copy, Check 
} from 'lucide-react';
import { RoomData, BuzzEvent, Player } from '../hooks/useQuizRoom';

interface HostViewProps {
  roomCode: string;
  room: RoomData | null;
  currentUser: { id: string; name: string; isHost: boolean };
  participants: Player[];
  buzzes: BuzzEvent[];
  onArmBuzzer: (armed: boolean) => Promise<void>;
  onResetBuzzer: () => Promise<void>;
  onUpdateQuestion: (question: string) => Promise<void>;
  onUpdateScore: (playerId: string, delta: number) => Promise<void>;
  onLeaveRoom: () => void;
}

export function HostView({
  roomCode,
  room,
  currentUser,
  participants,
  buzzes,
  onArmBuzzer,
  onResetBuzzer,
  onUpdateQuestion,
  onUpdateScore,
  onLeaveRoom,
}: HostViewProps) {
  const [customQuestion, setCustomQuestion] = useState(room?.currentQuestion || '');
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [copied, setCopied] = useState(false);

  const isArmed = room?.buzzerState ?? false;
  const firstBuzz = buzzes[0];
  const firstTimestamp = firstBuzz?.timestamp?.toMillis ? firstBuzz.timestamp.toMillis() : (firstBuzz?.timestamp?.seconds ? firstBuzz.timestamp.seconds * 1000 : null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 px-3.5 py-1.5 rounded-xl border border-indigo-500/30 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Organisateur</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider hidden sm:inline">Salon :</span>
            <span className="text-xl font-black font-mono tracking-widest text-amber-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-2">
              {roomCode}
              <button 
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-white transition"
                title="Copier le code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700/60">
            <Users className="w-4 h-4 text-pink-400" />
            <span>{participants.length} joueurs</span>
          </div>
          <button
            onClick={onLeaveRoom}
            className="p-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-xl transition border border-slate-700/60"
            title="Quitter le salon"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Center Column (Controls & Podium) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Buzzer Master Control Panel */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-xl relative overflow-hidden ${
            isArmed 
              ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-900 border-emerald-500/50 shadow-emerald-500/10' 
              : 'bg-gradient-to-r from-slate-900 to-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-3 h-3 rounded-full ${isArmed ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contrôle Master du Buzzer</span>
                </div>
                <h2 className="text-2xl font-black">
                  {isArmed ? "🟢 BUZZER ARMÉ & OUVERT" : "🔒 BUZZER VERROUILLÉ"}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  {isArmed 
                    ? (buzzes.length > 0 ? "Un joueur a buzzé ! Le premier est verrouillé." : "Les joueurs peuvent buzzer...") 
                    : "Cliquez sur 'Armer' pour autoriser les joueurs à buzzer."}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isArmed ? (
                  <button
                    onClick={() => onArmBuzzer(true)}
                    className="flex-1 sm:flex-none px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 flex items-center justify-center gap-2 text-base"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Armer le Buzzer
                  </button>
                ) : (
                  <button
                    onClick={() => onArmBuzzer(false)}
                    className="flex-1 sm:flex-none px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/30 transition transform hover:scale-105 flex items-center justify-center gap-2 text-base"
                  >
                    Désarmer
                  </button>
                )}

                <button
                  onClick={onResetBuzzer}
                  className="px-5 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition border border-slate-700 flex items-center justify-center gap-2 shadow"
                  title="Réarmer / Reset des buzzes"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset / Réarmer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Question Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Question Actuelle
              </span>
              <button
                onClick={() => setIsEditingQuestion(!isEditingQuestion)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
              >
                {isEditingQuestion ? "Fermer" : "Modifier la question"}
              </button>
            </div>

            {isEditingQuestion ? (
              <div className="space-y-3">
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Écrivez la question pour les participants..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onUpdateQuestion(customQuestion);
                      setIsEditingQuestion(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition"
                  >
                    Mettre à jour
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-lg font-semibold text-slate-100">
                {room?.currentQuestion || "Aucune question définie. Cliquez sur 'Modifier la question'."}
              </p>
            )}
          </div>

          {/* Podium / Finish Line (Ordre d'arrivée des buzzes) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Ordre d'Arrivée (Podium en Temps Réel)
              </h3>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-mono">
                {buzzes.length} buzz(es)
              </span>
            </div>

            {buzzes.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                <Zap className="w-10 h-10 text-slate-700 mx-auto mb-2 animate-pulse" />
                <p className="text-slate-400 text-sm font-medium">En attente que les joueurs buzzent...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {buzzes.map((buzz, index) => {
                  const isFirst = index === 0;
                  const buzzTime = buzz.timestamp?.toMillis ? buzz.timestamp.toMillis() : (buzz.timestamp?.seconds ? buzz.timestamp.seconds * 1000 : null);
                  const diffMs = (firstTimestamp && buzzTime && !isFirst) ? buzzTime - firstTimestamp : null;

                  return (
                    <div
                      key={buzz.id}
                      className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                        isFirst
                          ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 scale-[1.01]'
                          : 'bg-slate-800/70 border border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg ${
                          isFirst 
                            ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 text-xl' 
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isFirst ? '🥇' : `#${buzz.position}`}
                        </div>
                        <div>
                          <span className="font-bold text-base block text-white flex items-center gap-2">
                            {buzz.playerName}
                            {isFirst && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                                Vainqueur ⚡
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            {isFirst ? "Premier à avoir buzzé !" : diffMs !== null ? `+${diffMs}ms après le 1er` : "Arrivé dans la même seconde"}
                          </span>
                        </div>
                      </div>

                      {isFirst && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateScore(buzz.playerId, 1)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> +1 Point
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Participants Sidebar & Scores */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Participants ({participants.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {participants.map((player) => (
                <div
                  key={player.id}
                  className="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs shadow">
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-sm block text-white flex items-center gap-1.5">
                        {player.name}
                        {player.isHost && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">Host</span>
                        )}
                      </span>
                      <span className="text-xs text-amber-400 font-bold">{player.score} pts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateScore(player.id, 1)}
                      className="p-1.5 bg-slate-700 hover:bg-emerald-600 text-white rounded-lg transition"
                      title="Ajouter 1 point"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateScore(player.id, -1)}
                      className="p-1.5 bg-slate-700 hover:bg-red-600 text-white rounded-lg transition"
                      title="Retirer 1 point"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

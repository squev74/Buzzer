/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, Users, ShieldCheck, AlertCircle, Sparkles, LogIn, PlusCircle
} from 'lucide-react';
import { useQuizRoom } from './hooks/useQuizRoom';
import { HostView } from './components/HostView';
import { PlayerView } from './components/PlayerView';

const SESSION_STORAGE_KEY = 'quiz_buzzer_live_session';

export default function App() {
  const quiz = useQuizRoom();

  // Local form states
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [pseudo, setPseudo] = useState('');
  const [code, setCode] = useState('');

  // Restore session from localStorage on initial mount
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const { roomCode: savedCode, currentUser: savedUser } = JSON.parse(savedSession);
        if (savedCode && savedUser) {
          if (savedUser.isHost) {
            // Re-establish host session
            quiz.createRoom(savedUser.name).then((newCode) => {
              // If we want to restore exact room code if still valid, or create/join
            }).catch(() => {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            });
          } else {
            quiz.joinRoom(savedCode, savedUser.name).catch(() => {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            });
          }
        }
      } catch (e) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Save session when roomCode & currentUser are set
  useEffect(() => {
    if (quiz.roomCode && quiz.currentUser) {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          roomCode: quiz.roomCode,
          currentUser: quiz.currentUser,
        })
      );
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [quiz.roomCode, quiz.currentUser]);

  // Handle Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) return;
    try {
      await quiz.createRoom(pseudo.trim());
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim() || !code.trim()) return;
    try {
      await quiz.joinRoom(code.trim(), pseudo.trim());
    } catch (err) {
      console.error(err);
    }
  };

  // If in a room and user is authenticated/connected
  if (quiz.roomCode && quiz.room && quiz.currentUser) {
    if (quiz.currentUser.isHost) {
      return (
        <HostView
          roomCode={quiz.roomCode}
          room={quiz.room}
          currentUser={quiz.currentUser}
          participants={quiz.participants}
          buzzes={quiz.buzzes}
          onArmBuzzer={quiz.armBuzzer}
          onResetBuzzer={quiz.resetBuzzer}
          onPressBuzzer={quiz.pressBuzzer}
          onUpdateQuestion={quiz.updateQuestion}
          onUpdateScore={quiz.updateScore}
          onLeaveRoom={() => {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            quiz.leaveRoom();
            setMode('home');
          }}
        />
      );
    } else {
      return (
        <PlayerView
          roomCode={quiz.roomCode}
          room={quiz.room}
          currentUser={quiz.currentUser}
          buzzes={quiz.buzzes}
          participants={quiz.participants}
          onPressBuzzer={quiz.pressBuzzer}
          onLeaveRoom={() => {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            quiz.leaveRoom();
            setMode('home');
          }}
        />
      );
    }
  }

  // Home / Login Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white flex flex-col items-center justify-center p-4">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-orange-500/30 mb-4 text-slate-950">
            <Zap className="w-9 h-9 fill-current animate-bounce" />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
            Quiz Buzzer Live
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Le système de buzzer ultra-rapide en temps réel pour vos quiz, soirées et classes.
          </p>
        </div>

        {quiz.error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{quiz.error}</span>
          </div>
        )}

        {mode === 'home' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
            >
              <ShieldCheck className="w-6 h-6 text-amber-300" />
              Créer un Salon (Organisateur)
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-2xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg shadow-lg"
            >
              <Users className="w-6 h-6 text-pink-400" />
              Rejoindre un Salon (Joueur)
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Votre Pseudo (Animateur)
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex: Animateur Thomas"
                maxLength={30}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('home')}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={quiz.loading || !pseudo.trim()}
                className="w-2/3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {quiz.loading ? "Création..." : "Lancer le salon"}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Code du Salon
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: AB12"
                maxLength={6}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase tracking-widest text-center text-xl placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Votre Pseudo (Joueur)
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex: Champion99"
                maxLength={30}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('home')}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={quiz.loading || !pseudo.trim() || !code.trim()}
                className="w-2/3 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {quiz.loading ? "Connexion..." : "Rejoindre"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-slate-500 text-xs flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Quiz Buzzer Live • Synchronisation temps réel Firebase</span>
      </div>
    </div>
  );
}

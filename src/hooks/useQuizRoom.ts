import { useState, useEffect, useCallback } from 'react';
import { 
  doc, setDoc, getDoc, updateDoc, collection, 
  onSnapshot, query, orderBy, serverTimestamp, 
  deleteDoc, getDocs, writeBatch
} from 'firebase/firestore';
import { db, ensureAuthenticated, handleFirestoreError, OperationType } from '../firebase';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  joinedAt?: any;
}

export interface BuzzEvent {
  id: string;
  playerId: string;
  playerName: string;
  timestamp: any;
  position: number;
}

export interface RoomData {
  code: string;
  hostId: string;
  hostName: string;
  status: 'waiting' | 'ready' | 'buzzed' | 'round_over';
  buzzerState: boolean;
  currentQuestion?: string;
  roundNumber: number;
  createdAt?: any;
}

// Helper to get or create a unique session player ID for multi-tab/device distinction
const getPlayerId = () => {
  let pid = localStorage.getItem('quiz_player_id');
  if (!pid) {
    pid = 'p_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('quiz_player_id', pid);
  }
  return pid;
};

// Web Audio API helper for sound effects
export function playSound(type: 'buzz' | 'arm' | 'success' | 'reset') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'buzz') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'arm') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'reset') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // Audio context might be restricted
  }
}

export function useQuizRoom() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Player[]>([]);
  const [buzzes, setBuzzes] = useState<BuzzEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; isHost: boolean } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    let unsubRoom: () => void;
    let unsubPlayers: () => void;
    let unsubBuzzes: () => void;

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      unsubRoom = onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
          setRoom(docSnap.data() as RoomData);
        } else {
          setRoom(null);
          setError("Le salon n'existe plus.");
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `rooms/${roomCode}`);
      });

      const playersRef = collection(db, 'rooms', roomCode, 'players');
      unsubPlayers = onSnapshot(playersRef, (snapshot) => {
        const playersList: Player[] = [];
        snapshot.forEach((d) => {
          playersList.push(d.data() as Player);
        });
        setParticipants(playersList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${roomCode}/players`);
      });

      const buzzesRef = collection(db, 'rooms', roomCode, 'buzzes');
      const qBuzzes = query(buzzesRef, orderBy('timestamp', 'asc'));
      unsubBuzzes = onSnapshot(qBuzzes, (snapshot) => {
        const buzzesList: BuzzEvent[] = [];
        snapshot.forEach((d) => {
          buzzesList.push(d.data() as BuzzEvent);
        });
        setBuzzes(buzzesList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${roomCode}/buzzes`);
      });

    } catch (err: any) {
      setError(err.message);
    }

    return () => {
      if (unsubRoom) unsubRoom();
      if (unsubPlayers) unsubPlayers();
      if (unsubBuzzes) unsubBuzzes();
    };
  }, [roomCode]);

  const createRoom = async (hostName: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const user = await ensureAuthenticated();
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const playerId = getPlayerId();
      const roomRef = doc(db, 'rooms', code);
      
      const roomData: RoomData = {
        code,
        hostId: user.uid,
        hostName,
        status: 'waiting',
        buzzerState: false,
        roundNumber: 1,
        createdAt: serverTimestamp(),
      };

      await setDoc(roomRef, roomData);

      const playerRef = doc(db, 'rooms', code, 'players', playerId);
      const hostPlayer: Player = {
        id: playerId,
        name: hostName,
        score: 0,
        isHost: true,
        joinedAt: serverTimestamp(),
      };
      await setDoc(playerRef, hostPlayer);

      setCurrentUser({ id: playerId, name: hostName, isHost: true });
      setRoomCode(code);
      setLoading(false);
      return code;
    } catch (err: any) {
      setLoading(false);
      handleFirestoreError(err, OperationType.CREATE, 'rooms');
      throw err;
    }
  };

  const joinRoom = async (code: string, playerName: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const cleanCode = code.trim().toUpperCase();
      await ensureAuthenticated();
      const playerId = getPlayerId();
      
      const roomRef = doc(db, 'rooms', cleanCode);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error("Salon introuvable. Vérifiez le code.");
      }

      const playerRef = doc(db, 'rooms', cleanCode, 'players', playerId);
      const player: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        isHost: false,
        joinedAt: serverTimestamp(),
      };
      await setDoc(playerRef, player, { merge: true });

      setCurrentUser({ id: playerId, name: playerName, isHost: false });
      setRoomCode(cleanCode);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  const armBuzzer = async (armed: boolean) => {
    if (!roomCode) return;
    try {
      const roomRef = doc(db, 'rooms', roomCode);
      
      if (armed) {
        const buzzesRef = collection(db, 'rooms', roomCode, 'buzzes');
        const snap = await getDocs(buzzesRef);
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();

        playSound('arm');
      }

      await updateDoc(roomRef, {
        buzzerState: armed,
        status: armed ? 'ready' : 'waiting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomCode}`);
    }
  };

  const resetBuzzer = async () => {
    if (!roomCode) return;
    try {
      const buzzesRef = collection(db, 'rooms', roomCode, 'buzzes');
      const snap = await getDocs(buzzesRef);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        buzzerState: false,
        status: 'waiting',
      });
      playSound('reset');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `rooms/${roomCode}/buzzes`);
    }
  };

  // Press Buzzer - allows sequential buzzes without auto-locking on position 1
  const pressBuzzer = async () => {
    if (!roomCode || !currentUser || !room || !room.buzzerState) return;

    try {
      const buzzesRef = collection(db, 'rooms', roomCode, 'buzzes');
      
      const existingBuzzRef = doc(db, 'rooms', roomCode, 'buzzes', currentUser.id);
      const existingSnap = await getDoc(existingBuzzRef);
      if (existingSnap.exists()) return;

      const currentBuzzesSnap = await getDocs(buzzesRef);
      const position = currentBuzzesSnap.size + 1;

      const buzz: BuzzEvent = {
        id: currentUser.id,
        playerId: currentUser.id,
        playerName: currentUser.name,
        timestamp: serverTimestamp(),
        position,
      };

      await setDoc(existingBuzzRef, buzz);

      // We do NOT auto-lock buzzerState so others can continue buzzing sequentially!
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        status: 'buzzed',
      });

      playSound(position === 1 ? 'success' : 'buzz');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${roomCode}/buzzes`);
    }
  };

  const updateQuestion = async (question: string) => {
    if (!roomCode) return;
    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, { currentQuestion: question });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomCode}`);
    }
  };

  const updateScore = async (playerId: string, delta: number) => {
    if (!roomCode) return;
    try {
      const playerRef = doc(db, 'rooms', roomCode, 'players', playerId);
      const pSnap = await getDoc(playerRef);
      if (pSnap.exists()) {
        const currentScore = pSnap.data().score || 0;
        await updateDoc(playerRef, { score: Math.max(0, currentScore + delta) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomCode}/players/${playerId}`);
    }
  };

  const leaveRoom = useCallback(async () => {
    if (!roomCode || !currentUser) {
      setRoomCode(null);
      setRoom(null);
      setParticipants([]);
      setBuzzes([]);
      setCurrentUser(null);
      return;
    }

    try {
      const playerRef = doc(db, 'rooms', roomCode, 'players', currentUser.id);
      await deleteDoc(playerRef);
    } catch (e) {
      // ignore
    }

    setRoomCode(null);
    setRoom(null);
    setParticipants([]);
    setBuzzes([]);
    setCurrentUser(null);
  }, [roomCode, currentUser]);

  return {
    roomCode,
    room,
    participants,
    buzzes,
    currentUser,
    loading,
    error,
    createRoom,
    joinRoom,
    armBuzzer,
    resetBuzzer,
    pressBuzzer,
    updateQuestion,
    updateScore,
    leaveRoom,
  };
}

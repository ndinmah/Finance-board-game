const STORAGE_KEY = 'webopoly:reconnect-session:v1';

interface StorageLike {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export interface ReconnectSession {
  reconnectionToken: string;
  roomCode: string;
  playerName: string;
  gamePhase: 'waiting' | 'playing' | 'ended';
}

function getSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isReconnectSession(value: unknown): value is ReconnectSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<ReconnectSession>;
  return typeof session.reconnectionToken === 'string'
    && session.reconnectionToken.includes(':')
    && typeof session.roomCode === 'string'
    && (session.roomCode === '' || /^\d{6}$/.test(session.roomCode))
    && typeof session.playerName === 'string'
    && session.playerName.length > 0
    && (session.gamePhase === 'waiting' || session.gamePhase === 'playing' || session.gamePhase === 'ended');
}

export function loadReconnectSession(storage: StorageLike | null = getSessionStorage()): ReconnectSession | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: unknown = JSON.parse(raw);
    if (isReconnectSession(session)) return session;
    storage.removeItem(STORAGE_KEY);
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore browsers that expose storage but block access to it.
    }
  }
  return null;
}

export function saveReconnectSession(
  session: ReconnectSession,
  storage: StorageLike | null = getSessionStorage(),
) {
  if (!storage || !isReconnectSession(session)) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // A blocked/full sessionStorage must not interrupt the live game.
  }
}

export function clearReconnectSession(storage: StorageLike | null = getSessionStorage()) {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable in privacy-restricted browsers.
  }
}

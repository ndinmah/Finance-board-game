import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../store/gameStore';
import {
  clearReconnectSession,
  loadReconnectSession,
  saveReconnectSession,
  type ReconnectSession,
} from './reconnectSession';
import { resolveColyseusEndpoint } from './colyseusEndpoint';

const isDev = import.meta.env.DEV;
const isDevGame = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');
const WS_URL = resolveColyseusEndpoint(import.meta.env.VITE_WS_URL, isDev, window.location);
const RECONNECT_DELAYS_MS = [0, 350, 900];

let client: Client | null = null;
let room: Room | null = null;
let currentRoomCode = '';
let reconnectPromise: Promise<boolean> | null = null;
let connectionGeneration = 0;

function getClient(): Client {
  if (!client) client = new Client(WS_URL);
  return client;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const normalized = message.toLowerCase();
  if (normalized.includes('game already started')) return 'Ván đấu đã bắt đầu và không nhận thêm người chơi.';
  if (normalized.includes('room not found') || normalized.includes('seat reservation expired')) return 'Phòng không còn tồn tại hoặc thời gian giữ chỗ đã hết.';
  if (normalized.includes('reconnection token') || normalized.includes('reconnect')) return 'Phiên khôi phục không còn hợp lệ.';
  if (normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('connection')) return 'Không thể kết nối đến máy chủ.';
  return message || fallback;
}

function persistRoomSession(
  connectedRoom: Room,
  roomCode: string,
  playerName: string,
  gamePhase: ReconnectSession['gamePhase'],
) {
  saveReconnectSession({
    reconnectionToken: connectedRoom.reconnectionToken,
    roomCode,
    playerName,
    gamePhase,
  });
}

function setConnectedRoom(
  connectedRoom: Room,
  roomCode: string,
  playerName: string,
  gamePhase: ReconnectSession['gamePhase'],
): Promise<boolean> {
  room = connectedRoom;
  currentRoomCode = roomCode;
  persistRoomSession(connectedRoom, roomCode, playerName, gamePhase);
  return _bindRoomEvents(connectedRoom, roomCode, playerName);
}

export async function createRoom(playerName: string, isPrivate = false): Promise<string> {
  try {
    const availableRooms = await getClient().getAvailableRooms('webopoly');
    const usedCodes = new Set(availableRooms.map(available => String(available.metadata?.roomCode || '')));
    let roomCode = '';
    do {
      roomCode = String(Math.floor(100000 + Math.random() * 900000));
    } while (usedCodes.has(roomCode));

    const createdRoom = await getClient().create('webopoly', { name: playerName, isPrivate, roomCode });
    void setConnectedRoom(createdRoom, roomCode, playerName, 'waiting');
    return roomCode;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tạo phòng.'));
  }
}

export async function joinRoom(roomCode: string, playerName: string): Promise<void> {
  if (!/^\d{6}$/.test(roomCode)) throw new Error('Mã phòng phải gồm đúng 6 chữ số');

  try {
    const joinedRoom = await joinRoomByCode(roomCode, playerName);
    void setConnectedRoom(joinedRoom, roomCode, playerName, 'waiting');
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể vào phòng.'));
  }
}

async function joinRoomByCode(roomCode: string, playerName: string): Promise<Room> {
  const availableRooms = await getClient().getAvailableRooms('webopoly');
  const matchedRoom = availableRooms.find(available => String(available.metadata?.roomCode || '') === roomCode);
  if (!matchedRoom) throw new Error('Không tìm thấy phòng với mã này');
  return getClient().joinById(matchedRoom.roomId, { name: playerName });
}

export async function joinOrCreate(playerName: string): Promise<void> {
  try {
    const joinedRoom = await getClient().joinOrCreate('webopoly', { name: playerName });
    void setConnectedRoom(joinedRoom, '', playerName, 'waiting');
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể vào phòng.'));
  }
}

export function getCurrentRoom(): Room | null { return room; }
export function getCurrentRoomCode(): string { return currentRoomCode; }
export function hasReconnectSession(): boolean { return loadReconnectSession() !== null; }
export function canReconnectPreviousSession(): boolean { return room === null && hasReconnectSession(); }

export function send(type: string, data?: any) {
  if (room) {
    room.send(type, data);
  } else if (isDevGame) {
    useGameStore.getState().handleDevMessage(type, data);
  }
}

export function leaveRoom() {
  const leavingRoom = room;
  room = null;
  currentRoomCode = '';
  reconnectPromise = null;
  connectionGeneration += 1;
  clearReconnectSession();
  void leavingRoom?.leave();
  useGameStore.getState().reset();
}

async function reconnectWithRetry(reconnectionToken: string): Promise<Room> {
  let lastError: unknown;
  for (const delayMs of RECONNECT_DELAYS_MS) {
    if (delayMs > 0) await new Promise(resolve => window.setTimeout(resolve, delayMs));
    try {
      return await getClient().reconnect(reconnectionToken);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function reconnectPreviousSession(): Promise<boolean> {
  if (room) return true;
  if (reconnectPromise) return reconnectPromise;

  const session = loadReconnectSession();
  if (!session) return false;

  const store = useGameStore.getState();
  const generation = connectionGeneration;
  store.setError('Mất kết nối. Đang khôi phục ván đấu…');

  const attempt = (async () => {
    try {
      const restoredRoom = session.gamePhase === 'waiting' && session.roomCode
        ? await joinRoomByCode(session.roomCode, session.playerName)
        : await reconnectWithRetry(session.reconnectionToken);

      if (generation !== connectionGeneration) {
        void restoredRoom.leave();
        return false;
      }

      const receivedState = await setConnectedRoom(
        restoredRoom,
        session.roomCode,
        session.playerName,
        session.gamePhase,
      );
      if (!receivedState) throw new Error('Kết nối bị gián đoạn trước khi nhận trạng thái ván đấu.');
      store.setError(null);
      return true;
    } catch (error) {
      if (generation !== connectionGeneration) return false;
      console.error('[Room] Reconnect failed', error);
      const reason = getErrorMessage(error, 'Máy chủ chưa phản hồi.');
      store.setError(`Không thể khôi phục ván đấu. ${reason} Hãy thử lại ngay hoặc quay về sảnh.`);
      return false;
    }
  })();
  reconnectPromise = attempt;

  const restored = await attempt;
  if (reconnectPromise === attempt) reconnectPromise = null;
  return restored;
}

function _bindRoomEvents(connectedRoom: Room, roomCode: string, playerName: string): Promise<boolean> {
  const store = useGameStore.getState();
  let settleInitialState: (received: boolean) => void = () => {};
  let initialStateSettled = false;
  const initialState = new Promise<boolean>(resolve => {
    settleInitialState = (received) => {
      if (initialStateSettled) return;
      initialStateSettled = true;
      resolve(received);
    };
  });

  connectedRoom.onStateChange((state: any) => {
    if (room !== connectedRoom) return;
    store.syncFromColyseus(state, connectedRoom.sessionId);
    const gamePhase = state.gamePhase as ReconnectSession['gamePhase'];
    persistRoomSession(connectedRoom, roomCode, playerName, gamePhase);
    settleInitialState(true);
  });

  connectedRoom.onError((code, message) => {
    console.error(`[Room Error] ${code}: ${message}`);
    store.setError(getErrorMessage(message, 'Máy chủ từ chối thao tác này.'));
  });

  connectedRoom.onLeave(async (code) => {
    console.log(`[Room] Left with code ${code}`);
    if (room === connectedRoom) room = null;
    settleInitialState(false);
    if (code > 1000 && loadReconnectSession()) {
      const restored = await reconnectPreviousSession();
      if (restored) console.log('[Room] Reconnected successfully!');
    }
  });

  // Server-pushed errors (e.g. invalid action)
  connectedRoom.onMessage('error', (data: { message: string }) => {
    store.setError(getErrorMessage(data.message, 'Thao tác không hợp lệ.'));
  });

  return initialState;
}

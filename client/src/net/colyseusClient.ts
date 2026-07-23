import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../store/gameStore';

// Lấy IP/domain hiện tại của trình duyệt. Tự động hỗ trợ HTTPS -> WSS và cổng reverse proxy.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = import.meta.env.VITE_WS_URL || (isLocal ? `ws://${window.location.hostname}:2567` : `${protocol}//${window.location.host}`);

let client: Client | null = null;
let room: Room | null = null;
let currentRoomCode = '';

function getClient(): Client {
  if (!client) client = new Client(WS_URL);
  return client;
}

export async function createRoom(playerName: string, isPrivate = false): Promise<string> {
  const availableRooms = await getClient().getAvailableRooms('webopoly');
  const usedCodes = new Set(availableRooms.map(available => String(available.metadata?.roomCode || '')));
  let roomCode = '';
  do {
    roomCode = String(Math.floor(100000 + Math.random() * 900000));
  } while (usedCodes.has(roomCode));

  room = await getClient().create('webopoly', { name: playerName, isPrivate, roomCode });
  currentRoomCode = roomCode;
  _bindRoomEvents();
  return roomCode;
}

export async function joinRoom(roomCode: string, playerName: string): Promise<void> {
  if (!/^\d{6}$/.test(roomCode)) throw new Error('Mã phòng phải gồm đúng 6 chữ số');

  const availableRooms = await getClient().getAvailableRooms('webopoly');
  const matchedRoom = availableRooms.find(available => String(available.metadata?.roomCode || '') === roomCode);
  if (!matchedRoom) throw new Error('Không tìm thấy phòng với mã này');

  room = await getClient().joinById(matchedRoom.roomId, { name: playerName });
  currentRoomCode = roomCode;
  _bindRoomEvents();
}

export async function joinOrCreate(playerName: string): Promise<void> {
  room = await getClient().joinOrCreate('webopoly', { name: playerName });
  _bindRoomEvents();
}

export function getCurrentRoom(): Room | null { return room; }
export function getCurrentRoomCode(): string { return currentRoomCode; }

export function send(type: string, data?: any) {
  if (room) {
    room.send(type, data);
  } else {
    useGameStore.getState().handleDevMessage(type, data);
  }
}

export function leaveRoom() {
  room?.leave();
  room = null;
  currentRoomCode = '';
  useGameStore.getState().reset();
}

function _bindRoomEvents() {
  if (!room) return;
  const store = useGameStore.getState();

  room.onStateChange((state: any) => {
    store.syncFromColyseus(state, room!.sessionId);
  });

  room.onError((code, message) => {
    console.error(`[Room Error] ${code}: ${message}`);
    store.setError(message || 'Connection error');
  });

  room.onLeave(async (code) => {
    console.log(`[Room] Left with code ${code}`);
    if (code > 1000) {
      store.setError('Mất kết nối. Đang thử kết nối lại...');
      const token = room?.reconnectionToken;
      if (token) {
        try {
          room = await getClient().reconnect(token);
          _bindRoomEvents();
          store.setError(null);
          console.log('[Room] Reconnected successfully!');
        } catch (e) {
          console.error('Reconnect failed', e);
          store.setError('Kết nối thất bại hoàn toàn. Vui lòng tải lại trang.');
        }
      } else {
        store.setError('Không thể khôi phục kết nối. Vui lòng tải lại trang.');
      }
    }
  });

  // Server-pushed errors (e.g. invalid action)
  room.onMessage('error', (data: { message: string }) => {
    store.setError(data.message);
  });
}

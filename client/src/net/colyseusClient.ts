import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../store/gameStore';

const WS_URL = 'ws://localhost:2567';

let client: Client | null = null;
let room: Room | null = null;

function getClient(): Client {
  if (!client) client = new Client(WS_URL);
  return client;
}

export async function createRoom(playerName: string, isPrivate = false): Promise<string> {
  const roomCode = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : '';
  room = await getClient().create('webopoly', { name: playerName, isPrivate, roomCode });
  _bindRoomEvents();
  return room.id;
}

export async function joinRoom(roomId: string, playerName: string): Promise<void> {
  room = await getClient().joinById(roomId, { name: playerName });
  _bindRoomEvents();
}

export async function joinOrCreate(playerName: string): Promise<void> {
  room = await getClient().joinOrCreate('webopoly', { name: playerName });
  _bindRoomEvents();
}

export function getCurrentRoom(): Room | null { return room; }

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

  room.onLeave((code) => {
    console.log(`[Room] Left with code ${code}`);
    if (code > 1000) store.setError('Mất kết nối. Đang thử kết nối lại...');
  });

  // Server-pushed errors (e.g. invalid action)
  room.onMessage('error', (data: { message: string }) => {
    store.setError(data.message);
  });
}

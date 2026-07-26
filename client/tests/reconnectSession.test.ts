import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearReconnectSession,
  loadReconnectSession,
  saveReconnectSession,
} from '../src/net/reconnectSession.ts';

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test('stores enough information to reconnect after a refresh', () => {
  const storage = new MemoryStorage();
  const session = {
    reconnectionToken: 'room-id:reconnection-token',
    roomCode: '123456',
    playerName: 'Người chơi',
    gamePhase: 'playing' as const,
  };

  saveReconnectSession(session, storage);

  assert.deepEqual(loadReconnectSession(storage), session);
});

test('ignores malformed persisted data instead of retrying forever', () => {
  const storage = new MemoryStorage();
  storage.setItem('webopoly:reconnect-session:v1', '{"reconnectionToken":42}');

  assert.equal(loadReconnectSession(storage), null);
});

test('does not crash when browser storage becomes unavailable', () => {
  const blockedStorage = {
    getItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };

  assert.equal(loadReconnectSession(blockedStorage), null);
});

test('clears the persisted session when the player leaves intentionally', () => {
  const storage = new MemoryStorage();
  saveReconnectSession({
    reconnectionToken: 'room-id:reconnection-token',
    roomCode: '123456',
    playerName: 'Người chơi',
    gamePhase: 'playing',
  }, storage);

  clearReconnectSession(storage);

  assert.equal(loadReconnectSession(storage), null);
});

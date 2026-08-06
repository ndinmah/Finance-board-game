import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveColyseusEndpoint } from '../src/net/colyseusEndpoint.ts';

test('uses the namespaced same-origin endpoint for tunneled development', () => {
  assert.equal(resolveColyseusEndpoint(undefined, true, {
    protocol: 'https:',
    host: 'example.ngrok-free.dev',
  }), 'wss://example.ngrok-free.dev/colyseus');
});

test('preserves an explicit endpoint override', () => {
  assert.equal(resolveColyseusEndpoint('wss://game.example.com', true, {
    protocol: 'https:',
    host: 'example.ngrok-free.dev',
  }), 'wss://game.example.com');
});

test('keeps production on the page origin without the development namespace', () => {
  assert.equal(resolveColyseusEndpoint(undefined, false, {
    protocol: 'https:',
    host: 'game.example.com',
  }), 'wss://game.example.com');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { getAccessiblePlayerInk } from '../src/ui/playerVisuals.ts';

test('uses dark text for the bright player palette, including red and pink', () => {
  const playerColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#FF9F43',
    '#F472B6',
  ];

  for (const color of playerColors) {
    assert.equal(getAccessiblePlayerInk(color), '#071a23');
  }
});

test('falls back to white text for unknown or very dark colors', () => {
  assert.equal(getAccessiblePlayerInk('#04141f'), '#ffffff');
  assert.equal(getAccessiblePlayerInk('invalid'), '#ffffff');
});

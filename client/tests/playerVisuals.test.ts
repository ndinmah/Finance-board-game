import assert from 'node:assert/strict';
import test from 'node:test';
import { getAccessiblePlayerInk } from '../src/ui/playerVisuals.ts';

test('uses appropriate text color for the player palette', () => {
  const darkTextColors = [
    '#FF4A4A',
    '#00C853',
    '#2979FF',
    '#FF9100',
    '#00E5FF',
    '#FF4081',
    '#FFEA00',
  ];

  for (const color of darkTextColors) {
    assert.equal(getAccessiblePlayerInk(color), '#071a23');
  }

  // Electric purple is dark enough to require light text
  assert.equal(getAccessiblePlayerInk('#AA00FF'), '#ffffff');
});

test('falls back to white text for unknown or very dark colors', () => {
  assert.equal(getAccessiblePlayerInk('#04141f'), '#ffffff');
  assert.equal(getAccessiblePlayerInk('invalid'), '#ffffff');
});

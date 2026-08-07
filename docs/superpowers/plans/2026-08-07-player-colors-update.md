# Player Colors Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update player colors to a vibrant, high-contrast, modern palette for better visual distinction on both the server and client.

**Architecture:** Modify the list of player colors on the server and update the client-side visual accessibility unit tests to reflect the new color choices (where all but the electric purple color should use dark text for optimal readability).

**Tech Stack:** TypeScript, Node.js Test Runner, Colyseus.

## Global Constraints

- Saturated and distinct player colors must be used: Red/Coral (`#FF4A4A`), Emerald Green (`#00C853`), Royal Blue (`#2979FF`), Cam sáng (`#FF9100`), Electric Purple (`#AA00FF`), Vivid Cyan (`#00E5FF`), Hot Pink (`#FF4081`), and Vàng chanh (`#FFEA00`).
- Ensure unit tests are updated and fully pass.

---

### Task 1: Update client player visuals unit test to expect new colors and run failing test

**Files:**
- Modify: `client/tests/playerVisuals.test.ts`

**Interfaces:**
- Consumes: `getAccessiblePlayerInk` from `client/src/ui/playerVisuals.ts`
- Produces: Updated test assertions for new color array

- [ ] **Step 1: Write the failing test by updating `playerVisuals.test.ts` to use new colors and assert ink behavior**

Update [playerVisuals.test.ts](file:///home/ndinmah/Projects/Finance-board-game/client/tests/playerVisuals.test.ts) to verify contrast ink color:
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';
import { getAccessiblePlayerInk } from '../src/ui/playerVisuals.ts';

test('uses dark text for the bright player palette, and light text for electric purple', () => {
  const darkInkColors = [
    '#FF4A4A',
    '#00C853',
    '#2979FF',
    '#FF9100',
    '#00E5FF',
    '#FF4081',
    '#FFEA00',
  ];

  for (const color of darkInkColors) {
    assert.equal(getAccessiblePlayerInk(color), '#071a23');
  }

  // Electric purple requires light text for readability/contrast
  assert.equal(getAccessiblePlayerInk('#AA00FF'), '#ffffff');
});

test('falls back to white text for unknown or very dark colors', () => {
  assert.equal(getAccessiblePlayerInk('#04141f'), '#ffffff');
  assert.equal(getAccessiblePlayerInk('invalid'), '#ffffff');
});
```

- [ ] **Step 2: Run tests to verify they pass (since client visuals are already correct for these color inputs, this test will pass immediately. But let's verify that the test runner successfully verifies it)**

Run: `export PATH=/home/ndinmah/.nvm/versions/node/v24.19.0/bin:$PATH && npm test` inside `client/` directory.
Expected: PASS

- [ ] **Step 3: Commit client test changes**

Run:
```bash
git add client/tests/playerVisuals.test.ts
git commit -m "test: update player visuals test for new color palette"
```

---

### Task 2: Update player colors on server room configuration

**Files:**
- Modify: `server/src/rooms/WebopolyRoom.ts`

**Interfaces:**
- Consumes: None
- Produces: Updated `PLAYER_COLORS` array at server room level

- [ ] **Step 1: Write minimal implementation to change `PLAYER_COLORS`**

In [WebopolyRoom.ts](file:///home/ndinmah/Projects/Finance-board-game/server/src/rooms/WebopolyRoom.ts#L16), replace line 16:
```typescript
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9F43', '#F472B6'];
```
with:
```typescript
const PLAYER_COLORS = ['#FF4A4A', '#00C853', '#2979FF', '#FF9100', '#AA00FF', '#00E5FF', '#FF4081', '#FFEA00'];
```

- [ ] **Step 2: Commit server room changes**

Run:
```bash
git add server/src/rooms/WebopolyRoom.ts
git commit -m "feat: update player colors in server room to high-contrast palette"
```

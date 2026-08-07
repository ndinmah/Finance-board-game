# Spec: Update Player Colors for Better Distinction

This specification outlines the changes required to replace the existing pastel player colors with a modern, high-contrast palette to improve visual distinction and avoid player confusion.

## Proposed Changes

### Server

#### [MODIFY] [WebopolyRoom.ts](file:///home/ndinmah/Projects/Finance-board-game/server/src/rooms/WebopolyRoom.ts)
Update `PLAYER_COLORS` array at line 16 to:
```typescript
const PLAYER_COLORS = ['#FF4A4A', '#00C853', '#2979FF', '#FF9100', '#AA00FF', '#00E5FF', '#FF4081', '#FFEA00'];
```

### Client Tests

#### [MODIFY] [playerVisuals.test.ts](file:///home/ndinmah/Projects/Finance-board-game/client/tests/playerVisuals.test.ts)
Update the unit test to verify accessibility/contrast properties of the new colors. We will adjust the test cases to ensure that `getAccessiblePlayerInk` returns the correct readable text color for each new color in the palette.

## Verification Plan

### Automated Tests
- Run client tests using `npm test` or the appropriate test runner in `client/` to verify contrast ratio calculations.

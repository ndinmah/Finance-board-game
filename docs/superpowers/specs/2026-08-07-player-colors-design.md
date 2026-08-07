# Design Spec - Player Colors Update

## 1. Overview
Update the player colors in the Colyseus game room backend to make players' tokens and avatars clearly distinguishable from each other during gameplay.

## 2. Proposed Changes
Modify the `PLAYER_COLORS` constant in [WebopolyRoom.ts](file:///home/ndinmah/Projects/Finance-board-game/server/src/rooms/WebopolyRoom.ts#L16) to use the following vibrant palette (Option 1):

1. **Red/Coral:** `#FF4A4A`
2. **Emerald Green:** `#00C853`
3. **Royal Blue:** `#2979FF`
4. **Vibrant Orange:** `#FF9100`
5. **Electric Purple:** `#AA00FF`
6. **Vivid Cyan:** `#00E5FF`
7. **Hot Pink:** `#FF4081`
8. **Bright Yellow:** `#FFEA00`

```typescript
const PLAYER_COLORS = ['#FF4A4A', '#00C853', '#2979FF', '#FF9100', '#AA00FF', '#00E5FF', '#FF4081', '#FFEA00'];
```

## 3. Verification Plan
- Verify that player colors display correctly in the client's game board and lobby.
- Verify that the accessibility contrast helper `getAccessiblePlayerInk` correctly calculates white vs. dark text colors on top of these backgrounds.

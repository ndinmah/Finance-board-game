import { create } from 'zustand';

export interface TileState {
  id: number;
  name: string;
  tileType: string;
  colorGroup: string;
  price: number;
  buildCost: number;
  mortgageValue: number;
  ownerId: string;
  houseCount: number;
  isMortgaged: boolean;
  baseRent: number;
  rent1: number; rent2: number; rent3: number; rentHotel: number;
}

export interface PlayerState {
  id: string;
  name: string;
  position: number;
  money: number;
  isInJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
  isConnected: boolean;
  isBot: boolean;
  color: string;
  avatarIndex: string;
  isReady: boolean;
  airportTarget: number;
}

export interface DiceState { die1: number; die2: number; isDouble: boolean; }

export interface ChatMsg { playerId: string; playerName: string; text: string; timestamp: number; }
export interface GameEvt  { type: string; playerId: string; targetId: string; amount: number; tileId: number; message: string; timestamp: number; }

export type GamePhase = 'waiting' | 'playing' | 'ended';
export type TurnPhase = 'wait_roll' | 'moving' | 'land_event' | 'buy_decision' | 'airport_select' | 'festival_select' | 'game_over';

interface GameStore {
  // My identity
  myPlayerId: string;

  // Game state (mirrored from Colyseus)
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerId: string;
  turnNumber: number;
  winnerId: string;
  players: Map<string, PlayerState>;
  board: Map<number, TileState>;
  dice: DiceState;
  chat: ChatMsg[];
  events: GameEvt[];
  turnOrder: string[];

  // UI state
  error: string | null;
  selectedTileId: number | null;

  // Actions
  syncFromColyseus: (state: any, myId: string) => void;
  reset: () => void;
  setError: (msg: string | null) => void;
  setSelectedTile: (id: number | null) => void;
}

const defaultState = {
  myPlayerId: '',
  gamePhase: 'waiting' as GamePhase,
  turnPhase: 'wait_roll' as TurnPhase,
  currentPlayerId: '',
  turnNumber: 0,
  winnerId: '',
  players: new Map<string, PlayerState>(),
  board: new Map<number, TileState>(),
  dice: { die1: 1, die2: 1, isDouble: false },
  chat: [] as ChatMsg[],
  events: [] as GameEvt[],
  turnOrder: [] as string[],
  error: null as string | null,
  selectedTileId: null as number | null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...defaultState,

  syncFromColyseus(state: any, myId: string) {
    // Convert Colyseus MapSchema → plain Map
    const players = new Map<string, PlayerState>();
    state.players?.forEach((p: any, id: string) => {
      players.set(id, {
        id: p.id, name: p.name, position: p.position, money: p.money,
        isInJail: p.isInJail, jailTurns: p.jailTurns, isBankrupt: p.isBankrupt,
        isConnected: p.isConnected, isBot: p.isBot, color: p.color,
        avatarIndex: p.avatarIndex, isReady: p.isReady, airportTarget: p.airportTarget,
      });
    });

    const board = new Map<number, TileState>();
    state.board?.forEach((t: any, key: string) => {
      const id = parseInt(key);
      board.set(id, {
        id, name: t.name, tileType: t.tileType, colorGroup: t.colorGroup,
        price: t.price, buildCost: t.buildCost, mortgageValue: t.mortgageValue,
        ownerId: t.ownerId, houseCount: t.houseCount, isMortgaged: t.isMortgaged,
        baseRent: t.baseRent, rent1: t.rent1, rent2: t.rent2, rent3: t.rent3, rentHotel: t.rentHotel,
      });
    });

    const chat: ChatMsg[] = [];
    state.chat?.forEach((m: any) => chat.push({ playerId: m.playerId, playerName: m.playerName, text: m.text, timestamp: m.timestamp }));

    const events: GameEvt[] = [];
    state.events?.forEach((e: any) => events.push({ type: e.type, playerId: e.playerId, targetId: e.targetId, amount: e.amount, tileId: e.tileId, message: e.message, timestamp: e.timestamp }));

    const turnOrder: string[] = [];
    state.turnOrder?.forEach((id: string) => turnOrder.push(id));

    set({
      myPlayerId: myId,
      gamePhase: state.gamePhase as GamePhase,
      turnPhase: state.turnPhase as TurnPhase,
      currentPlayerId: state.currentPlayerId,
      turnNumber: state.turnNumber,
      winnerId: state.winnerId,
      players, board,
      dice: { die1: state.dice.die1, die2: state.dice.die2, isDouble: state.dice.isDouble },
      chat, events, turnOrder,
    });
  },

  reset: () => set({ ...defaultState }),
  setError: (msg) => set({ error: msg }),
  setSelectedTile: (id) => set({ selectedTileId: id }),
}));

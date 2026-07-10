import { create } from 'zustand';

export interface TileState {
  id: number;
  name: string;
  tileType: string;
  colorGroup: string;
  price: number;
  buildCost: number;
  hotelCost: number;
  ownerId: string;
  houseCount: number;
  hasMonopoly: boolean;
  baseRent: number;
  rent1: number; rent2: number; rent3: number; rentHotel: number;
  currentRent: number;
  isTouristSpot: boolean;
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
  debtAmount: number;
  debtTo: string;
  passCount: number;
}

export interface DiceState { die1: number; die2: number; isDouble: boolean; }

export interface ChatMsg { playerId: string; playerName: string; text: string; timestamp: number; }
export interface GameEvt  { type: string; playerId: string; targetId: string; amount: number; tileId: number; message: string; timestamp: number; }

export type GamePhase = 'waiting' | 'playing' | 'ended';
export type TurnPhase = 'wait_roll' | 'moving' | 'land_event' | 'buy_decision' | 'buyout_decision' | 'upgrade_decision' | 'go_remote_upgrade' | 'airport_select' | 'festival_select' | 'game_over' | 'pay_debt';

interface GameStore {
  // My identity
  myPlayerId: string;

  // Game state (mirrored from Colyseus)
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerId: string;
  turnNumber: number;
  winnerId: string;
  activeFestivalTile: number;
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
  loadDevState: () => void;
}

const defaultState = {
  myPlayerId: '',
  gamePhase: 'waiting' as GamePhase,
  turnPhase: 'wait_roll' as TurnPhase,
  currentPlayerId: '',
  turnNumber: 0,
  winnerId: '',
  activeFestivalTile: -1,
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
        debtAmount: p.debtAmount, debtTo: p.debtTo, passCount: p.passCount,
      });
    });

    const board = new Map<number, TileState>();
    state.board?.forEach((t: any, key: string) => {
      const id = parseInt(key);
      board.set(id, {
        id, name: t.name, tileType: t.tileType, colorGroup: t.colorGroup,
        price: t.price, buildCost: t.buildCost, hotelCost: t.hotelCost,
        ownerId: t.ownerId, houseCount: t.houseCount, hasMonopoly: t.hasMonopoly,
        baseRent: t.baseRent, rent1: t.rent1, rent2: t.rent2, rent3: t.rent3, rentHotel: t.rentHotel, currentRent: t.currentRent,
        isTouristSpot: t.isTouristSpot,
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
      currentPlayerId: state.currentPlayerId || '',
      turnNumber: state.turnNumber || 0,
      winnerId: state.winnerId || '',
      activeFestivalTile: state.activeFestivalTile ?? -1,
      players,
      board,
      dice: { die1: state.dice.die1, die2: state.dice.die2, isDouble: state.dice.isDouble },
      chat, events, turnOrder,
    });
  },

  reset: () => set({ ...defaultState }),
  setError: (msg) => set({ error: msg }),
  setSelectedTile: (id) => set({ selectedTileId: id }),
  loadDevState: () => {
    const players = new Map<string, PlayerState>();
    players.set('dev1', { id: 'dev1', name: 'Dev Player 1', position: 0, money: 15000000, isInJail: false, jailTurns: 0, isBankrupt: false, isConnected: true, isBot: false, color: '#FF6B6B', avatarIndex: '0', isReady: true, airportTarget: -1, debtAmount: 0, debtTo: '', passCount: 0 });
    players.set('dev2', { id: 'dev2', name: 'Dev Player 2', position: 5, money: 15000000, isInJail: false, jailTurns: 0, isBankrupt: false, isConnected: true, isBot: true, color: '#4D96FF', avatarIndex: '1', isReady: true, airportTarget: -1, debtAmount: 0, debtTo: '', passCount: 0 });

    const board = new Map<number, TileState>();
    for (let i = 0; i < 32; i++) {
        board.set(i, { id: i, name: `Tile ${i}`, tileType: i % 8 === 0 ? 'special' : 'property', colorGroup: 'red', price: 1000000, buildCost: 500000, hotelCost: 500000, ownerId: i === 1 ? 'dev1' : '', houseCount: i === 1 ? 2 : 0, hasMonopoly: false, baseRent: 100000, rent1: 200000, rent2: 400000, rent3: 800000, rentHotel: 1500000, currentRent: i === 1 ? 400000 : 0, isTouristSpot: false });
    }

    set({
      myPlayerId: 'dev1',
      gamePhase: 'playing',
      turnPhase: 'wait_roll',
      currentPlayerId: 'dev1',
      turnNumber: 1,
      players,
      board,
      turnOrder: ['dev1', 'dev2']
    });
  }
}));

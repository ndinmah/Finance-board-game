import { create } from 'zustand';
import { MAP_TILES_DATA } from '../game/tileConstants';

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
  handleDevMessage: (type: string, data?: any) => void;
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
  setSelectedTile: (id: number | null) => set({ selectedTileId: id }),

  loadDevState: () => {
    const players = new Map<string, PlayerState>();
    players.set('dev1', { id: 'dev1', name: 'Dev Player 1', position: 0, money: 20000, isInJail: false, jailTurns: 0, isBankrupt: false, isConnected: true, isBot: false, color: '#FF6B6B', avatarIndex: '0', isReady: true, airportTarget: -1, debtAmount: 0, debtTo: '', passCount: 1 });
    players.set('dev2', { id: 'dev2', name: 'Dev Player 2', position: 5, money: 2000, isInJail: false, jailTurns: 0, isBankrupt: false, isConnected: true, isBot: true, color: '#4D96FF', avatarIndex: '1', isReady: true, airportTarget: -1, debtAmount: 0, debtTo: '', passCount: 1 });

    const board = new Map<number, TileState>();
    MAP_TILES_DATA.forEach(t => {
      board.set(t.id, {
        id: t.id,
        name: t.name,
        tileType: t.type,
        colorGroup: t.colorGroup || '',
        price: t.price || 0,
        buildCost: t.buildCost || 0,
        hotelCost: t.hotelCost || 0,
        ownerId: '',
        houseCount: 0,
        hasMonopoly: false,
        baseRent: t.rent[0] || 0,
        rent1: t.rent[1] || 0,
        rent2: t.rent[2] || 0,
        rent3: t.rent[3] || 0,
        rentHotel: t.rent[4] || 0,
        currentRent: t.rent[0] || 0,
        isTouristSpot: false
      });
    });

    set({
      myPlayerId: 'dev1',
      gamePhase: 'playing',
      turnPhase: 'wait_roll',
      currentPlayerId: 'dev1',
      turnNumber: 1,
      players,
      board,
      turnOrder: ['dev1', 'dev2'],
      dice: { die1: 1, die2: 1, isDouble: false }
    });
  },

  handleDevMessage: (type, data) => {
    const store = useGameStore.getState();
    const player = store.players.get('dev1');
    if (!player) return;

    if (type === 'rollDice') {
      const d1 = data?.d1 || Math.ceil(Math.random() * 6);
      const d2 = data?.d2 || Math.ceil(Math.random() * 6);
      const steps = d1 + d2;
      const newPos = (player.position + steps) % 32;

      // Update dice
      set({ dice: { die1: d1, die2: d2, isDouble: d1 === d2 } });

      // Move player after a small delay to simulate rolling
      setTimeout(() => {
        useGameStore.setState(state => {
          const newPlayers = new Map(state.players);
          const p = { ...newPlayers.get('dev1')!, position: newPos };
          newPlayers.set('dev1', p);

          const tile = state.board.get(newPos);
          let nextPhase: TurnPhase = 'wait_roll';

          if (tile) {
            if (tile.tileType === 'property' || tile.tileType === 'port') {
              if (!tile.ownerId) {
                nextPhase = 'buy_decision';
              } else if (tile.ownerId === 'dev1') {
                if (tile.tileType === 'property' && tile.houseCount < 4) {
                  nextPhase = 'upgrade_decision';
                }
              } else {
                if (tile.tileType === 'property' && tile.houseCount < 4) {
                  nextPhase = 'buyout_decision';
                }
              }
            } else if (tile.tileType === 'festival') {
              nextPhase = 'festival_select';
            } else if (tile.tileType === 'airport') {
              nextPhase = 'airport_select';
            }
          }

          return { players: newPlayers, turnPhase: nextPhase };
        });
      }, 800); // match animation speed
    }
    else if (type === 'buyProperty') {
      useGameStore.setState(state => {
        const p = state.players.get('dev1')!;
        const newBoard = new Map(state.board);
        const tile = { ...newBoard.get(p.position)!, ownerId: 'dev1', houseCount: data?.houses || 0 };
        newBoard.set(p.position, tile);

        // Subtract money
        const newPlayers = new Map(state.players);
        const cost = (tile.price || 0) + (data?.houses || 0) * (tile.buildCost || 0);
        const pState = { ...newPlayers.get('dev1')!, money: Math.max(0, p.money - cost) };
        newPlayers.set('dev1', pState);

        return { board: newBoard, players: newPlayers, turnPhase: 'wait_roll' };
      });
    }
    else if (type === 'skipBuy' || type === 'skipBuyout' || type === 'skipUpgrade' || type === 'skipFestival' || type === 'skipRemoteUpgrade') {
      set({ turnPhase: 'wait_roll' });
    }
    else if (type === 'acceptBuyout') {
      useGameStore.setState(state => {
        const p = state.players.get('dev1')!;
        const newBoard = new Map(state.board);
        const tile = { ...newBoard.get(p.position)!, ownerId: 'dev1' };
        newBoard.set(p.position, tile);

        const buyoutPrice = ((tile.price || 0) + tile.houseCount * (tile.buildCost || 0)) * 2;
        const newPlayers = new Map(state.players);
        const pState = { ...newPlayers.get('dev1')!, money: Math.max(0, p.money - buyoutPrice) };
        newPlayers.set('dev1', pState);

        return { board: newBoard, players: newPlayers, turnPhase: 'wait_roll' };
      });
    }
    else if (type === 'upgradeProperty') {
      useGameStore.setState(state => {
        const p = state.players.get('dev1')!;
        const newBoard = new Map(state.board);
        const tile = newBoard.get(p.position)!;
        const oldHouses = tile.houseCount;
        const targetHouses = data?.targetHouses || 0;

        let cost = 0;
        for (let h = oldHouses + 1; h <= targetHouses; h++) {
          cost += (h === 4 ? (tile.hotelCost || 0) : (tile.buildCost || 0));
        }

        const newTile = { ...tile, houseCount: targetHouses };
        newBoard.set(p.position, newTile);

        const newPlayers = new Map(state.players);
        const pState = { ...newPlayers.get('dev1')!, money: Math.max(0, p.money - cost) };
        newPlayers.set('dev1', pState);

        return { board: newBoard, players: newPlayers, turnPhase: 'wait_roll' };
      });
    }
    else if (type === 'selectFestival') {
      useGameStore.setState(state => {
        const newPlayers = new Map(state.players);
        const pState = { ...newPlayers.get('dev1')!, money: Math.max(0, player.money - 50) };
        newPlayers.set('dev1', pState);

        return { players: newPlayers, activeFestivalTile: data.tileId, turnPhase: 'wait_roll' };
      });
    }
    else if (type === 'selectAirport') {
      useGameStore.setState(state => {
        const newPlayers = new Map(state.players);
        const pState = { ...newPlayers.get('dev1')!, position: data.tileId };
        newPlayers.set('dev1', pState);
        return { players: newPlayers, turnPhase: 'wait_roll' };
      });
    }
    else if (type === 'payBail') {
      useGameStore.setState(state => {
        const newPlayers = new Map(state.players);
        const pState = { ...newPlayers.get('dev1')!, isInJail: false, money: Math.max(0, player.money - 200) };
        newPlayers.set('dev1', pState);
        return { players: newPlayers, turnPhase: 'wait_roll' };
      });
    }
  }
}));

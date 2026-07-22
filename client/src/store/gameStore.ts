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
  isActive: boolean;
  isShielded: boolean;
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
  nextRentMultiplier: number;
  hasJailCard: boolean;
  blackoutTasks: { tileId: number; passesLeft: number }[];
}

export interface DiceState { die1: number; die2: number; isDouble: boolean; rollCount: number; }

export interface ChatMsg { playerId: string; playerName: string; text: string; timestamp: number; }
export interface GameEvt  { type: string; playerId: string; targetId: string; amount: number; tileId: number; message: string; timestamp: number; }

export type GamePhase = 'waiting' | 'playing' | 'ended';
export type TurnPhase = 'wait_roll' | 'moving' | 'land_event' | 'buy_decision' | 'buyout_decision' | 'upgrade_decision' | 'go_remote_upgrade' | 'airport_select' | 'festival_select' | 'game_over' | 'pay_debt' | 'chance_shield_select' | 'chance_attack_select' | 'chance_give_city_select' | 'chance_give_city_target' | 'chance_festival_city_select';

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
  pendingChanceEffect: string;
  players: Map<string, PlayerState>;
  board: Map<number, TileState>;
  dice: DiceState;
  chat: ChatMsg[];
  events: GameEvt[];
  turnOrder: string[];

  // UI state
  error: string | null;
  selectedTileId: number | null;
  devDoublesCount: number;

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
  pendingChanceEffect: '',
  players: new Map<string, PlayerState>(),
  board: new Map<number, TileState>(),
  dice: { die1: 1, die2: 1, isDouble: false, rollCount: 0 },
  chat: [] as ChatMsg[],
  events: [] as GameEvt[],
  turnOrder: [] as string[],
  error: null as string | null,
  selectedTileId: null as number | null,
  devDoublesCount: 0,
};

const DEV_PLAYER_ID = 'dev1';
const DEV_OPPONENT_ID = 'dev2';
const DEV_GO_SALARY = 300;
const DEV_BAIL_COST = 200;
const DEV_HOTEL_LEVEL = 4;
const DEV_CHANCE_CARDS = [
  'DISCOUNT_RENT', 'DOUBLE_RENT', 'SHIELD', 'FORCE_SELL', 'SABOTAGE',
  'EARTHQUAKE', 'BLACKOUT', 'CHANCE_FESTIVAL', 'GIVE_CITY', 'GOTO_AIRPORT',
  'GOTO_START', 'GOTO_ACTIVE_FESTIVAL', 'GOTO_FESTIVAL_CORNER', 'GOTO_TAX',
  'GOTO_JAIL', 'BIRTHDAY', 'PENALTY', 'JAIL_CARD',
] as const;

type DevDraft = {
  players: Map<string, PlayerState>;
  board: Map<number, TileState>;
  events: GameEvt[];
  turnPhase: TurnPhase;
  turnNumber: number;
  gamePhase: GamePhase;
  winnerId: string;
  activeFestivalTile: number;
  pendingChanceEffect: string;
  selectedTileId: number | null;
  dice: DiceState;
  devDoublesCount: number;
};

const cloneDevDraft = (state: GameStore): DevDraft => ({
  players: new Map(Array.from(state.players, ([id, p]) => [id, { ...p, blackoutTasks: p.blackoutTasks.map(t => ({ ...t })) }])),
  board: new Map(Array.from(state.board, ([id, tile]) => [id, { ...tile }])),
  events: [...state.events],
  turnPhase: state.turnPhase,
  turnNumber: state.turnNumber,
  gamePhase: state.gamePhase,
  winnerId: state.winnerId,
  activeFestivalTile: state.activeFestivalTile,
  pendingChanceEffect: state.pendingChanceEffect,
  selectedTileId: state.selectedTileId,
  dice: { ...state.dice },
  devDoublesCount: state.devDoublesCount,
});

const pushDevEvent = (draft: DevDraft, type: string, playerId: string, targetId: string, amount: number, tileId: number, message: string) => {
  draft.events.push({ type, playerId, targetId, amount, tileId, message, timestamp: Date.now() });
  if (draft.events.length > 50) draft.events.shift();
};

const getDevTileTotalValue = (tile: TileState) => tile.price + (
  tile.tileType === 'port' ? 0 : tile.houseCount === 4
    ? tile.buildCost * 3 + tile.hotelCost
    : tile.houseCount * tile.buildCost
);

const getDevTileSellValue = (tile: TileState) => Math.floor(getDevTileTotalValue(tile) * 0.5);

const getDevMaxHouses = (player: PlayerState, currentHouses: number) => {
  if (player.passCount === 0) return Math.max(2, currentHouses);
  if (currentHouses < 3) return 3;
  return 4;
};

const updateDevRents = (draft: DevDraft) => {
  draft.board.forEach(tile => {
    tile.hasMonopoly = false;
    if (tile.ownerId && tile.colorGroup) {
      const group = Array.from(draft.board.values()).filter(t => t.colorGroup === tile.colorGroup);
      tile.hasMonopoly = group.length > 0 && group.every(t => t.ownerId === tile.ownerId);
    }

    if (!tile.isActive) {
      tile.currentRent = 0;
      return;
    }

    let rent = tile.baseRent;
    if (tile.tileType === 'port' && tile.ownerId) {
      const count = Array.from(draft.board.values()).filter(t => t.tileType === 'port' && t.ownerId === tile.ownerId).length;
      rent = count === 1 ? 25 : count === 2 ? 50 : count === 3 ? 100 : 200;
    } else if (tile.houseCount === 1) rent = tile.rent1;
    else if (tile.houseCount === 2) rent = tile.rent2;
    else if (tile.houseCount === 3) rent = tile.rent3;
    else if (tile.houseCount === 4) rent = tile.rentHotel;

    if (tile.hasMonopoly) rent *= 2;
    if (tile.isTouristSpot) rent *= 2;
    if (draft.activeFestivalTile === tile.id) rent *= 2;
    tile.currentRent = rent;
  });
};

const resetDevTile = (draft: DevDraft, tile: TileState, clearOwner: boolean) => {
  if (draft.activeFestivalTile === tile.id) draft.activeFestivalTile = -1;
  tile.isActive = true;
  tile.isShielded = false;
  if (clearOwner) {
    tile.ownerId = '';
    tile.houseCount = 0;
  }
  updateDevRents(draft);
};

const finishDevTurn = (draft: DevDraft) => {
  draft.pendingChanceEffect = '';
  draft.selectedTileId = null;
  if (draft.dice.isDouble && draft.devDoublesCount > 0 && draft.devDoublesCount < 3) {
    draft.turnPhase = 'wait_roll';
    return;
  }
  draft.devDoublesCount = 0;
  draft.turnNumber += 1;
  draft.turnPhase = 'wait_roll';
};

const getDevSellableValue = (draft: DevDraft, playerId: string) => {
  let value = 0;
  draft.board.forEach(tile => { if (tile.ownerId === playerId) value += getDevTileSellValue(tile); });
  return value;
};

const bankruptDevPlayer = (draft: DevDraft, playerId: string) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  let liquidation = 0;
  draft.board.forEach(tile => {
    if (tile.ownerId === playerId) {
      liquidation += getDevTileSellValue(tile);
      resetDevTile(draft, tile, true);
    }
  });
  if (player.debtTo && player.debtTo !== 'bank') {
    const creditor = draft.players.get(player.debtTo);
    if (creditor) creditor.money += Math.min(player.debtAmount, player.money + liquidation);
  }
  player.money = 0;
  player.debtAmount = 0;
  player.debtTo = '';
  player.isBankrupt = true;
  pushDevEvent(draft, 'bankrupt', playerId, '', 0, -1, `${player.name} phá sản!`);
  draft.gamePhase = 'ended';
  draft.turnPhase = 'game_over';
  draft.winnerId = playerId === DEV_PLAYER_ID ? DEV_OPPONENT_ID : DEV_PLAYER_ID;
};

const startDevDebt = (draft: DevDraft, playerId: string, amount: number, debtTo: string, tileId: number) => {
  const player = draft.players.get(playerId);
  if (!player || amount <= 0) return false;
  if (getDevSellableValue(draft, playerId) < amount) {
    player.debtAmount = amount;
    player.debtTo = debtTo;
    bankruptDevPlayer(draft, playerId);
    return true;
  }
  player.debtAmount = amount;
  player.debtTo = debtTo;
  draft.turnPhase = 'pay_debt';
  pushDevEvent(draft, 'debt_start', playerId, debtTo, amount, tileId, `${player.name} cần bán tài sản để trả ${amount}K.`);
  return true;
};

const autoSellDevDebt = (draft: DevDraft, playerId: string) => {
  const player = draft.players.get(playerId);
  if (!player || player.debtAmount <= 0) return;
  const sellable = Array.from(draft.board.values())
    .filter(tile => tile.ownerId === playerId)
    .sort((a, b) => getDevTileSellValue(a) - getDevTileSellValue(b));
  for (const tile of sellable) {
    if (player.debtAmount <= 0) break;
    const value = getDevTileSellValue(tile);
    resetDevTile(draft, tile, true);
    const payment = Math.min(value, player.debtAmount);
    const creditor = draft.players.get(player.debtTo);
    if (creditor) creditor.money += payment;
    player.debtAmount -= payment;
    player.money += value - payment;
  }
  if (player.debtAmount > 0) bankruptDevPlayer(draft, playerId);
  else {
    player.debtAmount = 0;
    player.debtTo = '';
  }
};

const chargeDevPlayer = (draft: DevDraft, playerId: string, amount: number) => {
  const player = draft.players.get(playerId);
  if (!player) return amount;
  const paid = Math.min(player.money, amount);
  player.money -= paid;
  return amount - paid;
};

const tickDevBlackouts = (draft: DevDraft, playerId: string) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  player.blackoutTasks = player.blackoutTasks
    .map(task => ({ ...task, passesLeft: task.passesLeft - 1 }))
    .filter(task => task.passesLeft > 0);
  const activeTaskIds = new Set(player.blackoutTasks.map(task => task.tileId));
  draft.board.forEach(tile => {
    if (tile.ownerId === playerId && !tile.isActive && !activeTaskIds.has(tile.id)) tile.isActive = true;
  });
  updateDevRents(draft);
};

const sendDevToJail = (draft: DevDraft, playerId: string) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  player.position = 8;
  player.isInJail = true;
  player.jailTurns = 3;
  draft.devDoublesCount = 0;
  pushDevEvent(draft, 'jail_enter', playerId, '', 0, 8, `${player.name} bị vào tù!`);
  finishDevTurn(draft);
};

const moveDevPlayerTo = (draft: DevDraft, playerId: string, target: number, collectGo: boolean) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  if (collectGo && target < player.position) {
    player.money += DEV_GO_SALARY;
    player.passCount += 1;
    tickDevBlackouts(draft, playerId);
  }
  player.position = target;
};

const checkDevWin = (draft: DevDraft, playerId: string) => {
  const owned = Array.from(draft.board.values()).filter(tile => tile.ownerId === playerId);
  const portWin = owned.filter(tile => tile.tileType === 'port').length >= 4;
  const lineWin = [[1, 7], [9, 15], [17, 23], [25, 31]].some(([start, end]) => {
    const purchasable = Array.from(draft.board.values()).filter(tile => tile.id >= start && tile.id <= end && (tile.tileType === 'property' || tile.tileType === 'port'));
    return purchasable.length > 0 && purchasable.every(tile => tile.ownerId === playerId);
  });
  const monopolies = new Set(owned.filter(tile => tile.hasMonopoly && tile.colorGroup).map(tile => tile.colorGroup));
  if (!portWin && !lineWin && monopolies.size < 3) return false;
  draft.gamePhase = 'ended';
  draft.turnPhase = 'game_over';
  draft.winnerId = playerId;
  pushDevEvent(draft, 'game_over', playerId, '', 0, -1, `${draft.players.get(playerId)?.name} giành chiến thắng!`);
  return true;
};

const resolveDevTax = (draft: DevDraft, playerId: string, tileId: number) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  let propertyValue = 0;
  draft.board.forEach(tile => { if (tile.ownerId === playerId) propertyValue += getDevTileTotalValue(tile); });
  const totalAssets = player.money + propertyValue;
  const tax = Math.floor(totalAssets * 0.1);
  const shortfall = chargeDevPlayer(draft, playerId, tax);
  pushDevEvent(draft, 'tax', playerId, 'bank', tax, tileId, `${player.name} nộp thuế ${tax}K trên tổng tài sản ${totalAssets}K.`);
  if (!startDevDebt(draft, playerId, shortfall, 'bank', tileId)) finishDevTurn(draft);
};

const resolveDevProperty = (draft: DevDraft, playerId: string, tile: TileState) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  if (!tile.ownerId) {
    if (player.money >= tile.price) draft.turnPhase = 'buy_decision';
    else finishDevTurn(draft);
    return;
  }
  if (tile.ownerId === playerId) {
    const max = getDevMaxHouses(player, tile.houseCount);
    const nextCost = tile.houseCount === 3 ? tile.hotelCost : tile.buildCost;
    if (tile.tileType === 'property' && tile.houseCount < max && player.money >= nextCost) draft.turnPhase = 'upgrade_decision';
    else finishDevTurn(draft);
    return;
  }

  const owner = draft.players.get(tile.ownerId);
  if (!owner || owner.isBankrupt) {
    finishDevTurn(draft);
    return;
  }
  let rent = tile.currentRent;
  if (player.nextRentMultiplier !== 1) {
    rent = Math.floor(rent * player.nextRentMultiplier);
    player.nextRentMultiplier = 1;
  }
  const shortfall = chargeDevPlayer(draft, playerId, rent);
  owner.money += rent - shortfall;
  pushDevEvent(draft, 'rent', playerId, owner.id, rent, tile.id, `${player.name} trả ${rent}K tiền thuê cho ${owner.name}.`);
  if (shortfall > 0) {
    startDevDebt(draft, playerId, shortfall, owner.id, tile.id);
    return;
  }
  const buyoutPrice = getDevTileTotalValue(tile) * 2;
  if (tile.tileType !== 'port' && tile.houseCount < DEV_HOTEL_LEVEL && player.money >= buyoutPrice) draft.turnPhase = 'buyout_decision';
  else finishDevTurn(draft);
};

const resolveDevBirthday = (draft: DevDraft, playerId: string) => {
  const receiver = draft.players.get(playerId);
  if (!receiver) return;
  let received = 0;
  draft.players.forEach(payer => {
    if (payer.id === playerId || payer.isBankrupt) return;
    const shortfall = chargeDevPlayer(draft, payer.id, 25);
    const paid = 25 - shortfall;
    received += paid;
    if (shortfall > 0) {
      payer.debtAmount = shortfall;
      payer.debtTo = playerId;
      autoSellDevDebt(draft, payer.id);
    }
  });
  receiver.money += received;
  pushDevEvent(draft, 'chance_birthday', playerId, '', received, receiver.position, `${receiver.name} nhận ${received}K tiền sinh nhật.`);
  if (draft.gamePhase !== 'ended') finishDevTurn(draft);
};

const resolveDevChance = (draft: DevDraft, playerId: string, card: typeof DEV_CHANCE_CARDS[number]) => {
  const player = draft.players.get(playerId);
  if (!player) return;
  const owned = Array.from(draft.board.values()).filter(tile => tile.ownerId === playerId);
  const targets = Array.from(draft.board.values()).filter(tile => tile.ownerId && tile.ownerId !== playerId && tile.houseCount < DEV_HOTEL_LEVEL);
  pushDevEvent(draft, 'chance', playerId, '', 0, player.position, `${player.name} rút thẻ Cơ Hội: [${card}]`);

  if (card === 'DISCOUNT_RENT' || card === 'DOUBLE_RENT') {
    player.nextRentMultiplier = card === 'DISCOUNT_RENT' ? 0.5 : 2;
    finishDevTurn(draft);
  } else if (card === 'SHIELD') {
    if (owned.length) draft.turnPhase = 'chance_shield_select'; else finishDevTurn(draft);
  } else if (card === 'FORCE_SELL' || card === 'EARTHQUAKE' || card === 'BLACKOUT' || card === 'SABOTAGE') {
    const valid = card === 'SABOTAGE' ? targets.filter(tile => tile.tileType !== 'port') : targets;
    if (valid.length) {
      draft.pendingChanceEffect = card;
      draft.turnPhase = 'chance_attack_select';
    } else finishDevTurn(draft);
  } else if (card === 'CHANCE_FESTIVAL') {
    if (owned.length) draft.turnPhase = 'chance_festival_city_select'; else finishDevTurn(draft);
  } else if (card === 'GIVE_CITY') {
    if (owned.length) draft.turnPhase = 'chance_give_city_select'; else finishDevTurn(draft);
  } else if (card === 'GOTO_AIRPORT') {
    moveDevPlayerTo(draft, playerId, 24, false);
    draft.devDoublesCount = 0;
    finishDevTurn(draft);
  } else if (card === 'GOTO_START') {
    moveDevPlayerTo(draft, playerId, 0, true);
    resolveDevLanding(draft, playerId);
  } else if (card === 'GOTO_ACTIVE_FESTIVAL') {
    if (draft.activeFestivalTile < 0) finishDevTurn(draft);
    else {
      moveDevPlayerTo(draft, playerId, draft.activeFestivalTile, true);
      resolveDevLanding(draft, playerId);
    }
  } else if (card === 'GOTO_FESTIVAL_CORNER') {
    moveDevPlayerTo(draft, playerId, 16, true);
    resolveDevLanding(draft, playerId);
  } else if (card === 'GOTO_TAX') {
    moveDevPlayerTo(draft, playerId, 30, true);
    resolveDevTax(draft, playerId, 30);
  } else if (card === 'GOTO_JAIL') sendDevToJail(draft, playerId);
  else if (card === 'BIRTHDAY') resolveDevBirthday(draft, playerId);
  else if (card === 'PENALTY') {
    const shortfall = chargeDevPlayer(draft, playerId, 50);
    if (!startDevDebt(draft, playerId, shortfall, 'bank', player.position)) finishDevTurn(draft);
  } else if (card === 'JAIL_CARD') {
    if (!player.hasJailCard) player.hasJailCard = true;
    finishDevTurn(draft);
  }
};

function resolveDevLanding(draft: DevDraft, playerId: string) {
  const player = draft.players.get(playerId);
  if (!player || draft.gamePhase === 'ended') return;
  const tile = draft.board.get(player.position);
  if (!tile) {
    finishDevTurn(draft);
    return;
  }
  draft.turnPhase = 'land_event';
  if (tile.tileType === 'property' || tile.tileType === 'port') resolveDevProperty(draft, playerId, tile);
  else if (tile.tileType === 'tax') resolveDevTax(draft, playerId, tile.id);
  else if (tile.tileType === 'jail') sendDevToJail(draft, playerId);
  else if (tile.tileType === 'airport') {
    draft.devDoublesCount = 0;
    finishDevTurn(draft);
  } else if (tile.tileType === 'festival') {
    const hasOwnedTile = Array.from(draft.board.values()).some(t => t.ownerId === playerId);
    if (hasOwnedTile && player.money >= 50) draft.turnPhase = 'festival_select'; else finishDevTurn(draft);
  } else if (tile.tileType === 'chance') {
    resolveDevChance(draft, playerId, DEV_CHANCE_CARDS[Math.floor(Math.random() * DEV_CHANCE_CARDS.length)]);
  } else if (tile.tileType === 'go') {
    if (Math.random() < 0.5) draft.turnPhase = 'wait_roll';
    else {
      const canUpgrade = Array.from(draft.board.values()).some(t => {
        if (t.ownerId !== playerId || t.tileType !== 'property') return false;
        const max = getDevMaxHouses(player, t.houseCount);
        const cost = t.houseCount === 3 ? t.hotelCost : t.buildCost;
        return t.houseCount < max && player.money >= cost;
      });
      if (canUpgrade) draft.turnPhase = 'go_remote_upgrade'; else finishDevTurn(draft);
    }
  } else finishDevTurn(draft);
}

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
        nextRentMultiplier: p.nextRentMultiplier, hasJailCard: p.hasJailCard,
        blackoutTasks: JSON.parse(p.blackoutTasksJson || '[]'),
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
        isTouristSpot: t.isTouristSpot, isActive: t.isActive, isShielded: t.isShielded,
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
      pendingChanceEffect: state.pendingChanceEffect || '',
      players,
      board,
      dice: { die1: state.dice.die1, die2: state.dice.die2, isDouble: state.dice.isDouble, rollCount: state.dice.rollCount },
      chat, events, turnOrder,
    });
  },

  reset: () => set({ ...defaultState }),
  setError: (msg) => set({ error: msg }),
  setSelectedTile: (id: number | null) => set({ selectedTileId: id }),

  loadDevState: () => {
    const players = new Map<string, PlayerState>();
    players.set('dev1', { id: 'dev1', name: 'Dev Player 1', position: 0, money: 20000, isInJail: false, jailTurns: 0, isBankrupt: false, isConnected: true, isBot: false, color: '#FF6B6B', avatarIndex: '0', isReady: true, airportTarget: -1, debtAmount: 0, debtTo: '', passCount: 0, nextRentMultiplier: 1, hasJailCard: false, blackoutTasks: [] });
    players.set('dev2', { id: 'dev2', name: 'Dev Player 2', position: 5, money: 2000, isInJail: false, jailTurns: 0, isBankrupt: false, isConnected: true, isBot: true, color: '#4D96FF', avatarIndex: '1', isReady: true, airportTarget: -1, debtAmount: 0, debtTo: '', passCount: 0, nextRentMultiplier: 1, hasJailCard: false, blackoutTasks: [] });

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
        isTouristSpot: false,
        isActive: true,
        isShielded: false
      });
    });
    const touristCandidates = Array.from(board.values()).filter(tile => tile.tileType === 'property' || tile.tileType === 'port');
    for (let i = touristCandidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [touristCandidates[i], touristCandidates[j]] = [touristCandidates[j], touristCandidates[i]];
    }
    touristCandidates.slice(0, 3).forEach(tile => { tile.isTouristSpot = true; });

    set({
      myPlayerId: 'dev1',
      gamePhase: 'playing',
      turnPhase: 'wait_roll',
      currentPlayerId: 'dev1',
      turnNumber: 0,
      players,
      board,
      turnOrder: ['dev1', 'dev2'],
      dice: { die1: 1, die2: 1, isDouble: false, rollCount: 0 },
      devDoublesCount: 0,
      events: [],
      pendingChanceEffect: '',
      activeFestivalTile: -1,
      selectedTileId: null,
      winnerId: '',
    });
  },

  handleDevMessage: (type, data) => {
    const state = useGameStore.getState();
    if (state.gamePhase === 'ended') return;
    const player = state.players.get(DEV_PLAYER_ID);
    if (!player) return;

    if (type === 'rollDice') {
      if (state.turnPhase !== 'wait_roll' && state.turnPhase !== 'airport_select') return;
      const d1 = Number.isFinite(data?.d1) ? Math.max(1, Math.min(6, Math.trunc(data.d1))) : Math.ceil(Math.random() * 6);
      const d2 = Number.isFinite(data?.d2) ? Math.max(1, Math.min(6, Math.trunc(data.d2))) : Math.ceil(Math.random() * 6);
      const draft = cloneDevDraft(state);
      const p = draft.players.get(DEV_PLAYER_ID)!;
      let isDouble = d1 === d2;
      draft.dice = { die1: d1, die2: d2, isDouble, rollCount: state.dice.rollCount + 1 };

      if (p.isInJail) {
        if (isDouble) {
          p.isInJail = false;
          p.jailTurns = 0;
          isDouble = false;
          draft.dice.isDouble = false;
          draft.devDoublesCount = 0;
        } else {
          p.jailTurns -= 1;
          if (p.jailTurns <= 0) {
            p.isInJail = false;
            p.jailTurns = 0;
          }
          finishDevTurn(draft);
          set(draft);
          return;
        }
      }

      draft.devDoublesCount = isDouble ? draft.devDoublesCount + 1 : 0;
      if (draft.devDoublesCount >= 3) {
        sendDevToJail(draft, DEV_PLAYER_ID);
        set(draft);
        return;
      }

      const oldPosition = p.position;
      const nextPosition = (oldPosition + d1 + d2) % 32;
      if (oldPosition + d1 + d2 >= 32) {
        p.money += DEV_GO_SALARY;
        p.passCount += 1;
        tickDevBlackouts(draft, DEV_PLAYER_ID);
        pushDevEvent(draft, 'go_salary', DEV_PLAYER_ID, '', DEV_GO_SALARY, 0, `${p.name} nhận ${DEV_GO_SALARY}K khi qua Xuất Phát.`);
      }
      p.position = nextPosition;
      draft.turnPhase = 'moving';
      set(draft);

      window.setTimeout(() => {
        useGameStore.setState(current => {
          if (current.turnPhase !== 'moving' || current.players.get(DEV_PLAYER_ID)?.position !== nextPosition) return {};
          const landingDraft = cloneDevDraft(current);
          resolveDevLanding(landingDraft, DEV_PLAYER_ID);
          return landingDraft;
        });
      }, 800);
      return;
    }

    useGameStore.setState(current => {
      const draft = cloneDevDraft(current);
      const p = draft.players.get(DEV_PLAYER_ID);
      if (!p) return {};
      const currentTile = draft.board.get(p.position);

      if (type === 'buyProperty') {
        if (draft.turnPhase !== 'buy_decision' || !currentTile || currentTile.ownerId) return {};
        const requested = Number.isInteger(data?.houses) ? data.houses : 0;
        const houses = currentTile.tileType === 'property' ? Math.max(0, Math.min(requested, getDevMaxHouses(p, 0), 3)) : 0;
        const cost = currentTile.price + houses * currentTile.buildCost;
        if (p.money < cost) return {};
        p.money -= cost;
        currentTile.ownerId = DEV_PLAYER_ID;
        currentTile.houseCount = houses;
        updateDevRents(draft);
        pushDevEvent(draft, 'buy', DEV_PLAYER_ID, '', cost, currentTile.id, `${p.name} mua ${currentTile.name} với giá ${cost}K.`);
        if (!checkDevWin(draft, DEV_PLAYER_ID)) finishDevTurn(draft);
      } else if (type === 'skipBuy' && draft.turnPhase === 'buy_decision') finishDevTurn(draft);
      else if (type === 'acceptBuyout') {
        if (draft.turnPhase !== 'buyout_decision' || !currentTile || !currentTile.ownerId || currentTile.ownerId === DEV_PLAYER_ID || currentTile.tileType !== 'property' || currentTile.houseCount >= 4) return {};
        const price = getDevTileTotalValue(currentTile) * 2;
        if (p.money < price) return {};
        const oldOwner = draft.players.get(currentTile.ownerId);
        p.money -= price;
        if (oldOwner) oldOwner.money += price;
        resetDevTile(draft, currentTile, false);
        currentTile.ownerId = DEV_PLAYER_ID;
        updateDevRents(draft);
        if (!checkDevWin(draft, DEV_PLAYER_ID)) {
          const max = getDevMaxHouses(p, currentTile.houseCount);
          const nextCost = currentTile.houseCount === 3 ? currentTile.hotelCost : currentTile.buildCost;
          if (currentTile.houseCount < max && p.money >= nextCost) draft.turnPhase = 'upgrade_decision'; else finishDevTurn(draft);
        }
      } else if (type === 'skipBuyout' && draft.turnPhase === 'buyout_decision') finishDevTurn(draft);
      else if (type === 'upgradeProperty' || type === 'remoteUpgradeProperty') {
        const remote = type === 'remoteUpgradeProperty';
        if ((!remote && draft.turnPhase !== 'upgrade_decision') || (remote && draft.turnPhase !== 'go_remote_upgrade')) return {};
        const tile = remote ? draft.board.get(data?.tileId) : currentTile;
        if (!tile || tile.ownerId !== DEV_PLAYER_ID || tile.tileType !== 'property') return {};
        const max = getDevMaxHouses(p, tile.houseCount);
        const target = Math.min(Number.isInteger(data?.targetHouses) ? data.targetHouses : tile.houseCount, max, 4);
        if (target <= tile.houseCount) return {};
        let cost = 0;
        for (let level = tile.houseCount + 1; level <= target; level++) cost += level === 4 ? tile.hotelCost : tile.buildCost;
        if (p.money < cost) return {};
        p.money -= cost;
        tile.houseCount = target;
        updateDevRents(draft);
        finishDevTurn(draft);
      } else if ((type === 'skipUpgrade' && draft.turnPhase === 'upgrade_decision') || (type === 'skipRemoteUpgrade' && draft.turnPhase === 'go_remote_upgrade')) finishDevTurn(draft);
      else if (type === 'startAirportSelect') {
        if (draft.turnPhase !== 'wait_roll' || p.position !== 24 || p.money < 50) return {};
        draft.turnPhase = 'airport_select';
      } else if (type === 'selectAirport') {
        if (draft.turnPhase !== 'airport_select' || p.money < 50) return {};
        const tile = draft.board.get(data?.tileId);
        if (!tile || (tile.tileType !== 'property' && tile.tileType !== 'port') || (tile.ownerId && tile.ownerId !== DEV_PLAYER_ID)) return {};
        p.money -= 50;
        draft.devDoublesCount = 0;
        moveDevPlayerTo(draft, DEV_PLAYER_ID, tile.id, true);
        resolveDevLanding(draft, DEV_PLAYER_ID);
      } else if (type === 'selectFestival' || type === 'chanceFestivalSelect') {
        const chance = type === 'chanceFestivalSelect';
        if ((!chance && draft.turnPhase !== 'festival_select') || (chance && draft.turnPhase !== 'chance_festival_city_select')) return {};
        const tile = draft.board.get(data?.tileId);
        if (!tile || tile.ownerId !== DEV_PLAYER_ID || (tile.tileType !== 'property' && tile.tileType !== 'port') || (!chance && p.money < 50)) return {};
        if (!chance) p.money -= 50;
        draft.activeFestivalTile = tile.id;
        updateDevRents(draft);
        finishDevTurn(draft);
      } else if (type === 'skipFestival' && draft.turnPhase === 'festival_select') finishDevTurn(draft);
      else if (type === 'payBail') {
        if (draft.turnPhase !== 'wait_roll' || !p.isInJail || p.money < DEV_BAIL_COST) return {};
        p.money -= DEV_BAIL_COST;
        p.isInJail = false;
        p.jailTurns = 0;
      } else if (type === 'useJailCard') {
        if (draft.turnPhase !== 'wait_roll' || !p.isInJail || !p.hasJailCard) return {};
        p.hasJailCard = false;
        p.isInJail = false;
        p.jailTurns = 0;
      } else if (type === 'sellForDebt') {
        if (draft.turnPhase !== 'pay_debt' || p.debtAmount <= 0) return {};
        const tile = draft.board.get(data?.tileId);
        if (!tile || tile.ownerId !== DEV_PLAYER_ID) return {};
        const value = getDevTileSellValue(tile);
        resetDevTile(draft, tile, true);
        const payment = Math.min(value, p.debtAmount);
        const creditor = draft.players.get(p.debtTo);
        if (creditor) creditor.money += payment;
        p.debtAmount -= payment;
        p.money += value - payment;
        if (p.debtAmount <= 0) {
          p.debtAmount = 0;
          p.debtTo = '';
          finishDevTurn(draft);
        }
      } else if (type === 'chanceShieldSelect') {
        if (draft.turnPhase !== 'chance_shield_select') return {};
        const tile = draft.board.get(data?.tileId);
        if (!tile || tile.ownerId !== DEV_PLAYER_ID) return {};
        tile.isShielded = true;
        finishDevTurn(draft);
      } else if (type === 'chanceAttackSelect') {
        if (draft.turnPhase !== 'chance_attack_select') return {};
        const tile = draft.board.get(data?.tileId);
        if (!tile || !tile.ownerId || tile.ownerId === DEV_PLAYER_ID || tile.houseCount >= 4 || (draft.pendingChanceEffect === 'SABOTAGE' && tile.tileType === 'port')) return {};
        if (tile.isShielded) tile.isShielded = false;
        else if (draft.pendingChanceEffect === 'FORCE_SELL') {
          const owner = draft.players.get(tile.ownerId);
          if (owner) owner.money += getDevTileSellValue(tile);
          resetDevTile(draft, tile, true);
        } else if (draft.pendingChanceEffect === 'SABOTAGE') {
          if (tile.houseCount > 0) tile.houseCount -= 1; else resetDevTile(draft, tile, true);
        } else if (draft.pendingChanceEffect === 'EARTHQUAKE') resetDevTile(draft, tile, true);
        else if (draft.pendingChanceEffect === 'BLACKOUT') {
          tile.isActive = false;
          const owner = draft.players.get(tile.ownerId);
          owner?.blackoutTasks.push({ tileId: tile.id, passesLeft: 3 });
        }
        updateDevRents(draft);
        finishDevTurn(draft);
      } else if (type === 'chanceGiveCitySelect') {
        if (draft.turnPhase !== 'chance_give_city_select') return {};
        const tile = draft.board.get(data?.tileId);
        if (!tile || tile.ownerId !== DEV_PLAYER_ID) return {};
        draft.pendingChanceEffect = String(tile.id);
        draft.turnPhase = 'chance_give_city_target';
      } else if (type === 'chanceGiveCityTarget') {
        if (draft.turnPhase !== 'chance_give_city_target' || data?.targetId === DEV_PLAYER_ID) return {};
        const target = draft.players.get(data?.targetId);
        const tile = draft.board.get(Number(draft.pendingChanceEffect));
        if (!target || target.isBankrupt || !tile || tile.ownerId !== DEV_PLAYER_ID) return {};
        resetDevTile(draft, tile, false);
        tile.ownerId = target.id;
        updateDevRents(draft);
        if (!checkDevWin(draft, target.id)) finishDevTurn(draft);
      } else if (type === 'chat') {
        const text = String(data?.text || '').trim().slice(0, 200);
        if (!text) return {};
        const chat = [...current.chat, { playerId: DEV_PLAYER_ID, playerName: p.name, text, timestamp: Date.now() }].slice(-100);
        return { ...draft, chat };
      } else return {};

      return draft;
    });
  }
}));

import { Room, Client, Delayed } from '@colyseus/core';
import { z } from 'zod';
import {
  GameState, Player, MapTile, Dice, ChatMessage, GameEvent,
  GamePhase, TurnPhase
} from '../schema/GameState';
import {
  MAP_TILES, COLOR_GROUPS, TOTAL_TILES,
  GO_TILE, JAIL_TILE, FESTIVAL_TILE, AIRPORT_TILE,
  GO_SALARY, BAIL_COST, STARTING_MONEY,
  MAX_PLAYERS, MIN_PLAYERS, TURN_TIMEOUT_MS, BOT_TAKEOVER_TURNS,
  TAX_TILE, HOTEL_LEVEL, BIRTHDAY_AMOUNT, PENALTY_AMOUNT, BLACKOUT_PASSES,
  ChanceCardId, CHANCE_CARDS
} from '../config/mapData';

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const MOVE_ANIMATION_MS = 800; // time client needs to animate movement

function formatMoney(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  let result = '';
  if (absVal < 1000) {
    result = `${absVal}K`;
  } else {
    result = `${Number((absVal / 1000).toFixed(3))}M`;
  }
  return isNegative ? `-${result}` : result;
}

export class WebopolyRoom extends Room<GameState> {
  maxClients = MAX_PLAYERS;
  private turnTimer: Delayed | null = null;
  private gameTimer: Delayed | null = null;
  private botTimers: Map<string, NodeJS.Timeout> = new Map();

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  onCreate(options: any) {
    this.setState(new GameState());
    this._initBoard();
    this.setMetadata({ isPrivate: !!options.isPrivate, roomCode: options.roomCode || '' });

    // Register message handlers
    this.onMessage('ready',           (client) => this._handleReady(client));
    this.onMessage('addBot',          (client) => this._handleAddBot(client));
    this.onMessage('rollDice',        (client, data) => this._handleRollDice(client, data));
    this.onMessage('buyProperty',     (client, data) => this._handleBuyProperty(client, data));
    this.onMessage('skipBuy',         (client) => this._handleSkipBuy(client));
    this.onMessage('acceptBuyout',    (client) => this._handleAcceptBuyout(client));
    this.onMessage('skipBuyout',      (client) => this._handleSkipBuyout(client));
    this.onMessage('upgradeProperty', (client, data) => this._handleUpgradeProperty(client, data));
    this.onMessage('skipUpgrade',     (client) => this._handleSkipUpgrade(client));
    this.onMessage('remoteUpgradeProperty', (client, data) => this._handleRemoteUpgradeProperty(client, data));
    this.onMessage('skipRemoteUpgrade',     (client) => this._handleSkipRemoteUpgrade(client));
    this.onMessage('payBail',         (client) => this._handlePayBail(client));
    this.onMessage('startAirportSelect', (client) => this._handleStartAirportSelect(client));
    this.onMessage('selectAirport',   (client, data) => this._handleAirportSelect(client, data));
    this.onMessage('selectFestival',  (client, data) => this._handleFestivalSelect(client, data));
    this.onMessage('skipFestival',    (client) => this._handleSkipFestival(client));
    this.onMessage('sellForDebt',     (client, data) => this._handleSellForDebt(client, data));
    this.onMessage('animationDone',   (client) => this._handleAnimationDone(client));
    this.onMessage('chat',            (client, data) => this._handleChat(client, data));
    this.onMessage('chanceShieldSelect',     (c, d) => this._handleChanceShieldSelect(c, d));
    this.onMessage('chanceAttackSelect',     (c, d) => this._handleChanceAttackSelect(c, d));
    this.onMessage('chanceGiveCitySelect',   (c, d) => this._handleChanceGiveCitySelect(c, d));
    this.onMessage('chanceGiveCityTarget',   (c, d) => this._handleChanceGiveCityTarget(c, d));
    this.onMessage('chanceFestivalSelect',   (c, d) => this._handleChanceFestivalSelect(c, d));
    this.onMessage('useJailCard',            (c)    => this._handleUseJailCard(c));

    console.log(`[WebopolyRoom] Room ${this.roomId} created`);
  }

  onJoin(client: Client, options: any) {
    const state = this.state;
    if (state.gamePhase !== 'waiting') {
      // Reconnection
      const existing = state.players.get(client.sessionId);
      if (existing) {
        existing.isConnected = true;
        existing.disconnectedTurns = 0;
        this._clearBotTimer(client.sessionId);
        this._pushEvent('reconnect', client.sessionId, '', 0, -1, `${existing.name} đã kết nối lại!`);
        return;
      }
      throw new Error('Game already started');
    }

    const playerIndex = state.players.size;
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${playerIndex + 1}`;
    player.position = GO_TILE;
    player.money = STARTING_MONEY;
    player.color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    player.avatarIndex = String(playerIndex);
    player.isConnected = true;
    state.players.set(client.sessionId, player);

    this._pushEvent('join', client.sessionId, '', 0, -1, `${player.name} đã vào phòng`);
    console.log(`[WebopolyRoom] ${player.name} joined (${state.players.size}/${MAX_PLAYERS})`);
  }

  onLeave(client: Client, consented: boolean) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
    if (!player) return;

    if (state.gamePhase === 'waiting') {
      state.players.delete(client.sessionId);
      return;
    }

    player.isConnected = false;
    this._pushEvent('disconnect', client.sessionId, '', 0, -1, `${player.name} mất kết nối. Bot đang tiếp quản...`);

    // Allow reconnection within 30s, then bot takes over
    this.allowReconnection(client, 30).then(() => {
      // Will trigger onJoin again with same sessionId
    }).catch(() => {
      // Player didn't reconnect — start bot mode
      player.isBot = true;
      this._scheduleBotTurn(client.sessionId);
    });
  }

  onDispose() {
    this.turnTimer?.clear();
    this.botTimers.forEach(t => clearTimeout(t));
    console.log(`[WebopolyRoom] Room ${this.roomId} disposed`);
  }

  // ─── Board Initialization ────────────────────────────────────────────────────

  private _initBoard() {
    MAP_TILES.forEach(def => {
      const tile = new MapTile();
      tile.id = def.id;
      tile.name = def.name;
      tile.tileType = def.type;
      tile.colorGroup = def.colorGroup || '';
      tile.price = def.price || 0;
      tile.buildCost = def.buildCost || 0;
      tile.hotelCost = def.hotelCost || (def.buildCost ? def.buildCost * 3 : 0);
      tile.baseRent   = def.rent[0] || 0;
      tile.rent1      = def.rent[1] || 0;
      tile.rent2      = def.rent[2] || 0;
      tile.rent3      = def.rent[3] || 0;
      tile.rentHotel  = def.rent[4] || 0;
      this.state.board.set(String(def.id), tile);
    });
    this._updateAllRents();
  }

  private _updateAllRents() {
    this.state.board.forEach(tile => {
      tile.hasMonopoly = false;
      if (tile.ownerId && tile.colorGroup) {
        const group = COLOR_GROUPS[tile.colorGroup] || [];
        const ownerHasAll = group.every(id => {
          const t = this.state.board.get(String(id));
          return t && t.ownerId === tile.ownerId;
        });
        tile.hasMonopoly = ownerHasAll;
      }
      tile.currentRent = this._calculateRent(tile);
    });
  }

  // ─── Game Start ──────────────────────────────────────────────────────────────

  private _handleReady(client: Client) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
    if (!player || state.gamePhase !== 'waiting') return;

    player.isReady = true;
    const allReady = state.players.size >= MIN_PLAYERS &&
      Array.from(state.players.values() as Iterable<Player>).every((p: Player) => p.isReady);

    if (allReady) this._startGame();
  }

  private _handleAddBot(client: Client) {
    const state = this.state;
    if (state.gamePhase !== 'waiting') return;
    if (state.players.size >= MAX_PLAYERS) return;

    const botId = 'bot_' + Math.floor(Math.random() * 100000);
    const color = PLAYER_COLORS[state.players.size % PLAYER_COLORS.length] || '#888';

    const p = new Player();
    p.id = botId;
    p.name = 'Bot ' + Math.floor(Math.random() * 100);
    p.money = STARTING_MONEY;
    p.color = color;
    p.avatarIndex = String(state.players.size % 4);
    p.isBot = true;
    p.isReady = true;

    state.players.set(botId, p);
  }

  private _startGame() {
    const state = this.state;
    // Build random turn order
    const ids = Array.from(state.players.keys());
    this._shuffleArray(ids);
    state.turnOrder.clear();
    ids.forEach(id => state.turnOrder.push(id));

    state.gamePhase = 'playing';
    state.currentPlayerIdx = 0;
    state.currentPlayerId = state.turnOrder[0] ?? '';
    state.turnPhase = 'wait_roll';

    this._pushEvent('start', '', '', 0, -1, 'Game bắt đầu! Chúc vui vẻ!');

    // Pick 3 random tourist spots
    const purchasableTiles: MapTile[] = [];
    state.board.forEach(t => {
      if (t.tileType === 'property' || t.tileType === 'port') purchasableTiles.push(t);
    });
    this._shuffleArray(purchasableTiles);
    for (let i = 0; i < 3 && i < purchasableTiles.length; i++) {
      purchasableTiles[i].isTouristSpot = true;
    }

    this._startTurnTimer();

    // 1-hour time limit
    this.gameTimer = this.clock.setTimeout(() => this._handleGameTimeout(), 60 * 60 * 1000);

    console.log('[WebopolyRoom] Game started. Turn order:', ids);
  }

  private _handleGameTimeout() {
    const state = this.state;
    if (state.gamePhase !== 'playing') return;

    let maxAssets = -1;
    let richestPlayerId = '';

    state.players.forEach((player, id) => {
      if (player.isBankrupt) return;
      let propertyValue = 0;
      state.board.forEach(t => {
        if (t.ownerId === id) propertyValue += this._getTileSellValue(t) * 2;
      });
      const totalAssets = player.money + propertyValue;
      if (totalAssets > maxAssets) {
        maxAssets = totalAssets;
        richestPlayerId = id;
      }
    });

    if (richestPlayerId) {
      this._endGame(richestPlayerId, 'Hết thời gian (1 tiếng) - TÀI SẢN CAO NHẤT!');
    } else {
      this._endGame('', 'Hết thời gian (1 tiếng)');
    }
  }

  // ─── Turn Timer ──────────────────────────────────────────────────────────────

  private _startTurnTimer() {
    this.turnTimer?.clear();
    const state = this.state;
    const curPlayer = state.players.get(state.currentPlayerId);

    if (curPlayer?.isBot) {
      this._scheduleBotAction();
    }

    this.turnTimer = this.clock.setTimeout(() => {
      if (!curPlayer) return;
      // Auto-roll or auto-skip depending on phase
      if (state.turnPhase === 'wait_roll') {
        this._doRollDice(state.currentPlayerId, true);
      } else if (state.turnPhase === 'buy_decision') {
        this._doSkipBuy(state.currentPlayerId);
      } else if (state.turnPhase === 'buyout_decision') {
        this._doSkipBuyout(state.currentPlayerId);
      } else if (state.turnPhase === 'upgrade_decision') {
        this._doSkipUpgrade(state.currentPlayerId);
      } else if (state.turnPhase === 'go_remote_upgrade') {
        this._doSkipRemoteUpgrade(state.currentPlayerId);
      } else if (state.turnPhase === 'airport_select') {
        // Timeout: just advance turn or force roll? If timeout, just advance.
        this._advanceTurn();
      } else if (state.turnPhase === 'festival_select') {
        this._advanceTurn();
      } else if (state.turnPhase === 'pay_debt') {
        this._autoSellDebt(state.currentPlayerId);
      } else if (state.turnPhase.startsWith('chance_')) {
        this._handleChanceTimeout(state.currentPlayerId);
      }
    }, state.turnPhase.startsWith('chance_') ? 15000 : TURN_TIMEOUT_MS);
  }

  // ─── Roll Dice ───────────────────────────────────────────────────────────────

  private _handleRollDice(client: Client, data?: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'wait_roll' && state.turnPhase !== 'airport_select') return;
    this._doRollDice(client.sessionId, false, data);
  }

  private _doRollDice(playerId: string, isAuto: boolean, devData?: any) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player || player.isBankrupt) return;

    // Server-side RNG — client cannot influence this (except in dev mode)
    let die1 = Math.ceil(Math.random() * 6);
    let die2 = Math.ceil(Math.random() * 6);

    if (devData && typeof devData.d1 === 'number' && typeof devData.d2 === 'number') {
      die1 = Math.max(1, Math.min(6, devData.d1));
      die2 = Math.max(1, Math.min(6, devData.d2));
    }

    const isDouble = die1 === die2;

    state.dice.die1 = die1;
    state.dice.die2 = die2;
    state.dice.isDouble = isDouble;

    // Jail logic
    if (player.isInJail) {
      if (isDouble) {
        player.isInJail = false;
        player.jailTurns = 0;
        state.doublesCount = 0; // BUG-02 Fix: Không cấp thêm lượt khi ra tù bằng đôi
        this._pushEvent('jail_exit', playerId, '', 0, JAIL_TILE, `${player.name} đổ được đôi, thoát tù!`);
      } else {
        player.jailTurns -= 1;
        if (player.jailTurns <= 0) {
          player.isInJail = false;
          player.jailTurns = 0;
          this._pushEvent('jail_free', playerId, '', 0, JAIL_TILE, `${player.name} đã hết thời gian ngồi tù, được thả tự do!`);
          this._advanceTurn();
          return;
        } else {
          this._pushEvent('jail_stay', playerId, '', 0, JAIL_TILE, `${player.name} ở lại tù (còn ${player.jailTurns} lượt).`);
          this._advanceTurn();
          return;
        }
      }
    }

    // Normal move
    const steps = die1 + die2;
    const newPos = (player.position + steps) % TOTAL_TILES;

    // Check if passing Go
    if (newPos < player.position || (player.position + steps >= TOTAL_TILES)) {
      player.passCount += 1;
      this._tickBlackoutTasks(playerId);
      this._applyMoneyChange(playerId, GO_SALARY, 'go_salary');
      this._pushEvent('go_salary', playerId, '', GO_SALARY, GO_TILE, `${player.name} qua ô Xuất Phát, nhận ${formatMoney(GO_SALARY)} lương!`);
    }

    if (isDouble) state.doublesCount += 1;
    else state.doublesCount = 0;

    // 3 consecutive doubles → go to jail
    if (state.doublesCount >= 3) {
      state.doublesCount = 0;
      this._sendToJail(playerId);
      return;
    }

    state.turnPhase = 'moving';
    player.position = newPos;
    this.turnTimer?.clear();

    // Give client time to animate, then process tile
    this.clock.setTimeout(() => this._processLanding(playerId), MOVE_ANIMATION_MS);
  }

  // ─── Movement ────────────────────────────────────────────────────────────────

  private _movePlayerTo(playerId: string, target: number, collectGoIfPass: boolean) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    const state = this.state;

    if (collectGoIfPass && target < player.position) {
      player.passCount += 1;
      this._applyMoneyChange(playerId, GO_SALARY, 'go_salary');
      this._pushEvent('go_salary', playerId, '', GO_SALARY, GO_TILE, `${player.name} qua Xuất Phát, nhận ${formatMoney(GO_SALARY)}!`);
    }

    state.turnPhase = 'moving';
    player.position = target;
    this.clock.setTimeout(() => this._processLanding(playerId), MOVE_ANIMATION_MS);
  }

  private _sendToJail(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    this.state.doublesCount = 0; // nullify double extra turn
    player.position = JAIL_TILE;
    player.isInJail = true;
    player.jailTurns = 3;
    this._pushEvent('jail_enter', playerId, '', 0, JAIL_TILE, `${player.name} bị vào tù!`);
    this._advanceTurn();
  }

  // ─── Animation sync ──────────────────────────────────────────────────────────

  private _handleAnimationDone(client: Client) {
    // Client notifies when animation is complete (optional fast-path)
    // We use clock timer as authoritative, so this is informational only
  }

  // ─── Tile Landing ────────────────────────────────────────────────────────────

  private _processLanding(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    const tileKey = String(player.position);
    const tile = state.board.get(tileKey);
    if (!tile) { this._advanceTurn(); return; }

    state.turnPhase = 'land_event';

    switch (tile.tileType) {
      case 'go':
        // They already collected 300 when passing GO, so no extra money here.
        if (Math.random() < 0.5) {
          this._pushEvent('go_land', playerId, '', 0, tile.id, `${player.name} dừng đúng Xuất Phát và được THÊM LƯỢT!`);
          state.turnPhase = 'wait_roll';
          this._startTurnTimer();
        } else {
          // Check if player has any property they can upgrade
          let canUpgradeAny = false;
          state.board.forEach(t => {
            if (t.ownerId === playerId && t.tileType === 'property') {
              const maxHouses = this._getMaxHouses(player, t.houseCount);
              if (maxHouses > t.houseCount) {
                let cost = t.houseCount === 3 ? t.hotelCost : t.buildCost;
                if (player.money >= cost) canUpgradeAny = true;
              }
            }
          });

          if (canUpgradeAny) {
            this._pushEvent('go_land', playerId, '', 0, tile.id, `${player.name} dừng đúng Xuất Phát và được NÂNG CẤP TỪ XA!`);
            state.turnPhase = 'go_remote_upgrade';
            this._startTurnTimer();
          } else {
            this._pushEvent('go_land', playerId, '', 0, tile.id, `${player.name} dừng đúng Xuất Phát (không đủ điều kiện nâng cấp từ xa).`);
            this._advanceTurn();
          }
        }
        break;

      case 'jail':
        this._sendToJail(playerId);
        break;

      case 'festival':
        this._processFestival(playerId);
        break;

      case 'airport':
        state.doublesCount = 0; // nullify double extra turn
        this._pushEvent('airport_land', playerId, '', 0, tile.id, `${player.name} đến Sân Bay, đợi chuyến bay ở lượt sau.`);
        this._advanceTurn();
        break;

      case 'port':
        this._processProperty(playerId, tile);
        break;

      case 'property':
        this._processProperty(playerId, tile);
        break;

      case 'tax':
        this._processTax(playerId, tile);
        break;

      case 'chance':
        this._processChance(playerId);
        break;

      default:
        this._advanceTurn();
    }
  }

  // ─── Property Events ─────────────────────────────────────────────────────────

  private _processProperty(playerId: string, tile: MapTile) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    if (!tile.ownerId) {
      // Unowned — offer to buy
      if (player.money >= tile.price) {
        state.turnPhase = 'buy_decision';
        this._startTurnTimer();
        // Client will show buy modal
        this._pushEvent('buy_offer', playerId, '', tile.price, tile.id, `${player.name} đứng trên ${tile.name}. Mua với giá ${formatMoney(tile.price)}?`);
      } else {
        // Can't afford — skip
        this._pushEvent('buy_skip', playerId, '', tile.price, tile.id, `${player.name} không đủ tiền mua ${tile.name}.`);
        this._advanceTurn();
      }
    } else if (tile.ownerId === playerId) {
      // Own property — check if can upgrade
      const maxHouses = this._getMaxHouses(player, tile.houseCount);
      if (tile.tileType === 'property' && tile.houseCount < maxHouses && player.money >= tile.buildCost) {
        state.turnPhase = 'upgrade_decision';
        this._startTurnTimer();
        this._pushEvent('own_land', playerId, '', 0, tile.id, `${player.name} đứng trên đất của mình. Có thể nâng cấp.`);
      } else {
        this._pushEvent('own_land', playerId, '', 0, tile.id, `${player.name} đứng trên đất của mình.`);
        this._advanceTurn();
      }
    } else {
      // Pay rent
      let rent = tile.currentRent;

      // Apply chance buff/debuff
      if (player.nextRentMultiplier !== 1) {
        rent = Math.floor(rent * player.nextRentMultiplier);
        player.nextRentMultiplier = 1;
      }

      const owner = state.players.get(tile.ownerId);
      if (!owner || owner.isBankrupt) {
        this._advanceTurn();
        return;
      }

      this._pushEvent('rent', playerId, tile.ownerId, rent, tile.id,
        `${player.name} trả ${formatMoney(rent)} tiền tô cho ${owner.name} (${tile.name})`);

      const shortfall = this._applyMoneyChange(playerId, -rent, 'rent');
      if (shortfall > 0) {
        let totalSellValue = 0;
        state.board.forEach(t => {
          if (t.ownerId === playerId) totalSellValue += this._getTileSellValue(t);
        });

        if (totalSellValue < shortfall) {
          // Player bankrupt — transfer what they have + total asset value
          this._applyMoneyChange(tile.ownerId, (rent - shortfall) + totalSellValue, 'rent_receive');
          this._doBankrupt(playerId);
        } else {
          // Player owes debt
          this._applyMoneyChange(tile.ownerId, rent - shortfall, 'rent_receive');
          player.debtAmount = shortfall;
          player.debtTo = tile.ownerId;
          state.turnPhase = 'pay_debt';
          this._pushEvent('debt_start', playerId, tile.ownerId, shortfall, tile.id, `${player.name} không đủ tiền trả tô, cần bán tài sản để trả ${formatMoney(shortfall)}!`);
          this._startTurnTimer();
        }
      } else {
        this._applyMoneyChange(tile.ownerId, rent, 'rent_receive');

        // Buyout check
        const totalValue = tile.price + (tile.houseCount === 4 ? (tile.buildCost * 3 + tile.hotelCost) : tile.houseCount * tile.buildCost);
        const buyoutPrice = totalValue * 2;

        if (tile.tileType !== 'port' && tile.houseCount < 4 && player.money >= buyoutPrice) {
          state.turnPhase = 'buyout_decision';
          this._startTurnTimer();
          this._pushEvent('buyout_offer', playerId, '', buyoutPrice, tile.id, `${player.name} có thể cướp ${tile.name} từ ${owner.name} với giá ${formatMoney(buyoutPrice)}.`);
        } else {
          this._advanceTurn();
        }
      }
    }
  }

  private _processTax(playerId: string, tile: MapTile) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    let propertyValue = 0;
    const ownedTiles: MapTile[] = [];

    state.board.forEach(t => {
      if (t.ownerId === playerId) {
        ownedTiles.push(t);
        propertyValue += this._getTileSellValue(t) * 2; // Original logic calculated full value for tax, which is 2 * sell value
      }
    });

    const totalAssets = player.money + propertyValue;
    const taxAmount = Math.floor(totalAssets * 0.1);

    this._pushEvent('tax', playerId, '', taxAmount, tile.id, `${player.name} bị đánh thuế 10% tổng tài sản (${formatMoney(totalAssets)}), phải nộp ${formatMoney(taxAmount)}!`);

    const shortfall = this._applyMoneyChange(playerId, -taxAmount, 'tax');
    if (shortfall > 0) {
      let totalSellValue = 0;
      ownedTiles.forEach(t => totalSellValue += this._getTileSellValue(t));

      if (totalSellValue < shortfall) {
        this._doBankrupt(playerId);
      } else {
        player.debtAmount = shortfall;
        player.debtTo = 'bank';
        state.turnPhase = 'pay_debt';
        this._pushEvent('debt_start', playerId, 'bank', shortfall, tile.id, `${player.name} không đủ tiền nộp thuế, cần bán tài sản để trả ${formatMoney(shortfall)}!`);
        this._startTurnTimer();
      }
    } else {
      this._advanceTurn();
    }
  }

  private _calculateRent(tile: MapTile): number {
    if (!tile.isActive) return 0;
    if (!tile.ownerId) return tile.baseRent;
    const state = this.state;
    if (tile.tileType === 'port') {
      let portCount = 0;
      state.board.forEach(t => {
        if (t.tileType === 'port' && t.ownerId === tile.ownerId) portCount++;
      });
      if (portCount === 1) return 25;
      if (portCount === 2) return 50;
      if (portCount === 3) return 100;
      return 200; // 4 ports gives 200 rent (if game hasn't ended yet)
    }

    let rent = 0;
    switch (tile.houseCount) {
      case 0: rent = tile.baseRent; break;
      case 1: rent = tile.rent1; break;
      case 2: rent = tile.rent2; break;
      case 3: rent = tile.rent3; break;
      case 4: rent = tile.rentHotel; break;
      default: rent = tile.baseRent;
    }
    // Monopoly bonus: x2 rent if owner has all tiles in group (custom rule)
    if (tile.hasMonopoly) {
      rent *= 2;
    }
    // Tourist Spot bonus: x2 rent
    if (tile.isTouristSpot) {
      rent *= 2;
    }
    // Festival bonus: x2 rent if this is the active festival tile
    if (state.activeFestivalTile === tile.id) {
      rent *= 2;
    }
    return rent;
  }

  private _getMaxHouses(player: Player, currentHouses: number): number {
    if (player.passCount === 0) return Math.max(2, currentHouses);
    if (currentHouses < 3) return 3;
    return 4;
  }

  // ─── Buy / Skip ──────────────────────────────────────────────────────────────

  private _handleBuyProperty(client: Client, rawData?: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'buy_decision') return;

    const parsed = z.object({ houses: z.number().int().min(0).max(3).optional() }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const houses = data?.houses || 0;
    this._doBuyProperty(client.sessionId, Math.min(3, Math.max(0, houses)));
  }

  private _doBuyProperty(playerId: string, houses: number) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;
    const tile = state.board.get(String(player.position));
    if (!tile || tile.ownerId || (tile.tileType !== 'property' && tile.tileType !== 'port')) return;

    // Ensure houses does not exceed max allowed
    const maxHouses = tile.tileType === 'property' ? this._getMaxHouses(player, 0) : 0;
    const actualHouses = Math.min(houses, maxHouses);

    const cost = tile.price + (tile.tileType === 'port' ? 0 : actualHouses * tile.buildCost);
    if (player.money < cost) return;

    this._applyMoneyChange(playerId, -cost, 'buy');
    tile.ownerId = playerId;
    tile.houseCount = actualHouses;

    this._updateAllRents();

    const houseLabel = actualHouses > 0 ? ` + ${actualHouses} nhà` : '';
    this._pushEvent('buy', playerId, '', cost, tile.id, `${player.name} mua ${tile.name}${houseLabel} với giá ${formatMoney(cost)}!`);

    if (this._checkPortWin(playerId)) return;
    if (this._checkLineWin(playerId)) return;
    if (this._checkTripleMonopolyWin(playerId)) return;

    this._advanceTurn();
  }

  private _handleSkipBuy(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'buy_decision') return;
    this._doSkipBuy(client.sessionId);
  }

  private _doSkipBuy(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    const tile = this.state.board.get(String(player.position));
    this._pushEvent('buy_skip', playerId, '', 0, tile?.id ?? -1, `${player?.name} bỏ qua cơ hội mua đất.`);
    this._advanceTurn();
  }

  // ─── Buyout (Cướp đất) ────────────────────────────────────────────────────────

  private _handleAcceptBuyout(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'buyout_decision') return;

    const player = state.players.get(client.sessionId);
    if (!player) return;
    const tile = state.board.get(String(player.position));
    if (!tile || !tile.ownerId || tile.ownerId === client.sessionId || tile.tileType !== 'property') return;
    if (tile.houseCount >= 4) return; // Cannot buyout hotels

    const totalValue = tile.price + (tile.houseCount * tile.buildCost);
    const buyoutPrice = totalValue * 2;
    if (player.money < buyoutPrice) return;

    const oldOwnerId = tile.ownerId;
    const oldOwner = state.players.get(oldOwnerId);

    // Pay money to old owner
    this._applyMoneyChange(client.sessionId, -buyoutPrice, 'buyout_pay');
    this._applyMoneyChange(oldOwnerId, buyoutPrice, 'buyout_receive');

    tile.ownerId = client.sessionId;
    this._updateAllRents();

    this._pushEvent('buyout', client.sessionId, oldOwnerId, buyoutPrice, tile.id, `${player.name} đã CƯỚP ĐẤT ${tile.name} từ ${oldOwner?.name || 'người khác'} với giá ${formatMoney(buyoutPrice)}!`);

    if (this._checkPortWin(client.sessionId)) return;
    if (this._checkLineWin(client.sessionId)) return;
    if (this._checkTripleMonopolyWin(client.sessionId)) return;

    // Check if player can immediately upgrade after buyout
    const maxHouses = this._getMaxHouses(player, tile.houseCount);
    if (tile.houseCount < maxHouses && player.money >= tile.buildCost) {
      state.turnPhase = 'upgrade_decision';
      this._startTurnTimer();
      this._pushEvent('own_land', client.sessionId, '', 0, tile.id, `${player.name} vừa cướp đất thành công. Có thể nâng cấp ngay!`);
    } else {
      this._advanceTurn();
    }
  }

  private _handleSkipBuyout(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'buyout_decision') return;
    this._doSkipBuyout(client.sessionId);
  }

  private _doSkipBuyout(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    const tile = this.state.board.get(String(player.position));
    this._pushEvent('buyout_skip', playerId, '', 0, tile?.id ?? -1, `${player?.name} từ chối cướp đất.`);
    this._advanceTurn();
  }

  // ─── Upgrade ─────────────────────────────────────────────────────────────────

  private _handleUpgradeProperty(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'upgrade_decision') return;

    const parsed = z.object({ targetHouses: z.number().int().min(0).max(4) }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const player = state.players.get(client.sessionId);
    if (!player || player.isBankrupt) return;

    const tile = state.board.get(String(player.position));
    if (!tile || tile.ownerId !== client.sessionId || tile.tileType !== 'property') return;

    const maxHouses = this._getMaxHouses(player, tile.houseCount);
    const targetHouses = Math.min(data.targetHouses, maxHouses);
    if (targetHouses <= tile.houseCount) {
      this._doSkipUpgrade(client.sessionId);
      return;
    }

    let cost = 0;
    for (let i = tile.houseCount + 1; i <= targetHouses; i++) {
      cost += (i === 4 ? tile.hotelCost : tile.buildCost);
    }

    if (player.money < cost) return;

    this._applyMoneyChange(client.sessionId, -cost, 'build');
    tile.houseCount = targetHouses;

    this._updateAllRents();

    const label = tile.houseCount === 4 ? 'Khách sạn' : `Nhà cấp ${tile.houseCount}`;
    this._pushEvent('upgrade', client.sessionId, '', cost, tile.id, `${player.name} nâng cấp lên ${label} trên ${tile.name} (giá ${formatMoney(cost)})!`);
    this._advanceTurn();
  }

  private _handleSkipUpgrade(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'upgrade_decision') return;
    this._doSkipUpgrade(client.sessionId);
  }

  private _doSkipUpgrade(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    const tile = this.state.board.get(String(player.position));
    this._pushEvent('upgrade_skip', playerId, '', 0, tile?.id ?? -1, `${player?.name} bỏ qua cơ hội nâng cấp.`);
    this._advanceTurn();
  }

  private _handleRemoteUpgradeProperty(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'go_remote_upgrade') return;

    const parsed = z.object({ tileId: z.number().int(), targetHouses: z.number().int().min(0).max(4) }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const player = state.players.get(client.sessionId);
    if (!player || player.isBankrupt) return;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId || tile.tileType !== 'property') return;

    const maxHouses = this._getMaxHouses(player, tile.houseCount);
    const targetHouses = Math.min(data.targetHouses, maxHouses);
    if (targetHouses <= tile.houseCount) {
      this._doSkipRemoteUpgrade(client.sessionId);
      return;
    }

    let cost = 0;
    for (let i = tile.houseCount + 1; i <= targetHouses; i++) {
      cost += (i === 4 ? tile.hotelCost : tile.buildCost);
    }

    if (player.money < cost) return;

    this._applyMoneyChange(client.sessionId, -cost, 'build');
    tile.houseCount = targetHouses;

    this._updateAllRents();

    const label = tile.houseCount === 4 ? 'Khách sạn' : `Nhà cấp ${tile.houseCount}`;
    this._pushEvent('upgrade', client.sessionId, '', cost, tile.id, `${player.name} nâng cấp từ xa lên ${label} trên ${tile.name} (giá ${formatMoney(cost)})!`);
    this._advanceTurn();
  }

  private _handleSkipRemoteUpgrade(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'go_remote_upgrade') return;
    this._doSkipRemoteUpgrade(client.sessionId);
  }

  private _doSkipRemoteUpgrade(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    this._pushEvent('upgrade_skip', playerId, '', 0, -1, `${player?.name} bỏ qua cơ hội nâng cấp từ xa.`);
    this._advanceTurn();
  }

  // ─── Jail ────────────────────────────────────────────────────────────────────

  private _handlePayBail(client: Client) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
    if (!player || !player.isInJail) return;
    if (player.money < BAIL_COST) { client.send('error', { message: 'Không đủ tiền bảo lãnh!' }); return; }

    this._applyMoneyChange(client.sessionId, -BAIL_COST, 'bail');
    player.isInJail = false;
    player.jailTurns = 0;
    this._pushEvent('jail_bail', client.sessionId, '', BAIL_COST, JAIL_TILE, `${player.name} nộp ${formatMoney(BAIL_COST)} thoát tù!`);
  }

  // ─── Airport (Corner 24) ─────────────────────────────────────────────────────

  private _handleStartAirportSelect(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'wait_roll') return;
    const player = state.players.get(client.sessionId);
    if (!player || player.position !== AIRPORT_TILE) return;

    if (player.money < 50) {
      client.send('error', { message: 'Không đủ 50K để bay!' });
      return;
    }

    state.turnPhase = 'airport_select';
    this._startTurnTimer();
    this._pushEvent('airport_wait', client.sessionId, '', 0, AIRPORT_TILE, `${player.name} đang chọn chuyến bay (50K)...`);
  }

  private _handleAirportSelect(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'airport_select') return;

    const parsed = z.object({ tileId: z.number().int().min(0).max(TOTAL_TILES - 1) }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const tile = state.board.get(String(data.tileId));
    if (!tile) return;

    if (tile.tileType !== 'property' && tile.tileType !== 'port') {
      client.send('error', { message: 'Chỉ được bay tới ô đất hoặc cảng!' });
      return;
    }

    if (tile.ownerId && tile.ownerId !== client.sessionId) {
      client.send('error', { message: 'Chỉ được bay tới ô trống hoặc ô của bạn!' });
      return;
    }

    const player = state.players.get(client.sessionId);
    if (!player) return;
    if (player.money < 50) return;

    this._applyMoneyChange(client.sessionId, -50, 'airport_fee');
    this._pushEvent('airport_fly', client.sessionId, '', 50, data.tileId, `${player.name} đã trả 50K để bay đến ${tile.name}!`);

    state.doublesCount = 0;
    this._movePlayerTo(client.sessionId, data.tileId, true);
  }

  // ─── Festival (Corner 16) ────────────────────────────────────────────────────

  private _processFestival(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    // Find tiles owned by this player
    const ownedTiles = Array.from(state.board.values() as Iterable<MapTile>).filter(
      (t: MapTile) => t.ownerId === playerId && t.tileType === 'property'
    );

    if (ownedTiles.length === 0 || player.money < 50) {
      const reason = ownedTiles.length === 0 ? 'không có đất' : 'không đủ tiền (cần 50K)';
      this._pushEvent('festival_skip', playerId, '', 0, FESTIVAL_TILE, `${player.name} bỏ qua Lễ Hội do ${reason}.`);
      this._advanceTurn();
      return;
    }

    state.turnPhase = 'festival_select';
    this._startTurnTimer();
    this._pushEvent('festival', playerId, '', 0, FESTIVAL_TILE, `${player.name} đến Lễ Hội! Chọn 1 thành phố để tổ chức sự kiện (50K).`);
  }

  private _handleFestivalSelect(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'festival_select') return;

    const parsed = z.object({ tileId: z.number().int().min(0).max(TOTAL_TILES - 1) }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId) return;

    const player = state.players.get(client.sessionId);
    if (!player || player.money < 50) return;

    this._applyMoneyChange(client.sessionId, -50, 'festival_fee');

    // Remove old * 2 on base variables
    state.activeFestivalTile = data.tileId;
    this._updateAllRents();

    this._pushEvent('festival_done', client.sessionId, '', 50, data.tileId,
      `${player.name} trả 50K tổ chức Lễ Hội tại ${tile.name}! Tiền tô nhân đôi.`);
    this._advanceTurn();
  }

  private _handleSkipFestival(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'festival_select') return;
    this._doSkipFestival(client.sessionId);
  }

  private _doSkipFestival(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    this._pushEvent('festival_skip', playerId, '', 0, FESTIVAL_TILE, `${player.name} đã bỏ qua việc tổ chức Lễ Hội.`);
    this._advanceTurn();
  }

  // ─── Chance Cards ────────────────────────────────────────────────────────────

  private _processChance(playerId: string) {
    const cards = CHANCE_CARDS;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const player = this.state.players.get(playerId);
    if (!player) return;

    this._pushEvent('chance', playerId, '', 0, player.position, `${player.name} rút thẻ Cơ Hội: [${card}]`);
    this._resolveChanceCard(playerId, card);
  }

  private _resolveChanceCard(playerId: string, card: ChanceCardId) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    let hasProperty = false;
    state.board.forEach(t => { if (t.ownerId === playerId) hasProperty = true; });

    switch (card) {
      case 'DISCOUNT_RENT':
        player.nextRentMultiplier = 0.5;
        this._advanceTurn();
        break;
      case 'DOUBLE_RENT':
        player.nextRentMultiplier = 2.0;
        this._advanceTurn();
        break;
      case 'SHIELD':
        if (!hasProperty) {
          this._pushEvent('chance_skip', playerId, '', 0, player.position, `${player.name} không có đất để gắn khiên. Bỏ qua thẻ.`);
          this._advanceTurn();
        } else {
          state.turnPhase = 'chance_shield_select';
          this._startTurnTimer();
        }
        break;
      case 'FORCE_SELL':
      case 'SABOTAGE':
      case 'EARTHQUAKE':
      case 'BLACKOUT':
        let hasValidTarget = false;
        state.board.forEach(t => {
          if (t.ownerId && t.ownerId !== playerId && t.houseCount < HOTEL_LEVEL) {
            hasValidTarget = true;
          }
        });
        if (!hasValidTarget) {
          this._pushEvent('chance_skip', playerId, '', 0, player.position, `Không có mục tiêu hợp lệ để dùng thẻ. Bỏ qua thẻ.`);
          this._advanceTurn();
        } else {
          state.turnPhase = 'chance_attack_select';
          state.pendingChanceEffect = card;
          this._startTurnTimer();
        }
        break;
      case 'CHANCE_FESTIVAL':
        let hasPropertyForFestival = false;
        state.board.forEach(t => { if (t.ownerId === playerId && t.tileType === 'property') hasPropertyForFestival = true; });
        if (!hasPropertyForFestival) {
          this._pushEvent('chance_skip', playerId, '', 0, player.position, `${player.name} không có công trình để tổ chức Festival. Bỏ qua thẻ.`);
          this._advanceTurn();
        } else {
          state.turnPhase = 'chance_festival_city_select';
          this._startTurnTimer();
        }
        break;
      case 'GIVE_CITY':
        if (!hasProperty) {
          this._pushEvent('chance_skip', playerId, '', 0, player.position, `${player.name} không có đất để tặng. Bỏ qua thẻ.`);
          this._advanceTurn();
        } else {
          state.turnPhase = 'chance_give_city_select';
          this._startTurnTimer();
        }
        break;
      case 'GOTO_AIRPORT':
        this._movePlayerTo(playerId, AIRPORT_TILE, false);
        break;
      case 'GOTO_START':
        this._movePlayerTo(playerId, GO_TILE, true);
        break;
      case 'GOTO_ACTIVE_FESTIVAL':
        if (state.activeFestivalTile === -1) {
          this._pushEvent('chance_skip', playerId, '', 0, player.position, `Hiện không có Festival nào đang diễn ra. Bỏ qua thẻ.`);
          this._advanceTurn();
        } else {
          this._movePlayerTo(playerId, state.activeFestivalTile, true);
        }
        break;
      case 'GOTO_FESTIVAL_CORNER':
        this._movePlayerTo(playerId, FESTIVAL_TILE, true);
        break;
      case 'GOTO_TAX':
        this._movePlayerTo(playerId, TAX_TILE, true);
        break;
      case 'GOTO_JAIL':
        this._sendToJail(playerId);
        break;
      case 'BIRTHDAY':
        this._resolveBirthday(playerId);
        break;
      case 'PENALTY':
        this._pushEvent('chance_penalty', playerId, '', PENALTY_AMOUNT, player.position, `${player.name} bị phạt ${formatMoney(PENALTY_AMOUNT)}.`);
        const shortfall = this._applyMoneyChange(playerId, -PENALTY_AMOUNT, 'penalty');
        if (shortfall > 0) {
          let totalSellValue = 0;
          state.board.forEach(t => { if (t.ownerId === playerId) totalSellValue += this._getTileSellValue(t); });
          if (totalSellValue < shortfall) {
            this._doBankrupt(playerId);
          } else {
            player.debtAmount = shortfall;
            player.debtTo = 'bank';
            state.turnPhase = 'pay_debt';
            this._pushEvent('debt_start', playerId, 'bank', shortfall, player.position, `${player.name} không đủ tiền nộp phạt, cần bán tài sản để trả ${formatMoney(shortfall)}!`);
            this._startTurnTimer();
          }
        } else {
          this._advanceTurn();
        }
        break;
      case 'JAIL_CARD':
        if (!player.hasJailCard) {
          player.hasJailCard = true;
          this._pushEvent('chance_jail_card', playerId, '', 0, player.position, `${player.name} nhận được thẻ Ra Tù Miễn Phí!`);
        } else {
          this._pushEvent('chance_skip', playerId, '', 0, player.position, `${player.name} đã có thẻ Ra Tù, thẻ mới không có hiệu lực.`);
        }
        this._advanceTurn();
        break;
    }
  }

  private _handleChanceShieldSelect(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId || state.turnPhase !== 'chance_shield_select') return;

    const parsed = z.object({ tileId: z.number().int() }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId) return;

    tile.isShielded = true;
    this._pushEvent('chance_shield_placed', client.sessionId, '', 0, tile.id, `${state.players.get(client.sessionId)?.name} gắn Khiên Bảo Vệ lên ${tile.name}!`);
    this.turnTimer?.clear();
    this._advanceTurn();
  }

  private _handleChanceAttackSelect(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId || state.turnPhase !== 'chance_attack_select') return;

    const parsed = z.object({ tileId: z.number() }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const tile = state.board.get(String(data.tileId));
    if (!tile || !tile.ownerId || tile.ownerId === client.sessionId || tile.houseCount >= HOTEL_LEVEL) return;

    const targetPlayer = state.players.get(tile.ownerId);
    if (tile.isShielded) {
      tile.isShielded = false;
      this._pushEvent('shield_broken', client.sessionId, tile.ownerId, 0, tile.id, `Khiên Bảo Vệ trên ${tile.name} đã vỡ! Đòn tấn công thất bại.`);
      this.turnTimer?.clear();
      this._advanceTurn();
      return;
    }

    const effect = state.pendingChanceEffect;
    if (effect === 'FORCE_SELL') {
      const value = this._getTileSellValue(tile);
      this._applyMoneyChange(tile.ownerId, value, 'force_sell');
      this._pushEvent('chance_force_sell', client.sessionId, tile.ownerId, value, tile.id, `${targetPlayer?.name} bị ép bán ${tile.name}, nhận lại ${formatMoney(value)}.`);
      this._resetTileEffectsAndOwner(tile);
    } else if (effect === 'SABOTAGE') {
      if (tile.houseCount > 0) {
        tile.houseCount -= 1;
        this._pushEvent('chance_sabotage', client.sessionId, tile.ownerId, 0, tile.id, `${tile.name} bị hạ 1 cấp nhà!`);
        tile.currentRent = this._calculateRent(tile);
      } else {
        this._pushEvent('chance_sabotage', client.sessionId, tile.ownerId, 0, tile.id, `${tile.name} bị hạ xuống thành đất vô chủ!`);
        this._resetTileEffectsAndOwner(tile);
      }
    } else if (effect === 'EARTHQUAKE') {
      this._pushEvent('chance_earthquake', client.sessionId, tile.ownerId, 0, tile.id, `${tile.name} bị Động Đất phá hủy hoàn toàn!`);
      this._resetTileEffectsAndOwner(tile);
    } else if (effect === 'BLACKOUT') {
      tile.isActive = false;
      this._pushEvent('chance_blackout', client.sessionId, tile.ownerId, 0, tile.id, `${tile.name} bị Cúp Điện trong 3 lượt (của ${targetPlayer?.name})!`);
      if (targetPlayer) {
        const tasks = JSON.parse(targetPlayer.blackoutTasksJson || '[]');
        tasks.push({ tileId: tile.id, passesLeft: BLACKOUT_PASSES });
        targetPlayer.blackoutTasksJson = JSON.stringify(tasks);
      }
    }

    this.turnTimer?.clear();
    state.pendingChanceEffect = '';
    this._advanceTurn();
  }

  private _handleChanceGiveCitySelect(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId || state.turnPhase !== 'chance_give_city_select') return;

    const parsed = z.object({ tileId: z.number() }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId) return;

    state.pendingChanceEffect = String(tile.id);
    state.turnPhase = 'chance_give_city_target';
    this._startTurnTimer();
  }

  private _handleChanceGiveCityTarget(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId || state.turnPhase !== 'chance_give_city_target') return;

    const parsed = z.object({ targetId: z.string() }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const targetId = data.targetId;
    const targetPlayer = state.players.get(targetId);
    if (!targetPlayer || targetPlayer.isBankrupt || targetId === client.sessionId) return;

    const tileId = state.pendingChanceEffect;
    const tile = state.board.get(tileId);
    if (!tile || tile.ownerId !== client.sessionId) return;

    this._resetTileEffects(tile);
    tile.ownerId = targetId;
    this._updateAllRents();

    this._pushEvent('chance_give_city', client.sessionId, targetId, 0, tile.id, `${state.players.get(client.sessionId)?.name} tặng ${tile.name} cho ${targetPlayer.name}!`);
    this.turnTimer?.clear();
    state.pendingChanceEffect = '';

    if (this._checkWinCondition(targetId)) return;
    this._advanceTurn();
  }

  private _handleChanceFestivalSelect(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId || state.turnPhase !== 'chance_festival_city_select') return;

    const parsed = z.object({ tileId: z.number() }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId || tile.tileType !== 'property') return;

    state.activeFestivalTile = tile.id;
    this._updateAllRents();
    this._pushEvent('chance_festival', client.sessionId, '', 0, tile.id, `${state.players.get(client.sessionId)?.name} mở Festival tại ${tile.name}! Tiền tô nhân đôi.`);

    this.turnTimer?.clear();
    this._advanceTurn();
  }

  private _handleUseJailCard(client: Client) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
    if (!player || !player.isInJail || !player.hasJailCard) return;

    player.hasJailCard = false;
    player.isInJail = false;
    player.jailTurns = 0;
    this._pushEvent('jail_card_used', client.sessionId, '', 0, JAIL_TILE, `${player.name} dùng thẻ ra tù miễn phí!`);
  }

  private _handleChanceTimeout(playerId: string) {
    const state = this.state;
    if (playerId !== state.currentPlayerId) return;

    const c = { sessionId: playerId } as Client;

    if (state.turnPhase === 'chance_shield_select') {
      const validTiles: MapTile[] = [];
      state.board.forEach(t => { if (t.ownerId === playerId) validTiles.push(t); });
      if (validTiles.length > 0) {
        this._handleChanceShieldSelect(c, { tileId: validTiles[Math.floor(Math.random() * validTiles.length)].id });
      } else {
        this._advanceTurn();
      }
    } else if (state.turnPhase === 'chance_attack_select') {
      const validTiles: MapTile[] = [];
      state.board.forEach(t => { if (t.ownerId && t.ownerId !== playerId && t.houseCount < HOTEL_LEVEL) validTiles.push(t); });
      if (validTiles.length > 0) {
        this._handleChanceAttackSelect(c, { tileId: validTiles[Math.floor(Math.random() * validTiles.length)].id });
      } else {
        this._advanceTurn();
      }
    } else if (state.turnPhase === 'chance_give_city_select') {
      const validTiles: MapTile[] = [];
      state.board.forEach(t => { if (t.ownerId === playerId) validTiles.push(t); });
      if (validTiles.length > 0) {
        this._handleChanceGiveCitySelect(c, { tileId: validTiles[Math.floor(Math.random() * validTiles.length)].id });
      } else {
        this._advanceTurn();
      }
    } else if (state.turnPhase === 'chance_give_city_target') {
      const validPlayers: string[] = [];
      state.players.forEach(p => { if (p.id !== playerId && !p.isBankrupt) validPlayers.push(p.id); });
      if (validPlayers.length > 0) {
        this._handleChanceGiveCityTarget(c, { targetId: validPlayers[Math.floor(Math.random() * validPlayers.length)] });
      } else {
        this._advanceTurn();
      }
    } else if (state.turnPhase === 'chance_festival_city_select') {
      const validTiles: MapTile[] = [];
      state.board.forEach(t => { if (t.ownerId === playerId && t.tileType === 'property') validTiles.push(t); });
      if (validTiles.length > 0) {
        this._handleChanceFestivalSelect(c, { tileId: validTiles[Math.floor(Math.random() * validTiles.length)].id });
      } else {
        this._advanceTurn();
      }
    }
  }

  private _resolveBirthday(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    let totalReceived = 0;

    state.players.forEach(p => {
      if (p.id === playerId || p.isBankrupt) return;
      const shortfall = this._applyMoneyChange(p.id, -BIRTHDAY_AMOUNT, 'birthday_pay');
      const paid = BIRTHDAY_AMOUNT - shortfall;
      totalReceived += paid;

      if (shortfall > 0) {
        let totalSellValue = 0;
        state.board.forEach(t => { if (t.ownerId === p.id) totalSellValue += this._getTileSellValue(t); });

        if (totalSellValue < shortfall) {
          this._doBankrupt(p.id);
        } else {
          p.debtAmount = shortfall;
          p.debtTo = playerId;
          this._pushEvent('debt_start', p.id, playerId, shortfall, p.position, `${p.name} bán tài sản tự động để trả ${formatMoney(shortfall)} mừng sinh nhật!`);
          this._autoSellDebt(p.id);
        }
      }
    });

    this._applyMoneyChange(playerId, totalReceived, 'birthday_receive');
    this._pushEvent('chance_birthday', playerId, '', totalReceived, player.position, `${player.name} nhận được ${formatMoney(totalReceived)} tiền mừng sinh nhật!`);
    this._advanceTurn();
  }

  private _tickBlackoutTasks(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    const tasks: {tileId: number, passesLeft: number}[] = JSON.parse(player.blackoutTasksJson || '[]');
    let changed = false;
    const remaining = tasks.map(t => {
      t.passesLeft -= 1;
      return t;
    }).filter(t => {
      if (t.passesLeft <= 0) {
        const tile = this.state.board.get(String(t.tileId));
        if (tile) tile.isActive = true;
        changed = true;
        return false;
      }
      return true;
    });
    player.blackoutTasksJson = JSON.stringify(remaining);
    if (changed) this._updateAllRents();
  }

  private _resetTileEffects(tile: MapTile) {
    if (this.state.activeFestivalTile === tile.id) {
      this.state.activeFestivalTile = -1;
    }
    tile.isActive = true;
    tile.isShielded = false;
  }

  private _resetTileEffectsAndOwner(tile: MapTile) {
    this._resetTileEffects(tile);
    tile.ownerId = '';
    tile.houseCount = 0;
    const def = MAP_TILES.find(d => d.id === tile.id);
    if (def) {
      tile.baseRent  = def.rent[0] || 0;
      tile.rent1     = def.rent[1] || 0;
      tile.rent2     = def.rent[2] || 0;
      tile.rent3     = def.rent[3] || 0;
      tile.rentHotel = def.rent[4] || 0;
    }
    this._updateAllRents();
  }

  // ─── Debt ────────────────────────────────────────────────────────────────────


  private _handleSellForDebt(client: Client, rawData: any) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'pay_debt') return;

    const parsed = z.object({ tileId: z.number().int().min(0).max(TOTAL_TILES - 1) }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    const player = state.players.get(client.sessionId);
    if (!player || player.debtAmount <= 0) return;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId) return;

    const sellValue = this._getTileSellValue(tile);
    this._resetTileEffectsAndOwner(tile);

    this._pushEvent('sell_debt', client.sessionId, player.debtTo, sellValue, tile.id, `${player.name} bán ${tile.name} thu được ${formatMoney(sellValue)} để trả nợ.`);

    if (sellValue > player.debtAmount) {
      const surplus = sellValue - player.debtAmount;
      this._applyMoneyChange(player.debtTo, player.debtAmount, 'debt_receive');
      this._applyMoneyChange(client.sessionId, surplus, 'debt_surplus');
      player.debtAmount = 0;
    } else {
      this._applyMoneyChange(player.debtTo, sellValue, 'debt_receive');
      player.debtAmount -= sellValue;
    }

    if (player.debtAmount <= 0) {
      this._pushEvent('debt_cleared', client.sessionId, '', 0, -1, `${player.name} đã trả hết nợ!`);
      player.debtAmount = 0;
      player.debtTo = '';
      this._updateAllRents();
      this._advanceTurn();
    }
  }

  private _autoSellDebt(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player || player.debtAmount <= 0) return;

    const ownedTiles: MapTile[] = [];
    state.board.forEach(t => {
      if (t.ownerId === playerId) ownedTiles.push(t);
    });

    ownedTiles.sort((a, b) => this._getTileSellValue(a) - this._getTileSellValue(b));

    for (const t of ownedTiles) {
      if (player.debtAmount <= 0) break;

      const sellValue = this._getTileSellValue(t);
      this._resetTileEffectsAndOwner(t);

      this._pushEvent('sell_debt_auto', playerId, player.debtTo, sellValue, t.id, `${player.name} tự động bán ${t.name} thu được ${formatMoney(sellValue)} để trả nợ.`);

      if (sellValue > player.debtAmount) {
        const surplus = sellValue - player.debtAmount;
        this._applyMoneyChange(player.debtTo, player.debtAmount, 'debt_receive');
        this._applyMoneyChange(playerId, surplus, 'debt_surplus');
        player.debtAmount = 0;
      } else {
        this._applyMoneyChange(player.debtTo, sellValue, 'debt_receive');
        player.debtAmount -= sellValue;
      }
    }

    if (player.debtAmount > 0) {
      this._doBankrupt(playerId);
    } else {
      player.debtAmount = 0;
      player.debtTo = '';
      this._updateAllRents();
      if (playerId === state.currentPlayerId) {
        this._advanceTurn();
      }
    }
  }

  // ─── Chat ────────────────────────────────────────────────────────────────────

  private _handleChat(client: Client, rawData: any) {
    const state = this.state;
    const player = state.players.get(client.sessionId);

    const parsed = z.object({ text: z.string().max(500) }).safeParse(rawData);
    if (!parsed.success) return;
    const data = parsed.data;

    if (!player || !data.text?.trim()) return;

    const msg = new ChatMessage();
    msg.playerId = client.sessionId;
    msg.playerName = player.name;
    msg.text = data.text.trim().substring(0, 200); // sanitize length
    msg.timestamp = Date.now();
    state.chat.push(msg);

    // Keep chat history lean
    if (state.chat.length > 100) state.chat.splice(0, 1);
  }

  // ─── Bankrupt ────────────────────────────────────────────────────────────────

  private _doBankrupt(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    player.isBankrupt = true;

    let totalLiquidation = 0;

    // Release all owned tiles and calculate liquidation value
    state.board.forEach((tile: MapTile) => {
      if (tile.ownerId === playerId) {
        totalLiquidation += this._getTileSellValue(tile);
        this._resetTileEffectsAndOwner(tile);
      }
    });

    const totalFunds = player.money + totalLiquidation;

    // Pay creditor if they owe money
    if (player.debtAmount > 0 && player.debtTo && player.debtTo !== 'bank') {
      const payAmount = Math.min(player.debtAmount, totalFunds);
      if (payAmount > 0) {
        this._applyMoneyChange(player.debtTo, payAmount, 'debt_collection');
        const creditor = state.players.get(player.debtTo);
        this._pushEvent('bankrupt_payout', player.debtTo, '', payAmount, -1, `${creditor?.name} nhận ${formatMoney(payAmount)} từ tài sản thanh lý của ${player.name}.`);
      }
    }

    player.money = 0;
    player.debtAmount = 0;
    player.debtTo = '';

    this._pushEvent('bankrupt', playerId, '', 0, -1, `${player.name} phá sản! Toàn bộ đất được thanh lý cho ngân hàng.`);
    this._updateAllRents();

    const activePlayers = Array.from(state.turnOrder).filter((id): id is string => {
      if (!id) return false;
      const p = state.players.get(id);
      return !!(p && !p.isBankrupt);
    });

    if (activePlayers.length <= 1) {
      this._endGame(activePlayers[0] || '');
    } else {
      this._advanceTurn();
    }
  }

  // ─── Turn Advance ─────────────────────────────────────────────────────────────

  private _advanceTurn() {
    const state = this.state;
    this.turnTimer?.clear();
    state.pendingChanceEffect = '';

    const curPlayer = state.players.get(state.currentPlayerId);

    // Check doubles for extra turn
    if (state.dice.isDouble && state.doublesCount > 0 && state.doublesCount < 3 && curPlayer && !curPlayer.isBankrupt) {
      state.turnPhase = 'wait_roll';
      this._startTurnTimer();

      // Bot auto-play is handled inside _startTurnTimer
      return;
    }

    state.doublesCount = 0;

    // Move to next player
    let nextIdx = (state.currentPlayerIdx + 1) % state.turnOrder.length;
    let attempts = 0;
    while (attempts < state.turnOrder.length) {
      const nextId = state.turnOrder[nextIdx] ?? '';
      const nextPlayer = state.players.get(nextId);
      if (nextPlayer && !nextPlayer.isBankrupt) break;
      nextIdx = (nextIdx + 1) % (state.turnOrder.length || 1);
      attempts++;
    }

    state.currentPlayerIdx = nextIdx;
    state.currentPlayerId = state.turnOrder[nextIdx] ?? '';
    state.turnNumber += 1;
    state.turnPhase = 'wait_roll';

    this._startTurnTimer();

    // Bot auto-play is handled inside _startTurnTimer
  }

  // ─── Game Over ───────────────────────────────────────────────────────────────

  private _checkWinCondition(playerId: string): boolean {
    return this._checkPortWin(playerId) || this._checkLineWin(playerId) || this._checkTripleMonopolyWin(playerId);
  }

  private _checkPortWin(playerId: string): boolean {
    let portCount = 0;
    this.state.board.forEach(t => {
      if (t.tileType === 'port' && t.ownerId === playerId) portCount++;
    });
    if (portCount >= 4) {
      this._endGame(playerId, 'Sở hữu 4 cảng - ĐỘC QUYỀN CẢNG!');
      return true;
    }
    return false;
  }

  private _checkLineWin(playerId: string): boolean {
    const lines = [
      { start: 1, end: 7, name: 'Hàng 1 (Cạnh Dưới)' },
      { start: 9, end: 15, name: 'Hàng 2 (Cạnh Trái)' },
      { start: 17, end: 23, name: 'Hàng 3 (Cạnh Trên)' },
      { start: 25, end: 31, name: 'Hàng 4 (Cạnh Phải)' }
    ];

    for (const line of lines) {
      let purchasableCount = 0;
      let ownedCount = 0;

      for (let id = line.start; id <= line.end; id++) {
        const tile = this.state.board.get(String(id));
        if (tile && (tile.tileType === 'property' || tile.tileType === 'port')) {
          purchasableCount++;
          if (tile.ownerId === playerId) {
            ownedCount++;
          }
        }
      }

      if (purchasableCount > 0 && ownedCount === purchasableCount) {
        this._endGame(playerId, `Độc quyền toàn bộ ${line.name} - LINE MONOPOLY!`);
        return true;
      }
    }

    return false;
  }

  private _checkTripleMonopolyWin(playerId: string): boolean {
    const monopolizedGroups = new Set<string>();
    this.state.board.forEach(t => {
      if (t.ownerId === playerId && t.hasMonopoly && t.colorGroup) {
        monopolizedGroups.add(t.colorGroup);
      }
    });

    if (monopolizedGroups.size >= 3) {
      this._endGame(playerId, 'Sở hữu 3 nhóm màu Độc Quyền - TRIPLE MONOPOLY!');
      return true;
    }
    return false;
  }

  private _endGame(winnerId: string, customMessage?: string) {
    const state = this.state;
    state.gamePhase = 'ended';
    state.turnPhase = 'game_over';
    state.winnerId = winnerId;
    this.turnTimer?.clear();
    this.gameTimer?.clear();

    const winner = state.players.get(winnerId);
    const msg = customMessage ? `🏆 ${winner?.name || 'Không có ai'} đã thắng: ${customMessage}` : `🏆 ${winner?.name || 'Không có ai'} giành chiến thắng!`;
    this._pushEvent('game_over', winnerId, '', 0, -1, msg);

    // Auto-dispose room after 60s
    this.clock.setTimeout(() => this.disconnect(), 60_000);
  }

  // ─── Bot AI ──────────────────────────────────────────────────────────────────

  private _scheduleBotTurn(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    player.disconnectedTurns += 1;

    if (player.disconnectedTurns > BOT_TAKEOVER_TURNS) {
      // Eliminate player
      this._doBankrupt(playerId);
      return;
    }
    // Bot will handle via _scheduleBotAction when it's their turn
  }

  private _scheduleBotAction() {
    const state = this.state;
    const playerId = state.currentPlayerId;
    const player = state.players.get(playerId);
    if (!player || !player.isBot) return;

    // Delay bot action to feel natural
    const delay = 1500 + Math.random() * 1500;

    // Clear any existing timer for this bot so we don't queue multiple actions
    this._clearBotTimer(playerId);

    const timer = setTimeout(() => {
      if (state.currentPlayerId !== playerId) return;

      if (state.turnPhase === 'wait_roll') {
        this._doRollDice(playerId, true);
      } else if (state.turnPhase === 'buy_decision') {
        const tile = state.board.get(String(player.position));
        if (tile) {
          const maxHouses = tile.tileType === 'property' ? this._getMaxHouses(player, 0) : 0;
          let affordableHouses = -1;
          for (let h = maxHouses; h >= 0; h--) {
            const cost = tile.price + (tile.tileType === 'port' ? 0 : h * tile.buildCost);
            if (player.money >= cost) {
              affordableHouses = h;
              break;
            }
          }
          if (affordableHouses >= 0) {
            this._doBuyProperty(playerId, affordableHouses);
          } else {
            this._doSkipBuy(playerId);
          }
        } else {
          this._doSkipBuy(playerId);
        }
      } else if (state.turnPhase === 'upgrade_decision') {
        const tile = state.board.get(String(player.position));
        if (tile) {
          const maxHouses = this._getMaxHouses(player, tile.houseCount);
          let affordableTarget = -1;
          for (let h = maxHouses; h > tile.houseCount; h--) {
            let cost = 0;
            for (let i = tile.houseCount + 1; i <= h; i++) {
              cost += (i === 4 ? tile.hotelCost : tile.buildCost);
            }
            if (player.money >= cost) {
              affordableTarget = h;
              break;
            }
          }
          if (affordableTarget > tile.houseCount) {
            // Fake client to call _handleUpgradeProperty
            this._handleUpgradeProperty({ sessionId: playerId } as Client, { targetHouses: affordableTarget });
          } else {
            this._doSkipUpgrade(playerId);
          }
        } else {
          this._doSkipUpgrade(playerId);
        }
      } else if (state.turnPhase === 'go_remote_upgrade') {
        let bestTile: any = null;
        let bestAffordableTarget = -1;
        let bestCost = 0;

        state.board.forEach((t) => {
          if (t.ownerId === playerId && t.tileType === 'property') {
            const maxHouses = this._getMaxHouses(player, t.houseCount);
            if (maxHouses > t.houseCount) {
              for (let h = maxHouses; h > t.houseCount; h--) {
                let cost = 0;
                for (let i = t.houseCount + 1; i <= h; i++) {
                  cost += (i === 4 ? t.hotelCost : t.buildCost);
                }
                if (player.money >= cost) {
                  if (cost > bestCost) {
                    bestCost = cost;
                    bestAffordableTarget = h;
                    bestTile = t;
                  }
                  break;
                }
              }
            }
          }
        });

        if (bestTile && bestAffordableTarget > bestTile.houseCount) {
          this._handleRemoteUpgradeProperty({ sessionId: playerId } as Client, { tileId: bestTile.id, targetHouses: bestAffordableTarget });
        } else {
          this._doSkipRemoteUpgrade(playerId);
        }
      } else if (state.turnPhase === 'buyout_decision') {
        // Bot doesn't buyout yet, just skip
        this._doSkipBuyout(playerId);
      } else if (state.turnPhase === 'airport_select') {
        this._advanceTurn();
      } else if (state.turnPhase === 'festival_select') {
        let bestTile: any = null;
        let highestRent = -1;
        state.board.forEach((t) => {
          if (t.ownerId === playerId && t.tileType === 'property') {
            const rent = this._calculateRent(t);
            if (rent > highestRent) {
              highestRent = rent;
              bestTile = t;
            }
          }
        });
        if (bestTile && player.money >= 50) {
          this._handleFestivalSelect({ sessionId: playerId } as Client, { tileId: bestTile.id });
        } else {
          this._doSkipFestival(playerId);
        }
      } else if (state.turnPhase.startsWith('chance_')) {
        this._handleChanceTimeout(playerId);
      } else if (state.turnPhase === 'pay_debt') {
        this._autoSellDebt(playerId);
      }
    }, delay);

    this.botTimers.set(playerId, timer);
  }

  private _clearBotTimer(playerId: string) {
    const t = this.botTimers.get(playerId);
    if (t) { clearTimeout(t); this.botTimers.delete(playerId); }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  /**
   * Apply money delta. Returns shortfall (positive = player went negative).
   */
  private _applyMoneyChange(playerId: string, amount: number, _reason: string): number {
    const player = this.state.players.get(playerId);
    if (!player) return 0;
    player.money += amount;
    if (player.money < 0) {
      const shortfall = Math.abs(player.money);
      player.money = 0;
      return shortfall;
    }
    return 0;
  }

  private _getTileSellValue(tile: MapTile): number {
    let value = tile.price;
    if (tile.tileType !== 'port' && tile.houseCount > 0) {
      if (tile.houseCount === 4) {
        value += (tile.buildCost * 3 + tile.hotelCost);
      } else {
        value += tile.houseCount * tile.buildCost;
      }
    }
    return Math.floor(value * 0.5);
  }

  private _pushEvent(type: string, playerId: string, targetId: string, amount: number, tileId: number, message: string) {
    const ev = new GameEvent();
    ev.type      = type;
    ev.playerId  = playerId;
    ev.targetId  = targetId;
    ev.amount    = amount;
    ev.tileId    = tileId;
    ev.message   = message;
    ev.timestamp = Date.now();
    this.state.events.push(ev);
    // Keep event log lean
    if (this.state.events.length > 50) this.state.events.splice(0, 1);
    console.log(`[Event] ${message}`);
  }

  private _shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

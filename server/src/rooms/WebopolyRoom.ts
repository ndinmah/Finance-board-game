import { Room, Client, Delayed } from '@colyseus/core';
import {
  GameState, Player, MapTile, Dice, ChatMessage, GameEvent,
  GamePhase, TurnPhase
} from '../schema/GameState';
import {
  MAP_TILES, COLOR_GROUPS, TOTAL_TILES,
  GO_TILE, JAIL_TILE, FESTIVAL_TILE, AIRPORT_TILE,
  GO_SALARY, BAIL_COST, STARTING_MONEY,
  MAX_PLAYERS, MIN_PLAYERS, TURN_TIMEOUT_MS, BOT_TAKEOVER_TURNS
} from '../config/mapData';

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const MOVE_ANIMATION_MS = 800; // time client needs to animate movement

export class WebopolyRoom extends Room<GameState> {
  maxClients = MAX_PLAYERS;
  private turnTimer: Delayed | null = null;
  private botTimers: Map<string, NodeJS.Timeout> = new Map();

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  onCreate(options: any) {
    this.setState(new GameState());
    this._initBoard();
    this.setMetadata({ isPrivate: !!options.isPrivate, roomCode: options.roomCode || '' });

    // Register message handlers
    this.onMessage('ready',           (client) => this._handleReady(client));
    this.onMessage('rollDice',        (client) => this._handleRollDice(client));
    this.onMessage('buyProperty',     (client) => this._handleBuyProperty(client));
    this.onMessage('skipBuy',         (client) => this._handleSkipBuy(client));
    this.onMessage('upgradeProperty', (client, data) => this._handleUpgrade(client, data));
    this.onMessage('mortgageProperty',(client, data) => this._handleMortgage(client, data));
    this.onMessage('payBail',         (client) => this._handlePayBail(client));
    this.onMessage('selectAirport',   (client, data) => this._handleAirportSelect(client, data));
    this.onMessage('selectFestival',  (client, data) => this._handleFestivalSelect(client, data));
    this.onMessage('animationDone',   (client) => this._handleAnimationDone(client));
    this.onMessage('chat',            (client, data) => this._handleChat(client, data));

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
      tile.mortgageValue = def.mortgageValue || 0;
      tile.baseRent   = def.rent[0] || 0;
      tile.rent1      = def.rent[1] || 0;
      tile.rent2      = def.rent[2] || 0;
      tile.rent3      = def.rent[3] || 0;
      tile.rentHotel  = def.rent[4] || 0;
      this.state.board.set(String(def.id), tile);
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
    this._startTurnTimer();
    console.log('[WebopolyRoom] Game started. Turn order:', ids);
  }

  // ─── Turn Timer ──────────────────────────────────────────────────────────────

  private _startTurnTimer() {
    this.turnTimer?.clear();
    this.turnTimer = this.clock.setTimeout(() => {
      const state = this.state;
      const curPlayer = state.players.get(state.currentPlayerId);
      if (!curPlayer) return;
      // Auto-roll or auto-skip depending on phase
      if (state.turnPhase === 'wait_roll') {
        this._doRollDice(state.currentPlayerId, true);
      } else if (state.turnPhase === 'buy_decision') {
        this._doSkipBuy(state.currentPlayerId);
      } else if (state.turnPhase === 'airport_select') {
        // Default: skip airport bonus
        this._advanceTurn();
      } else if (state.turnPhase === 'festival_select') {
        this._advanceTurn();
      }
    }, TURN_TIMEOUT_MS);
  }

  // ─── Roll Dice ───────────────────────────────────────────────────────────────

  private _handleRollDice(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'wait_roll') return;
    this._doRollDice(client.sessionId, false);
  }

  private _doRollDice(playerId: string, isAuto: boolean) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player || player.isBankrupt) return;

    // Server-side RNG — client cannot influence this
    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const isDouble = die1 === die2;

    state.dice.die1 = die1;
    state.dice.die2 = die2;
    state.dice.isDouble = isDouble;

    // Jail logic
    if (player.isInJail) {
      if (isDouble) {
        player.isInJail = false;
        player.jailTurns = 0;
        this._pushEvent('jail_exit', playerId, '', 0, JAIL_TILE, `${player.name} đổ được đôi, thoát tù!`);
      } else {
        player.jailTurns -= 1;
        if (player.jailTurns <= 0) {
          // Must pay bail
          player.isInJail = false;
          player.jailTurns = 0;
          this._applyMoneyChange(playerId, -BAIL_COST, 'bail');
          this._pushEvent('jail_bail', playerId, '', BAIL_COST, JAIL_TILE, `${player.name} hết lượt trong tù, trả ${BAIL_COST.toLocaleString()}đ tiền bảo lãnh.`);
        } else {
          this._pushEvent('jail_stay', playerId, '', 0, JAIL_TILE, `${player.name} ở lại tù (còn ${player.jailTurns} lượt).`);
          this._advanceTurn();
          return;
        }
      }
    }

    // Airport override: fly to selected tile
    if (player.airportTarget >= 0) {
      const target = player.airportTarget;
      player.airportTarget = -1;
      this._movePlayerTo(playerId, target, true);
      return;
    }

    // Normal move
    const steps = die1 + die2;
    const newPos = (player.position + steps) % TOTAL_TILES;

    // Check if passing Go
    if (newPos < player.position || (player.position + steps >= TOTAL_TILES)) {
      this._applyMoneyChange(playerId, GO_SALARY, 'go_salary');
      this._pushEvent('go_salary', playerId, '', GO_SALARY, GO_TILE, `${player.name} qua ô Xuất Phát, nhận ${GO_SALARY.toLocaleString()}đ lương!`);
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
      this._applyMoneyChange(playerId, GO_SALARY, 'go_salary');
      this._pushEvent('go_salary', playerId, '', GO_SALARY, GO_TILE, `${player.name} qua Xuất Phát, nhận ${GO_SALARY.toLocaleString()}đ!`);
    }

    state.turnPhase = 'moving';
    player.position = target;
    this.clock.setTimeout(() => this._processLanding(playerId), MOVE_ANIMATION_MS);
  }

  private _sendToJail(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
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
        // Already collected salary when passing; landing gives extra
        this._applyMoneyChange(playerId, GO_SALARY, 'go_land');
        this._pushEvent('go_land', playerId, '', GO_SALARY, tile.id, `${player.name} đứng đúng ô Xuất Phát, nhận thêm ${GO_SALARY.toLocaleString()}đ!`);
        this._advanceTurn();
        break;

      case 'jail':
        // Just visiting — no penalty
        this._pushEvent('jail_visit', playerId, '', 0, tile.id, `${player.name} đang thăm tù.`);
        this._advanceTurn();
        break;

      case 'festival':
        this._processFestival(playerId);
        break;

      case 'airport':
        this._processAirport(playerId);
        break;

      case 'port':
        // Special port tile: collect a small bonus
        const portBonus = 500;
        this._applyMoneyChange(playerId, portBonus, 'port');
        this._pushEvent('port', playerId, '', portBonus, tile.id, `${player.name} ghé cảng, nhận ${portBonus.toLocaleString()}đ phí dịch vụ!`);
        this._advanceTurn();
        break;

      case 'property':
        this._processProperty(playerId, tile);
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
        this._pushEvent('buy_offer', playerId, '', tile.price, tile.id, `${player.name} đứng trên ${tile.name}. Mua với giá ${tile.price.toLocaleString()}đ?`);
      } else {
        // Can't afford — skip
        this._pushEvent('buy_skip', playerId, '', tile.price, tile.id, `${player.name} không đủ tiền mua ${tile.name}.`);
        this._advanceTurn();
      }
    } else if (tile.ownerId === playerId) {
      // Own property — nothing happens
      this._pushEvent('own_land', playerId, '', 0, tile.id, `${player.name} đứng trên đất của mình.`);
      this._advanceTurn();
    } else if (tile.isMortgaged) {
      // Mortgaged — no rent
      this._pushEvent('mortgaged', playerId, '', 0, tile.id, `${tile.name} đang bị cầm cố, không thu tô.`);
      this._advanceTurn();
    } else {
      // Pay rent
      const rent = this._calculateRent(tile);
      const owner = state.players.get(tile.ownerId);
      if (!owner || owner.isBankrupt) {
        this._advanceTurn();
        return;
      }

      this._pushEvent('rent', playerId, tile.ownerId, rent, tile.id,
        `${player.name} trả ${rent.toLocaleString()}đ tiền tô cho ${owner.name} (${tile.name})`);

      const shortfall = this._applyMoneyChange(playerId, -rent, 'rent');
      if (shortfall > 0) {
        // Player bankrupt — transfer what they have
        this._applyMoneyChange(tile.ownerId, player.money + rent - shortfall, 'rent_receive');
        this._doBankrupt(playerId);
      } else {
        this._applyMoneyChange(tile.ownerId, rent, 'rent_receive');
        this._advanceTurn();
      }
    }
  }

  private _calculateRent(tile: MapTile): number {
    const state = this.state;
    let rent = 0;
    switch (tile.houseCount) {
      case 0: rent = tile.baseRent; break;
      case 1: rent = tile.rent1; break;
      case 2: rent = tile.rent2; break;
      case 3: rent = tile.rent3; break;
      case 4: rent = tile.rentHotel; break;
      default: rent = tile.baseRent;
    }
    // Monopoly bonus: x2 base rent if owner has all tiles in group (no houses)
    if (tile.houseCount === 0 && tile.colorGroup) {
      const group = COLOR_GROUPS[tile.colorGroup] || [];
      const ownerHasAll = group.every(id => {
        const t = state.board.get(String(id));
        return t && t.ownerId === tile.ownerId;
      });
      if (ownerHasAll) rent *= 2;
    }
    return rent;
  }

  // ─── Buy / Skip ──────────────────────────────────────────────────────────────

  private _handleBuyProperty(client: Client) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'buy_decision') return;
    this._doBuyProperty(client.sessionId);
  }

  private _doBuyProperty(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;
    const tile = state.board.get(String(player.position));
    if (!tile || tile.ownerId || tile.tileType !== 'property') return;
    if (player.money < tile.price) return;

    this._applyMoneyChange(playerId, -tile.price, 'buy');
    tile.ownerId = playerId;

    this._pushEvent('buy', playerId, '', tile.price, tile.id, `${player.name} mua ${tile.name} với giá ${tile.price.toLocaleString()}đ!`);
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

  // ─── Upgrade / Mortgage ───────────────────────────────────────────────────────

  private _handleUpgrade(client: Client, data: { tileId: number }) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
    if (!player || player.isBankrupt) return;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId || tile.tileType !== 'property') return;
    if (tile.houseCount >= 4 || tile.isMortgaged) return;

    // Must own entire color group to build
    const group = COLOR_GROUPS[tile.colorGroup] || [];
    const ownsAll = group.every(id => {
      const t = state.board.get(String(id));
      return t && t.ownerId === client.sessionId;
    });
    if (!ownsAll) { client.send('error', { message: 'Cần sở hữu toàn bộ nhóm màu để xây nhà!' }); return; }

    if (player.money < tile.buildCost) { client.send('error', { message: 'Không đủ tiền xây!' }); return; }

    this._applyMoneyChange(client.sessionId, -tile.buildCost, 'build');
    tile.houseCount += 1;
    const label = tile.houseCount === 4 ? 'Khách sạn' : `Nhà cấp ${tile.houseCount}`;
    this._pushEvent('upgrade', client.sessionId, '', tile.buildCost, tile.id, `${player.name} xây ${label} trên ${tile.name}!`);
  }

  private _handleMortgage(client: Client, data: { tileId: number }) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
    if (!player || player.isBankrupt) return;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId || tile.isMortgaged) return;

    tile.isMortgaged = true;
    tile.houseCount = 0; // remove all houses
    this._applyMoneyChange(client.sessionId, tile.mortgageValue, 'mortgage');
    this._pushEvent('mortgage', client.sessionId, '', tile.mortgageValue, tile.id, `${player.name} cầm cố ${tile.name}, nhận ${tile.mortgageValue.toLocaleString()}đ.`);
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
    this._pushEvent('jail_bail', client.sessionId, '', BAIL_COST, JAIL_TILE, `${player.name} nộp ${BAIL_COST.toLocaleString()}đ thoát tù!`);
  }

  // ─── Festival (Corner 16) ────────────────────────────────────────────────────

  private _processFestival(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    // Find tiles owned by this player
    const ownedTiles = Array.from(state.board.values() as Iterable<MapTile>).filter(
      (t: MapTile) => t.ownerId === playerId && t.tileType === 'property' && !t.isMortgaged
    );

    if (ownedTiles.length === 0) {
      this._pushEvent('festival_skip', playerId, '', 0, FESTIVAL_TILE, `${player.name} không có đất để nhân đôi tô.`);
      this._advanceTurn();
      return;
    }

    state.turnPhase = 'festival_select';
    this._startTurnTimer();
    this._pushEvent('festival', playerId, '', 0, FESTIVAL_TILE, `${player.name} đến Lễ Hội! Chọn 1 thành phố để nhân đôi tô.`);
  }

  private _handleFestivalSelect(client: Client, data: { tileId: number }) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'festival_select') return;

    const tile = state.board.get(String(data.tileId));
    if (!tile || tile.ownerId !== client.sessionId) return;

    tile.baseRent  *= 2;
    tile.rent1     *= 2;
    tile.rent2     *= 2;
    tile.rent3     *= 2;
    tile.rentHotel *= 2;

    const player = state.players.get(client.sessionId);
    this._pushEvent('festival_done', client.sessionId, '', 0, data.tileId,
      `${player?.name} nhân đôi giá trị tô của ${tile.name}!`);
    this._advanceTurn();
  }

  // ─── Airport (Corner 24) ─────────────────────────────────────────────────────

  private _processAirport(playerId: string) {
    const state = this.state;
    const player = state.players.get(playerId);
    if (!player) return;

    state.turnPhase = 'airport_select';
    this._startTurnTimer();
    this._pushEvent('airport', playerId, '', 0, AIRPORT_TILE, `${player.name} đến Sân Bay! Chọn điểm đến lượt kế tiếp.`);
  }

  private _handleAirportSelect(client: Client, data: { tileId: number }) {
    const state = this.state;
    if (client.sessionId !== state.currentPlayerId) return;
    if (state.turnPhase !== 'airport_select') return;
    if (data.tileId < 0 || data.tileId >= TOTAL_TILES) return;

    const player = state.players.get(client.sessionId);
    if (!player) return;

    player.airportTarget = data.tileId;
    const targetTile = state.board.get(String(data.tileId));
    this._pushEvent('airport_select', client.sessionId, '', 0, data.tileId,
      `${player.name} sẽ bay đến ${targetTile?.name || 'ô ' + data.tileId} lượt sau!`);
    this._advanceTurn();
  }

  // ─── Chat ────────────────────────────────────────────────────────────────────

  private _handleChat(client: Client, data: { text: string }) {
    const state = this.state;
    const player = state.players.get(client.sessionId);
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
    player.money = 0;

    // Release all owned tiles
    state.board.forEach((tile: MapTile) => {
      if (tile.ownerId === playerId) {
        tile.ownerId = '';
        tile.houseCount = 0;
        tile.isMortgaged = false;
        // Reset rents (festival may have doubled them)
        const def = MAP_TILES.find(d => d.id === tile.id);
        if (def) {
          tile.baseRent  = def.rent[0] || 0;
          tile.rent1     = def.rent[1] || 0;
          tile.rent2     = def.rent[2] || 0;
          tile.rent3     = def.rent[3] || 0;
          tile.rentHotel = def.rent[4] || 0;
        }
      }
    });

    this._pushEvent('bankrupt', playerId, '', 0, -1, `${player.name} phá sản! Toàn bộ đất trở thành đất trống.`);

    // Remove from turn order
    const idx = state.turnOrder.indexOf(playerId);
    if (idx >= 0) state.turnOrder.splice(idx, 1);
    if (state.currentPlayerIdx >= state.turnOrder.length) state.currentPlayerIdx = 0;

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

    // Check doubles for extra turn
    if (state.dice.isDouble && state.doublesCount > 0 && state.doublesCount < 3) {
      state.turnPhase = 'wait_roll';
      this._startTurnTimer();

      // Bot auto-play
      const curPlayer = state.players.get(state.currentPlayerId);
      if (curPlayer?.isBot) this._scheduleBotAction();
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

    // Bot auto-play
    const curPlayer = state.players.get(state.currentPlayerId);
    if (curPlayer?.isBot) this._scheduleBotAction();
  }

  // ─── Game Over ───────────────────────────────────────────────────────────────

  private _endGame(winnerId: string) {
    const state = this.state;
    state.gamePhase = 'ended';
    state.turnPhase = 'game_over';
    state.winnerId = winnerId;
    this.turnTimer?.clear();

    const winner = state.players.get(winnerId);
    this._pushEvent('game_over', winnerId, '', 0, -1, `🏆 ${winner?.name || 'Không có ai'} giành chiến thắng!`);

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
    // Delay bot action to feel natural
    const delay = 1500 + Math.random() * 1500;
    const timer = setTimeout(() => {
      this._doRollDice(this.state.currentPlayerId, true);
    }, delay);
    this.botTimers.set(this.state.currentPlayerId, timer);
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

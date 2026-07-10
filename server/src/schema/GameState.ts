import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';

// ─── MapTile Schema ───────────────────────────────────────────────────────────
export class MapTile extends Schema {
  @type('number') id: number = 0;
  @type('string') name: string = '';
  @type('string') tileType: string = 'property';
  @type('string') colorGroup: string = '';
  @type('number') price: number = 0;
  @type('number') buildCost: number = 0;
  @type('number') hotelCost: number = 0;
  @type('string') ownerId: string = '';    // '' = unowned
  @type('number') houseCount: number = 0;  // 0-3 = houses, 4 = hotel
  @type('boolean') hasMonopoly: boolean = false;
  @type('number') baseRent: number = 0;
  @type('number') rent1: number = 0;
  @type('number') rent2: number = 0;
  @type('number') rent3: number = 0;
  @type('number') rentHotel: number = 0;
  @type('number') currentRent: number = 0;
  @type('boolean') isTouristSpot: boolean = false;
}

// ─── Player Schema ────────────────────────────────────────────────────────────
export class Player extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') position: number = 0;
  @type('number') money: number = 0;
  @type('boolean') isInJail: boolean = false;
  @type('number') jailTurns: number = 0;       // turns remaining in jail
  @type('boolean') isBankrupt: boolean = false;
  @type('boolean') isConnected: boolean = true;
  @type('number') disconnectedTurns: number = 0;
  @type('string') color: string = '';           // token color
  @type('string') avatarIndex: string = '0';
  @type('boolean') isReady: boolean = false;
  @type('boolean') isBot: boolean = false;
  // Airport: target tile for next move
  @type('number') airportTarget: number = -1;
  // Festival: applied flag
  @type('boolean') hasFestivalBonus: boolean = false;
  @type('number') passCount: number = 0;
  // Debt: amount owed and to whom
  @type('number') debtAmount: number = 0;
  @type('string') debtTo: string = '';
}

// ─── Dice Schema ──────────────────────────────────────────────────────────────
export class Dice extends Schema {
  @type('number') die1: number = 1;
  @type('number') die2: number = 1;
  @type('boolean') isDouble: boolean = false;
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
export class ChatMessage extends Schema {
  @type('string') playerId: string = '';
  @type('string') playerName: string = '';
  @type('string') text: string = '';
  @type('number') timestamp: number = 0;
}

// ─── Game Event (for event log) ───────────────────────────────────────────────
export class GameEvent extends Schema {
  @type('string') type: string = '';   // 'rent', 'buy', 'upgrade', 'bankrupt', etc.
  @type('string') playerId: string = '';
  @type('string') targetId: string = ''; // affected player
  @type('number') amount: number = 0;
  @type('number') tileId: number = 0;
  @type('string') message: string = '';
  @type('number') timestamp: number = 0;
}

// ─── Game Phase / Turn Phase ──────────────────────────────────────────────────
export type GamePhase = 'waiting' | 'playing' | 'ended';
export type TurnPhase =
  | 'wait_roll'       // waiting for current player to roll
  | 'moving'          // animation in progress (client-side)
  | 'land_event'      // processing tile event
  | 'buy_decision'    // waiting for buy/skip decision
  | 'buyout_decision' // waiting for buyout/skip decision
  | 'upgrade_decision'// waiting for upgrade/skip decision
  | 'airport_select'  // waiting for airport destination select
  | 'festival_select' // waiting for festival city select
  | 'go_remote_upgrade' // waiting for remote upgrade when landing on go
  | 'pay_debt'        // waiting for player to sell properties to pay debt
  | 'game_over';

// ─── Root GameState Schema ────────────────────────────────────────────────────
export class GameState extends Schema {
  @type('string') gamePhase: GamePhase = 'waiting';
  @type('string') turnPhase: TurnPhase = 'wait_roll';
  @type('string') currentPlayerId: string = '';
  @type('number') currentPlayerIdx: number = 0;
  @type('number') turnNumber: number = 0;
  @type('number') doublesCount: number = 0;   // consecutive doubles this turn
  @type('string') winnerId: string = '';

  @type('number') activeFestivalTile: number = -1;

  @type({ map: Player })  players = new MapSchema<Player>();
  @type({ map: MapTile }) board   = new MapSchema<MapTile>();
  @type([ChatMessage])    chat    = new ArraySchema<ChatMessage>();
  @type([GameEvent])      events  = new ArraySchema<GameEvent>();
  @type(Dice)             dice    = new Dice();

  // Turn order (ordered list of player IDs)
  @type(['string']) turnOrder = new ArraySchema<string>();
}

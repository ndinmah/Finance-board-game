// Map configuration - Data-driven tile definitions
// Layout: 32 tiles total = 4 corners + 28 regular tiles (7 per side)
// Each side: 2 color groups (3 tiles each) + 1 special (port/station)

export type TileType = 'go' | 'jail' | 'festival' | 'airport' | 'property' | 'port' | 'tax' | 'chance';

export interface TileDef {
  id: number;          // 0–31, clockwise from bottom-left corner
  type: TileType;
  name: string;
  colorGroup?: string; // e.g. 'red', 'blue', etc.
  price?: number;
  rent: number[];      // [base, house1, house2, house3, hotel]
  buildCost?: number;
  mortgageValue?: number;
  taxAmount?: number;
  icon?: string;
}

// 8 color groups, 3 tiles each = 24 property tiles
// 4 port/special tiles (one per side)
// 4 corner tiles
// Total: 24 + 4 + 4 = 32

export const MAP_TILES: TileDef[] = [
  // ─── CORNER 0: GO ───
  { id: 0,  type: 'go',       name: 'Xuất Phát',  rent: [] },

  // ─── SIDE BOTTOM (left→right): ids 1–7 ───
  // Color group: RED (tiles 1,2,3)
  { id: 1,  type: 'property', name: 'Hà Nội',     colorGroup: 'red',    price: 6000,  rent: [500,  1000, 2000, 4000, 8000],  buildCost: 1500, mortgageValue: 3000 },
  { id: 2,  type: 'property', name: 'Hải Phòng',  colorGroup: 'red',    price: 6000,  rent: [500,  1000, 2000, 4000, 8000],  buildCost: 1500, mortgageValue: 3000 },
  { id: 3,  type: 'property', name: 'Nam Định',   colorGroup: 'red',    price: 8000,  rent: [700,  1400, 2800, 5600, 11200], buildCost: 1500, mortgageValue: 4000 },
  // Port (id 4)
  { id: 4,  type: 'port',     name: 'Cảng Bắc',   rent: [] },
  // Color group: ORANGE (tiles 5,6,7)
  { id: 5,  type: 'property', name: 'Ninh Bình',  colorGroup: 'orange', price: 10000, rent: [900,  1800, 3600, 7200, 14400], buildCost: 2000, mortgageValue: 5000 },
  { id: 6,  type: 'property', name: 'Thanh Hoá',  colorGroup: 'orange', price: 10000, rent: [900,  1800, 3600, 7200, 14400], buildCost: 2000, mortgageValue: 5000 },
  { id: 7,  type: 'property', name: 'Nghệ An',    colorGroup: 'orange', price: 12000, rent: [1100, 2200, 4400, 8800, 17600], buildCost: 2000, mortgageValue: 6000 },

  // ─── CORNER 8: JAIL ───
  { id: 8,  type: 'jail',     name: 'Nhà Tù',     rent: [] },

  // ─── SIDE LEFT (bottom→top): ids 9–15 ───
  // Color group: YELLOW (tiles 9,10,11)
  { id: 9,  type: 'property', name: 'Đà Nẵng',    colorGroup: 'yellow', price: 14000, rent: [1300, 2600, 5200, 10400, 20800], buildCost: 3000, mortgageValue: 7000 },
  { id: 10, type: 'property', name: 'Hội An',     colorGroup: 'yellow', price: 14000, rent: [1300, 2600, 5200, 10400, 20800], buildCost: 3000, mortgageValue: 7000 },
  { id: 11, type: 'property', name: 'Huế',         colorGroup: 'yellow', price: 16000, rent: [1500, 3000, 6000, 12000, 24000], buildCost: 3000, mortgageValue: 8000 },
  // Port (id 12)
  { id: 12, type: 'port',     name: 'Cảng Tây',   rent: [] },
  // Color group: GREEN (tiles 13,14,15)
  { id: 13, type: 'property', name: 'Quy Nhơn',   colorGroup: 'green',  price: 18000, rent: [1700, 3400, 6800, 13600, 27200], buildCost: 4000, mortgageValue: 9000 },
  { id: 14, type: 'property', name: 'Nha Trang',  colorGroup: 'green',  price: 18000, rent: [1700, 3400, 6800, 13600, 27200], buildCost: 4000, mortgageValue: 9000 },
  { id: 15, type: 'property', name: 'Phan Thiết', colorGroup: 'green',  price: 20000, rent: [2000, 4000, 8000, 16000, 32000], buildCost: 4000, mortgageValue: 10000 },

  // ─── CORNER 16: FESTIVAL ───
  { id: 16, type: 'festival', name: 'Lễ Hội',     rent: [] },

  // ─── SIDE TOP (right→left): ids 17–23 ───
  // Color group: BLUE (tiles 17,18,19)
  { id: 17, type: 'property', name: 'Vũng Tàu',   colorGroup: 'blue',   price: 22000, rent: [2200, 4400, 8800, 17600, 35200], buildCost: 5000, mortgageValue: 11000 },
  { id: 18, type: 'property', name: 'Cần Thơ',    colorGroup: 'blue',   price: 22000, rent: [2200, 4400, 8800, 17600, 35200], buildCost: 5000, mortgageValue: 11000 },
  { id: 19, type: 'property', name: 'Phú Quốc',   colorGroup: 'blue',   price: 24000, rent: [2500, 5000, 10000, 20000, 40000], buildCost: 5000, mortgageValue: 12000 },
  // Port (id 20)
  { id: 20, type: 'port',     name: 'Cảng Bắc 2', rent: [] },
  // Color group: PURPLE (tiles 21,22,23)
  { id: 21, type: 'property', name: 'Đà Lạt',     colorGroup: 'purple', price: 26000, rent: [2800, 5600, 11200, 22400, 44800], buildCost: 6000, mortgageValue: 13000 },
  { id: 22, type: 'property', name: 'Buôn Mê',    colorGroup: 'purple', price: 26000, rent: [2800, 5600, 11200, 22400, 44800], buildCost: 6000, mortgageValue: 13000 },
  { id: 23, type: 'property', name: 'Kon Tum',    colorGroup: 'purple', price: 28000, rent: [3200, 6400, 12800, 25600, 51200], buildCost: 6000, mortgageValue: 14000 },

  // ─── CORNER 24: AIRPORT ───
  { id: 24, type: 'airport',  name: 'Sân Bay',    rent: [] },

  // ─── SIDE RIGHT (top→bottom): ids 25–31 ───
  // Color group: PINK (tiles 25,26,27)
  { id: 25, type: 'property', name: 'Sa Pa',       colorGroup: 'pink',   price: 30000, rent: [3500, 7000, 14000, 28000, 56000], buildCost: 7000, mortgageValue: 15000 },
  { id: 26, type: 'property', name: 'Hạ Long',    colorGroup: 'pink',   price: 30000, rent: [3500, 7000, 14000, 28000, 56000], buildCost: 7000, mortgageValue: 15000 },
  { id: 27, type: 'property', name: 'Cát Bà',     colorGroup: 'pink',   price: 32000, rent: [4000, 8000, 16000, 32000, 64000], buildCost: 7000, mortgageValue: 16000 },
  // Port (id 28)
  { id: 28, type: 'port',     name: 'Cảng Đông',  rent: [] },
  // Color group: CYAN (tiles 29,30,31)
  { id: 29, type: 'property', name: 'Mộc Châu',   colorGroup: 'cyan',   price: 34000, rent: [4500, 9000, 18000, 36000, 72000], buildCost: 8000, mortgageValue: 17000 },
  { id: 30, type: 'property', name: 'Mai Châu',   colorGroup: 'cyan',   price: 34000, rent: [4500, 9000, 18000, 36000, 72000], buildCost: 8000, mortgageValue: 17000 },
  { id: 31, type: 'property', name: 'Điện Biên',  colorGroup: 'cyan',   price: 36000, rent: [5000, 10000, 20000, 40000, 80000], buildCost: 8000, mortgageValue: 18000 },
];

// Color groups lookup
export const COLOR_GROUPS: Record<string, number[]> = {
  red:    [1, 2, 3],
  orange: [5, 6, 7],
  yellow: [9, 10, 11],
  green:  [13, 14, 15],
  blue:   [17, 18, 19],
  purple: [21, 22, 23],
  pink:   [25, 26, 27],
  cyan:   [29, 30, 31],
};

export const TOTAL_TILES = 32;
export const GO_TILE = 0;
export const JAIL_TILE = 8;
export const FESTIVAL_TILE = 16;
export const AIRPORT_TILE = 24;

export const GO_SALARY = 2000;        // Collect when passing/landing on Go
export const BAIL_COST = 1000;        // Pay to get out of jail
export const STARTING_MONEY = 50000;  // Starting cash per player
export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;
export const TURN_TIMEOUT_MS = 300000; // 5 minutes per turn
export const BOT_TAKEOVER_TURNS = 3;  // Turns before disconnected player is eliminated

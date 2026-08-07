// Map configuration - Data-driven tile definitions
// Layout: 32 tiles total = 4 corners + 28 regular tiles (7 per side)
// Purchasable tiles: 20 properties across 8 color groups + 4 ports

export type TileType = 'go' | 'jail' | 'festival' | 'airport' | 'property' | 'port' | 'tax' | 'chance';

export interface TileDef {
  id: number;          // 0–31, clockwise from bottom-left corner
  type: TileType;
  name: string;
  colorGroup?: string; // e.g. 'red', 'blue', etc.
  price?: number;
  rent: number[];      // [base, house1, house2, house3, hotel]
  buildCost?: number;
  hotelCost?: number;
  taxAmount?: number;
  icon?: string;
}

// Other tiles: 4 corners, 3 Chance tiles and 1 Tax tile
// Total: 20 properties + 4 ports + 4 corners + 3 Chance + 1 Tax = 32

export const MAP_TILES: TileDef[] = [
  // ─── CORNER 0: GO ───
  { id: 0,  type: 'go',       name: 'Xuất Phát',  rent: [] },

  // ─── SIDE BOTTOM (left→right): ids 1–7 ───
  // Color group: RED (tiles 1,2,3)
  { id: 1,  type: 'property', name: 'Cà Mau',    colorGroup: 'red',    price: 60,  rent: [2,  25, 50, 75, 150],  buildCost: 50,  hotelCost: 150 },
  { id: 2,  type: 'property', name: 'Bến Tre',    colorGroup: 'red',    price: 60,  rent: [2, 28, 55, 83, 165],  buildCost: 50,  hotelCost: 150 },
  { id: 3,  type: 'property', name: 'Cần Thơ',    colorGroup: 'red',    price: 60,  rent: [4, 30, 60, 90, 180],  buildCost: 50,  hotelCost: 150 },
  // Port (id 4)
  { id: 4,  type: 'port',     name: 'Cảng Nam',   rent: [] , price:200},
  // Color group: ORANGE (tiles 5,6,7)
  { id: 5,  type: 'property', name: 'Long An',  colorGroup: 'orange', price: 100, rent: [6, 33, 65, 98, 188], buildCost: 50, hotelCost: 150},
  { id: 6,  type: 'property', name: 'Vĩnh Long',  colorGroup: 'orange', price: 100, rent: [6, 35, 75, 105, 210], buildCost: 50, hotelCost: 150},
  { id: 7,  type: 'property', name: 'Mỹ Tho',    colorGroup: 'orange', price: 120, rent: [8, 38, 75, 113, 225], buildCost: 50, hotelCost: 150},

  // ─── CORNER 8: JAIL ───
  { id: 8,  type: 'jail',     name: 'Nhà Tù',     rent: [] },

  // ─── SIDE LEFT (bottom→top): ids 9–15 ───
  // Color group: YELLOW (tiles 9,10,11)
  { id: 9,  type: 'property', name: 'Đà Nẵng',    colorGroup: 'yellow', price: 140, rent: [10, 70, 140, 210, 385], buildCost: 100, hotelCost: 250 },
  { id: 10, type: 'property', name: 'Hội An',     colorGroup: 'yellow', price: 140, rent: [10, 75, 150, 225, 413], buildCost: 100, hotelCost: 250 },
  { id: 11, type: 'property', name: 'Huế',         colorGroup: 'yellow', price: 160, rent: [12, 80, 160, 240, 440], buildCost: 100, hotelCost: 250 },

  // chance (id 12)
  { id: 12, type: 'chance',  name: 'Cơ hội',   rent: [] },

  // Color group: GREEN (tiles 13,15)
  { id: 13, type: 'property', name: 'Điện Biên', colorGroup: 'green',  price: 180, rent: [14, 85, 170, 255, 468], buildCost: 100, hotelCost: 250  },
  { id: 15, type: 'property', name: 'Mộc Châu', colorGroup: 'green',  price: 200, rent: [16, 90, 180, 270, 495], buildCost: 100, hotelCost: 250  },

  // port (id 14)
  { id: 14, type: 'port',     name: 'Cảng Tây',   rent: [] ,  price:200},


  // ─── CORNER 16: FESTIVAL ───
  { id: 16, type: 'festival', name: 'Lễ Hội',     rent: [] },

  // ─── SIDE TOP (right→left): ids 17–23 ───
  // Color group: BLUE (tiles 17,19)
  { id: 17, type: 'property', name: 'Nha Trang',   colorGroup: 'blue',   price: 220, rent: [18, 108, 220, 333, 614], buildCost: 150, hotelCost: 375 },
  { id: 19, type: 'property', name: 'Phú Quốc',   colorGroup: 'blue',   price: 240, rent: [20, 120, 240, 360, 660], buildCost: 150, hotelCost: 375  },
  // Port (id 18)
  { id: 18, type: 'port',     name: 'Cảng Bắc', rent: [] ,price:200 },

  // chance (id 20)
  { id: 20, type: 'chance',  name: 'Cơ hội',   rent: [] },

  // Color group: PURPLE (tiles 21,22,23)
  { id: 21, type: 'property', name: 'Ninh Bình',     colorGroup: 'purple', price: 260, rent: [22, 128, 255, 383, 701], buildCost: 150, hotelCost: 375  },
  { id: 22, type: 'property', name: 'Hạ Long',    colorGroup: 'purple', price: 260, rent: [22, 135, 270, 405, 743], buildCost: 150, hotelCost: 375  },
  { id: 23, type: 'property', name: 'Hà Nội',    colorGroup: 'purple', price: 280, rent: [24, 143, 285, 428, 784], buildCost: 150, hotelCost: 375  },

  // ─── CORNER 24: AIRPORT ───
  { id: 24, type: 'airport',  name: 'Sân Bay',    rent: [] },

  // ─── SIDE RIGHT (top→bottom): ids 25–31 ───
  // Port (id 25)
  { id: 25, type: 'port',     name: 'Cảng Đông',  rent: [] , price:200},

  // Color group: PINK (tiles 26,27)
  { id: 26, type: 'property', name: 'Vũng Tàu',    colorGroup: 'pink',   price: 300, rent: [26, 170, 340, 510, 935], buildCost: 200, hotelCost: 500 },
  { id: 27, type: 'property', name: 'HCM',     colorGroup: 'pink',   price: 320, rent: [28, 180, 360, 540, 990], buildCost: 200, hotelCost: 500 },

  // chance (id 28)
  { id: 28, type: 'chance',  name: 'Cơ hội',   rent: [] },

  // Color group: CYAN (tiles 29,31)
  { id: 29, type: 'property', name: 'Thanh Hóa',   colorGroup: 'cyan',   price: 360, rent: [36, 195, 390, 585, 1060], buildCost: 200, hotelCost: 500  },
  { id: 31, type: 'property', name: 'Đà Lạt',  colorGroup: 'cyan',   price: 400, rent: [50, 200, 400, 600, 1100], buildCost: 200, hotelCost: 500  },

  { id: 30, type: 'tax',  name: 'Thuế',   rent: [] },
];

// Color groups lookup
export const COLOR_GROUPS: Record<string, number[]> = {
  red:    [1, 2, 3],
  orange: [5, 6, 7],
  yellow: [9, 10, 11],
  green:  [13, 15],
  blue:   [17, 19],
  purple: [21, 22, 23],
  pink:   [26, 27],
  cyan:   [29, 31],
};


export const TOTAL_TILES = 32;
export const GO_TILE = 0;
export const JAIL_TILE = 8;
export const FESTIVAL_TILE = 16;
export const AIRPORT_TILE = 24;

export const GO_SALARY = 300;        // Collect when passing/landing on Go
export const BAIL_COST = 200;         // Pay to get out of jail
export const STARTING_MONEY = 2000;  // Starting cash per player
export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;
export const TURN_TIMEOUT_MS = 15000; // 15 seconds per turn
export const TAX_TILE = 30;
export const HOTEL_LEVEL = 4;
export const BIRTHDAY_AMOUNT = 25;
export const PENALTY_AMOUNT = 50;
export const BLACKOUT_PASSES = 3;

export type ChanceCardId =
  | 'DISCOUNT_RENT'           // Giảm 50% tiền thuê tiếp theo
  | 'DOUBLE_RENT'             // Trả gấp đôi tiền thuê tiếp theo
  | 'SHIELD'                  // Bảo vệ 1 thành phố
  | 'FORCE_SELL'              // Ép đối thủ bán 1 thành phố
  | 'SABOTAGE'                // Hạ 1 cấp nhà đối thủ
  | 'EARTHQUAKE'              // Phá hủy hoàn toàn 1 ô đất đối thủ
  | 'BLACKOUT'                // Vô hiệu hóa thành phố đến khi qua Start 3 lần
  | 'CHANCE_FESTIVAL'         // Tổ chức Festival tại 1 thành phố (từ tay)
  | 'GIVE_CITY'               // Tặng 1 thành phố cho đối thủ
  | 'GOTO_AIRPORT'            // Lửa chùa — đến ô Sân Bay
  | 'GOTO_START'              // Bắt đầu — về ô Start, nhận lương
  | 'GOTO_ACTIVE_FESTIVAL'    // Toang rồi ông giáo ạ — teleport đến ô đang có festival
  | 'GOTO_FESTIVAL_CORNER'    // Ngon thí — đến ô góc Festival để tổ chức
  | 'GOTO_TAX'                // I love tiktok — đến ô Thuế
  | 'GOTO_JAIL'               // Nhà tù — vào tù thẳng
  | 'BIRTHDAY'                // Chúc mừng sinh nhật — nhận 25K từ mỗi đối thủ
  | 'PENALTY'                 // Phạt — mất 50K
  | 'JAIL_CARD';              // Thẻ ra tù miễn phí

export const CHANCE_CARDS: ChanceCardId[] = [
  'DISCOUNT_RENT', 'DOUBLE_RENT', 'SHIELD',
  'FORCE_SELL', 'SABOTAGE', 'EARTHQUAKE', 'BLACKOUT',
  'CHANCE_FESTIVAL', 'GIVE_CITY',
  'GOTO_AIRPORT', 'GOTO_START', 'GOTO_ACTIVE_FESTIVAL', 'GOTO_FESTIVAL_CORNER', 'GOTO_TAX', 'GOTO_JAIL',
  'BIRTHDAY', 'PENALTY', 'JAIL_CARD',
];

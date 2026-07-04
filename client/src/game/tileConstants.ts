// Tile color constants shared between server config and client rendering
export const MAP_TILE_COLORS: Record<string, number> = {
  red:    0xFF6B6B,
  orange: 0xFF8C42,
  yellow: 0xFFD93D,
  green:  0x6BCB77,
  blue:   0x4D96FF,
  purple: 0xC77DFF,
  pink:   0xFF80B5,
  cyan:   0x4ECDC4,
};

export const CORNER_TILES = [0, 8, 16, 24];
export const TILE_COUNT = 32;

export const TILE_NAMES: Record<number, string> = {
  0: 'Xuất Phát', 8: 'Nhà Tù', 16: 'Lễ Hội', 24: 'Sân Bay',
  1: 'Hà Nội', 2: 'Hải Phòng', 3: 'Nam Định',
  4: 'Cảng Bắc',
  5: 'Ninh Bình', 6: 'Thanh Hoá', 7: 'Nghệ An',
  9: 'Đà Nẵng', 10: 'Hội An', 11: 'Huế',
  12: 'Cảng Tây',
  13: 'Quy Nhơn', 14: 'Nha Trang', 15: 'Phan Thiết',
  17: 'Vũng Tàu', 18: 'Cần Thơ', 19: 'Phú Quốc',
  20: 'Cảng Bắc 2',
  21: 'Đà Lạt', 22: 'Buôn Mê', 23: 'Kon Tum',
  25: 'Sa Pa', 26: 'Hạ Long', 27: 'Cát Bà',
  28: 'Cảng Đông',
  29: 'Mộc Châu', 30: 'Mai Châu', 31: 'Điện Biên',
};

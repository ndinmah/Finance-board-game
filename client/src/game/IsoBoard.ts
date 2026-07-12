import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import type { TileState, PlayerState } from '../store/gameStore';
import { TILE_COORDINATES } from './boardCoords';
import { TILE_COUNT } from './tileConstants';

export interface BoardCallbacks {
  onTileClick: (tileId: number) => void;
  onTileHover: (tileId: number | null) => void;
}

export class IsoBoard {
  private app: PIXI.Application;
  private boardContainer: PIXI.Container;
  private tokenContainer: PIXI.Container;
  private uiContainer: PIXI.Container;

  private tiles: Map<number, PIXI.Container> = new Map();
  private tokens: Map<string, PIXI.Container> = new Map();
  private callbacks: BoardCallbacks;

  private editMode: boolean = false;
  private editAnchors: PIXI.Graphics[] = [];

  constructor(callbacks: BoardCallbacks) {
    this.callbacks = callbacks;
    this.app = new PIXI.Application();
    this.boardContainer = new PIXI.Container();
    this.tokenContainer = new PIXI.Container();
    this.uiContainer    = new PIXI.Container();
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      canvas,
      width:       canvas.parentElement?.clientWidth  || 800,
      height:      canvas.parentElement?.clientHeight || 600,
      backgroundAlpha: 0,
      antialias:   true,
      resolution:  window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.app.stage.addChild(this.boardContainer);
    this.app.stage.addChild(this.tokenContainer);
    this.app.stage.addChild(this.uiContainer);

    this.centerBoard();
    this._drawBoard();
  }

  private centerBoard() {
    const cx = this.app.screen.width  / 2;
    const cy = this.app.screen.height / 2;
    this.boardContainer.position.set(cx, cy);
    this.tokenContainer.position.set(cx, cy);

    // Tính toán scale khớp với CSS background-size: contain
    // Kích thước gốc của background image là 1525x704
    // User đã map toạ độ ở màn hình xấp xỉ 1536x666 -> mappedBgScale ~ 0.946
    const IMG_W = 1525;
    const IMG_H = 704;

    const currentBgScale = Math.min(this.app.screen.width / IMG_W, this.app.screen.height / IMG_H);
    const mappedBgScale = Math.min(1536 / IMG_W, 666 / IMG_H);

    const scale = currentBgScale / mappedBgScale;

    this.boardContainer.scale.set(scale);
    this.tokenContainer.scale.set(scale);
  }

  // ─── Draw Hitboxes & Waypoints ──────────────────────────────────────────────

  private _drawBoard() {
    this.boardContainer.removeChildren();
    this.tiles.clear();

    for (let id = 0; id < TILE_COUNT; id++) {
      this._drawTileHitbox(id);
    }
  }

  private _drawTileHitbox(tileId: number) {
    const pos = TILE_COORDINATES[tileId];
    if (!pos) return;

    const container = new PIXI.Container();
    container.position.set(pos.x, pos.y);
    container.eventMode = 'static';
    container.cursor   = 'pointer';

    // Vẽ hitbox tàng hình (hình chữ nhật isometric) để nhận sự kiện click
    const hitbox = new PIXI.Graphics();
    hitbox.poly(this._getIsoPolygon(tileId));
    hitbox.fill({ color: 0xffffff, alpha: 0.01 }); // Tàng hình nhưng vẫn bắt event
    container.addChild(hitbox);

    container.on('pointertap', () => this.callbacks.onTileClick(tileId));
    container.on('pointerenter', () => {
      this.callbacks.onTileHover(tileId);
      gsap.to(container.scale, { x: 1.1, y: 1.1, duration: 0.15, ease: 'power2.out' });
    });
    container.on('pointerleave', () => {
      this.callbacks.onTileHover(null);
      gsap.to(container.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.out' });
    });

    this.boardContainer.addChild(container);
    this.tiles.set(tileId, container);
  }

  private _getIsoPolygon(tileId: number): number[] {
    let w = 0, h = 0;

    if (tileId % 8 === 0) {
      w = 108; h = 108;
    } else if ((tileId > 0 && tileId < 8) || (tileId > 16 && tileId < 24)) {
      w = 64; h = 110;
    } else {
      w = 110; h = 64;
    }

    const hw = w / 2;
    const hh = h / 2;
    const pts = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];

    const cos = 0.70710678118; // Math.cos(Math.PI / 4)
    const sin = 0.70710678118; // Math.sin(Math.PI / 4)
    const scaleY = 0.572;

    const poly = [];
    for (const p of pts) {
      const rx = p.x * cos - p.y * sin;
      const ry = p.x * sin + p.y * cos;
      poly.push(rx, ry * scaleY);
    }
    return poly;
  }

  // ─── Update Visuals (Houses, Owners) ───────────────────────────────────────

  updateTiles(board: Map<number, TileState>, players: Map<string, PlayerState>) {
    board.forEach((tile, id) => {
      const container = this.tiles.get(id);
      if (!container) return;

      // Tính toán kích thước và tỷ lệ chiếu Isometric cho ô đất
      let w = 0, h = 0;
      if (id % 8 === 0) {
        w = 108; h = 108;
      } else if ((id > 0 && id < 8) || (id > 16 && id < 24)) {
        w = 64; h = 110;
      } else {
        w = 110; h = 64;
      }
      const hw = w / 2;
      const hh = h / 2;

      const cos = 0.70710678118;
      const sin = 0.70710678118;
      const scaleY = 0.572;

      // Xoá các visual cũ (nhà, cờ), giữ lại hitbox
      container.children.filter(c => c.label === 'visual').forEach(c => c.destroy());

      const visualLayer = new PIXI.Container();
      visualLayer.label = 'visual';

      // Vẽ cờ / viền chủ sở hữu
      if (tile.ownerId && players.has(tile.ownerId)) {
        const owner = players.get(tile.ownerId)!;
        const ownerColor = parseInt(owner.color.replace('#', '0x'));

        const ownerRing = new PIXI.Graphics();
        ownerRing.poly(this._getIsoPolygon(id));
        ownerRing.stroke({ color: ownerColor, width: 4, alpha: 0.8 });
        visualLayer.addChild(ownerRing);
      }

      // Tính toán lệch dịch chuyển về góc đỉnh-giữa (top-middle) của ô đất
      let houseScreenX = 0;
      let houseScreenY = 0;

      if (id > 0 && id < 8) {
        // Cạnh trái-dưới: dịch lên trên-phải (CY âm)
        const houseCX = 0;
        const houseCY = -hh * 0.45;
        houseScreenX = houseCX * cos - houseCY * sin;
        houseScreenY = (houseCX * sin + houseCY * cos) * scaleY;
      } else if (id > 16 && id < 24) {
        // Cạnh phải-trên: dịch lên trên-phải (CY âm) để luôn nằm trên chữ
        const houseCX = 0;
        const houseCY = -hh * 0.45;
        houseScreenX = houseCX * cos - houseCY * sin;
        houseScreenY = (houseCX * sin + houseCY * cos) * scaleY;
      } else if (id > 8 && id < 16) {
        // Cạnh trái-trên: dịch lên trên-trái (CX âm) để luôn nằm trên chữ
        const houseCX = -hw * 0.45;
        const houseCY = 0;
        houseScreenX = houseCX * cos - houseCY * sin;
        houseScreenY = (houseCX * sin + houseCY * cos) * scaleY;
      } else if (id > 24 && id < 32) {
        // Cạnh phải-dưới: dịch lên trên-trái (CX âm)
        const houseCX = -hw * 0.45;
        const houseCY = 0;
        houseScreenX = houseCX * cos - houseCY * sin;
        houseScreenY = (houseCX * sin + houseCY * cos) * scaleY;
      }

      // Tạo layer container chứa các công trình được định vị trí chính xác
      const houseLayer = new PIXI.Container();
      houseLayer.position.set(houseScreenX, houseScreenY);
      visualLayer.addChild(houseLayer);

      let ownerColor: number | undefined;
      if (tile.ownerId && players.has(tile.ownerId)) {
        ownerColor = parseInt(players.get(tile.ownerId)!.color.replace('#', '0x'));
      }

      if (tile.tileType === 'port') {
        // Cảng giao thương: chỉ hiển thị mô hình bến cảng khi đã có người sở hữu
        if (ownerColor !== undefined) {
          this._drawPortModel(houseLayer, id, ownerColor);
        }
      } else {
        // Bất động sản thường: vẽ cờ lệnh hoàng gia nếu sở hữu mà chưa xây nhà
        if (ownerColor !== undefined && tile.houseCount === 0) {
          this._drawHouseIndicators(houseLayer, 0, id, ownerColor);
        }
        // Vẽ mô hình nhà nếu có
        if (tile.houseCount > 0) {
          this._drawHouseIndicators(houseLayer, tile.houseCount, id);
        }
      }

      // Tourist spot indicator
      if (tile.isTouristSpot) {
        const spot = new PIXI.Text({ text: '🏖️', style: { fontSize: 28 } });
        spot.anchor.set(0.5);
        spot.position.set(0, -50); // Ở phía trên nhà/biển báo
        houseLayer.addChild(spot);
      }

      // Hiện tên tỉnh và giá tiền tô trên ô đất
      if (tile.tileType === 'property' || tile.tileType === 'port') {
        // Xác định tâm của cạnh và góc xoay
        let cx = 0, cy = 0;
        let angle = 0;

        if ((id > 0 && id < 8) || (id > 16 && id < 24)) {
          // Hàng 1-7 (cạnh trái-dưới) và 17-23 (cạnh phải-trên)
          // Hàng 1-7 chữ nằm ở mép ngoài, hàng 17-23 chữ nằm ở mép trong
          // Cả 2 đều dùng chung toạ độ điểm neo và góc nghiêng để đối xứng
          cx = 0; cy = hh;
          angle = 0;
        } else if ((id > 8 && id < 16) || (id > 24 && id < 32)) {
          // Hàng 9-15 (cạnh trái-trên) và 25-31 (cạnh phải-dưới)
          // Hàng 25-31 chữ nằm ở mép ngoài, hàng 9-15 chữ nằm ở mép trong
          cx = hw; cy = 0;
          angle = -Math.PI / 2;
        }

        // Tính toạ độ screen
        const screenX = (cx * cos - cy * sin);
        const screenY = (cx * sin + cy * cos) * scaleY;

        // Container cha chịu trách nhiệm scale Y (Áp dụng sau cùng theo hệ toạ độ thế giới)
        const isoParent = new PIXI.Container();
        // Lùi vào tâm 20% (0.8) để chữ nằm gọn bên trong hitbox
        isoParent.position.set(screenX * 0.95, screenY * 0.95);
        isoParent.scale.y = scaleY;

        // Container con chịu trách nhiệm xoay 45 độ (Áp dụng trước để tạo ra mặt phẳng sàn)
        const isoFloor = new PIXI.Container();
        isoFloor.rotation = Math.PI / 4;

        // Container gộp chứa cả Tên Tỉnh và Giá Tiền
        const textWrapper = new PIXI.Container();
        textWrapper.rotation = angle;

        // Render Tên Tỉnh
        if (tile.name) {
          const nameLabel = new PIXI.Text({
            text: tile.name,
            style: new PIXI.TextStyle({
              fontSize: 12,
              fill: 0x000000,
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
            }),
          });
          nameLabel.anchor.set(0.5, 1);
          // Đặt chữ tên tỉnh cao hơn (giá trị y âm) so với giá tiền
          // Bạn có thể chỉnh sửa số -18 này để điều chỉnh khoảng cách
          nameLabel.position.set(0, -40);
          nameLabel.alpha = 0.55;
          textWrapper.addChild(nameLabel);
        }

        // Render Giá Tiền
        if (tile.currentRent > 0) {
          const rentLabel = new PIXI.Text({
            text: `${tile.currentRent}K`,
            style: new PIXI.TextStyle({
              fontSize: 18,
              fill: 0x000000,
              fontWeight: '800',
              fontFamily: 'Inter, sans-serif',
            }),
          });
          rentLabel.anchor.set(0.5, 1);
          rentLabel.position.set(0, 0);
          rentLabel.alpha = 0.7;
          textWrapper.addChild(rentLabel);
        }

        isoFloor.addChild(textWrapper);
        isoParent.addChild(isoFloor);
        visualLayer.addChild(isoParent);
      }

      // Hiện chữ tên cho ô Cơ Cơ và Ô Thuế
      if (tile.tileType === 'chance' || tile.tileType === 'tax') {
        let cx = 0, cy = 0;
        let angle = 0;

        if ((id > 0 && id < 8) || (id > 16 && id < 24)) {
          cx = 0; cy = hh;
          angle = 0;
        } else if ((id > 8 && id < 16) || (id > 24 && id < 32)) {
          cx = hw; cy = 0;
          angle = -Math.PI / 2;
        }

        const screenX = (cx * cos - cy * sin);
        const screenY = (cx * sin + cy * cos) * scaleY;

        const isoParent = new PIXI.Container();
        isoParent.position.set(screenX * 0.95, screenY * 0.95);
        isoParent.scale.y = scaleY;

        const isoFloor = new PIXI.Container();
        isoFloor.rotation = Math.PI / 4;

        const textWrapper = new PIXI.Container();
        textWrapper.rotation = angle;

        if (tile.name) {
          const nameLabel = new PIXI.Text({
            text: tile.name,
            style: new PIXI.TextStyle({
              fontSize: 14,
              fill: 0x000000,
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
            }),
          });
          nameLabel.anchor.set(0.5, 1);
          // Vị trí y = 0 giống với chữ giá tiền
          nameLabel.position.set(0, -5);
          nameLabel.alpha = 0.55;
          textWrapper.addChild(nameLabel);
        }

        isoFloor.addChild(textWrapper);
        isoParent.addChild(isoFloor);
         visualLayer.addChild(isoParent);
      }

      // Hiện chữ thẳng cho 4 ô góc (Xuất Phát, Nhà Tù, Lễ Hội, Sân Bay)
      if (id % 8 === 0 && tile.name) {
        const cornerLabel = new PIXI.Text({
          text: tile.name,
          style: new PIXI.TextStyle({
            fontSize: 16,
            fill: 0xffffff, // Chữ màu trắng
            stroke: { color: 0x000000, width: 2 }, // Viền chữ màu đen (Pixi v8)
            fontWeight: '100',
            fontFamily: 'Inter, sans-serif',
          }),
        });
        cornerLabel.anchor.set(0.5, 1);
        // Căn chỉnh vị trí Y của nhãn (số dương đẩy xuống dưới tâm)
        // Để tự điều chỉnh, bạn thay đổi số 18 ở dòng dưới
        cornerLabel.position.set(0, 5);
        cornerLabel.alpha = 0.9; // Tăng alpha để màu trắng và viền đen hiển thị rõ nét nhất
        visualLayer.addChild(cornerLabel);
      }

      container.addChild(visualLayer);
    });
  }

  private _drawHouseIndicators(container: PIXI.Container, count: number, id: number, ownerColor?: number) {
    if (count < 0) return;

    const g = new PIXI.Graphics();

    // Tùy chỉnh độ cao tổng thể dựa trên level
    const offsetY = count === 1 ? -10 : (count === 0 ? -12 : -5);

    // Xác định lật hướng mô hình dựa trên cạnh của bàn cờ (đồng hướng với chữ giá tiền)
    // Sử dụng lật ngang thay vì xoay 3D để tránh lỗi Painter's algorithm (không vẽ mặt khuất)
    if ((id > 8 && id < 16) || (id > 24 && id < 32)) {
      g.scale.x = -1;
    }

    // Hàm chuyển đổi tọa độ isometric gốc
    const isoPt = (ix: number, iy: number, iz: number) => ({
      x: ix - iy,
      y: offsetY + ix * 0.5 + iy * 0.5 - iz
    });

    const drawPoly = (points: {x:number, y:number}[], fill: number, strokeColor: number = -1, strokeW: number = 1) => {
      g.poly(points);
      g.fill({ color: fill });
      if (strokeColor !== -1) g.stroke({ color: strokeColor, width: strokeW, alpha: 0.9, alignment: 1 });
    };

    if (count === 0) {
      // --- BẢNG HIỆU SỞ HỮU (OWNED SIGNBOARD) ---
      const pt = (ix: number, iy: number, iz: number) => isoPt(ix, iy, iz);

      const color = ownerColor || 0xFFFFFF;
      const cPost = 0x5D4037;
      const cPostSide = 0x3E2723;
      const cBoardSide = 0x333333;

      // Trụ gỗ (Cọc)
      drawPoly([pt(-1, -1, 0), pt(1, -1, 0), pt(1, 1, 0), pt(-1, 1, 0)], cPost);
      drawPoly([pt(1, -1, 0), pt(1, 1, 0), pt(1, 1, 12), pt(1, -1, 12)], cPostSide);
      drawPoly([pt(-1, 1, 0), pt(1, 1, 0), pt(1, 1, 12), pt(-1, 1, 12)], cPost);

      // Bảng hiệu (Board)
      drawPoly([pt(10, -1, 8), pt(10, 1, 8), pt(10, 1, 16), pt(10, -1, 16)], cBoardSide);
      drawPoly([pt(-10, 1, 8), pt(10, 1, 8), pt(10, 1, 16), pt(-10, 1, 16)], color);
      drawPoly([pt(-10, -1, 16), pt(10, -1, 16), pt(10, 1, 16), pt(-10, 1, 16)], cBoardSide);

      // Viền trắng trang trí bên trong bảng hiệu
      g.moveTo(pt(-8, 1.1, 10).x, pt(-8, 1.1, 10).y)
       .lineTo(pt(8, 1.1, 10).x, pt(8, 1.1, 10).y)
       .lineTo(pt(8, 1.1, 14).x, pt(8, 1.1, 14).y)
       .lineTo(pt(-8, 1.1, 14).x, pt(-8, 1.1, 14).y)
       .lineTo(pt(-8, 1.1, 10).x, pt(-8, 1.1, 10).y)
       .stroke({color: 0xffffff, width: 1.5, alpha: 0.8});

      // Viền mép ngoài để nổi bật hơn
      g.moveTo(pt(-10, 1, 8).x, pt(-10, 1, 8).y)
       .lineTo(pt(10, 1, 8).x, pt(10, 1, 8).y)
       .lineTo(pt(10, 1, 16).x, pt(10, 1, 16).y)
       .lineTo(pt(-10, 1, 16).x, pt(-10, 1, 16).y)
       .lineTo(pt(-10, 1, 8).x, pt(-10, 1, 8).y)
       .stroke({color: 0x000000, width: 1, alpha: 0.3});

    } else if (count >= 4) {
      // --- HOTEL (Level 4 - Modern Twin-Block Luxury Hotel) ---
      const w = 26, d = 20;
      const pt = (ix: number, iy: number, iz: number) => isoPt(ix - w/2, iy - d/2, iz);

      const cGrass = 0xAED581;
      const cWallL_Side = 0x8E8A82; // Màu xám tối tường hông khối trái
      const cWallL_Front = 0xB3B0A9; // Màu xám nhạt mặt tiền khối trái
      const cWallR_Side = 0x8D4A3E; // Màu đỏ gạch tối tường hông khối phải
      const cWallR_Front = 0xAA6253; // Màu đỏ gạch sáng mặt tiền khối phải

      const cRoofL = 0x5D5C58; // Mái xám khối trái
      const cRoofL_Inner = 0x4A4946;
      const cRoofR = 0xBCA38D; // Mái cát ấm khối phải
      const cRoofR_Inner = 0xA38C77;

      const cWin = 0x1A252C; // Kính tối màu hiện đại
      const cWinFrame = 0x34495E; // Khung xám xanh
      const cAwning = 0x4E5D6C; // Mái che kính

      const cBalcony = 0xEEEEEE; // Ban công trắng xám
      const cBalconyRailing = 0xFFFFFF; // Lan can ban công trắng

      const cTrunk = 0x5D4037;
      const cLeavesL = 0x81C784;
      const cLeavesR = 0x66BB6A;
      const cHedge = 0x7CB342; // Màu bụi cây hàng rào
      const cHedgeSide = 0x689F38;

      // 1. Thảm cỏ nền (Base Grass)
      drawPoly([pt(-4, -4, 0), pt(w + 4, -4, 0), pt(w + 4, d + 4, 0), pt(-4, d + 4, 0)], cGrass);

      // ==========================================
      // KHỐI TRÁI: 2 tầng xám hiện đại (ix: 0..12, iy: 4..20, h: 18)
      // ==========================================
      // Tường hông trái (ix = 0)
      drawPoly([pt(0, 4, 0), pt(0, 20, 0), pt(0, 20, 18), pt(0, 4, 18)], cWallL_Side);
      // Tường mặt tiền trái (iy = 20)
      drawPoly([pt(0, 20, 0), pt(12, 20, 0), pt(12, 20, 18), pt(0, 20, 18)], cWallL_Front);

      // Cửa kính lớn tầng 1 mặt tiền trái
      drawPoly([pt(2, 20, 1), pt(10, 20, 1), pt(10, 20, 6), pt(2, 20, 6)], cWin);
      g.moveTo(pt(6, 20, 1).x, pt(6, 20, 1).y).lineTo(pt(6, 20, 6).x, pt(6, 20, 6).y).stroke({ color: cWinFrame, width: 1 });

      // Mái che (Canopy/Awning) tầng 1
      drawPoly([pt(1.5, 20, 6.5), pt(10.5, 20, 6.5), pt(10.5, 21.5, 6.5), pt(1.5, 21.5, 6.5)], cAwning);
      drawPoly([pt(1.5, 20, 6.1), pt(10.5, 20, 6.1), pt(10.5, 20, 6.5), pt(1.5, 20, 6.5)], cAwning);

      // Cửa kính lớn tầng 2 mặt tiền trái
      drawPoly([pt(2, 20, 9.5), pt(10, 20, 9.5), pt(10, 20, 14.5), pt(2, 20, 14.5)], cWin);
      g.moveTo(pt(6, 20, 9.5).x, pt(6, 20, 9.5).y).lineTo(pt(6, 20, 14.5).x, pt(6, 20, 14.5).y).stroke({ color: cWinFrame, width: 1 });

      // Cửa sổ khe nhỏ tường hông trái (ix = 0)
      // Tầng 1
      drawPoly([pt(0, 6, 2), pt(0, 8, 2), pt(0, 8, 8), pt(0, 6, 8)], cWin);
      drawPoly([pt(0, 12, 2), pt(0, 14, 2), pt(0, 14, 8), pt(0, 12, 8)], cWin);
      // Tầng 2
      drawPoly([pt(0, 6, 11), pt(0, 8, 11), pt(0, 8, 16), pt(0, 6, 16)], cWin);
      drawPoly([pt(0, 12, 11), pt(0, 14, 11), pt(0, 14, 16), pt(0, 12, 16)], cWin);

      // Mái bằng khối trái (z = 18)
      drawPoly([pt(0, 4, 18), pt(12, 4, 18), pt(12, 20, 18), pt(0, 20, 18)], cRoofL);
      // Thành bo mái gờ đen (Parapet)
      drawPoly([pt(0, 20, 18), pt(12, 20, 18), pt(12, 20, 18.6), pt(0, 20, 18.6)], cRoofL_Inner);
      drawPoly([pt(0, 4, 18), pt(0, 20, 18), pt(0, 20, 18.6), pt(0, 4, 18.6)], cRoofL_Inner);

      // ==========================================
      // KHỐI PHẢI: 3 tầng gạch đỏ cao (ix: 13..25, iy: 2..20, h: 26)
      // ==========================================
      // Tường hông phải (ix = 25)
      drawPoly([pt(25, 2, 0), pt(25, 20, 0), pt(25, 20, 26), pt(25, 2, 26)], cWallR_Side);
      // Tường mặt hông trong (phần nhô cao hơn khối trái - ix = 13, z = 18..26)
      drawPoly([pt(13, 2, 18), pt(13, 20, 18), pt(13, 20, 26), pt(13, 2, 26)], cWallR_Side);
      // Tường mặt tiền phải (iy = 20)
      drawPoly([pt(13, 20, 0), pt(25, 20, 0), pt(25, 20, 26), pt(13, 20, 26)], cWallR_Front);

      // Cửa kính lớn tầng 1 mặt tiền phải
      drawPoly([pt(14, 20, 1), pt(24, 20, 1), pt(24, 20, 7), pt(14, 20, 7)], cWin);
      g.moveTo(pt(17.3, 20, 1).x, pt(17.3, 20, 1).y).lineTo(pt(17.3, 20, 7).x, pt(17.3, 20, 7).y).stroke({ color: cWinFrame, width: 1 });
      g.moveTo(pt(20.6, 20, 1).x, pt(20.6, 20, 1).y).lineTo(pt(20.6, 20, 7).x, pt(20.6, 20, 7).y).stroke({ color: cWinFrame, width: 1 });

      // Cửa kính lớn tầng 2 mặt tiền phải
      drawPoly([pt(14, 20, 9), pt(24, 20, 9), pt(24, 20, 16), pt(14, 20, 16)], cWin);
      g.moveTo(pt(17.3, 20, 9).x, pt(17.3, 20, 9).y).lineTo(pt(17.3, 20, 16).x, pt(17.3, 20, 16).y).stroke({ color: cWinFrame, width: 1 });
      g.moveTo(pt(20.6, 20, 9).x, pt(20.6, 20, 9).y).lineTo(pt(20.6, 20, 16).x, pt(20.6, 20, 16).y).stroke({ color: cWinFrame, width: 1 });

      // Cửa kính lớn tầng 3 mặt tiền phải
      drawPoly([pt(14, 20, 18), pt(24, 20, 18), pt(24, 20, 25), pt(14, 20, 25)], cWin);
      g.moveTo(pt(17.3, 20, 18).x, pt(17.3, 20, 18).y).lineTo(pt(17.3, 20, 25).x, pt(17.3, 20, 25).y).stroke({ color: cWinFrame, width: 1 });
      g.moveTo(pt(20.6, 20, 18).x, pt(20.6, 20, 18).y).lineTo(pt(20.6, 20, 25).x, pt(20.6, 20, 25).y).stroke({ color: cWinFrame, width: 1 });

      // Ban công tầng 2 nhô ra ngoài (z = 8)
      drawPoly([pt(13.5, 20, 8), pt(24.5, 20, 8), pt(24.5, 21.5, 8), pt(13.5, 21.5, 8)], cBalcony);
      drawPoly([pt(13.5, 21.5, 8), pt(24.5, 21.5, 8), pt(24.5, 21.5, 9.5), pt(13.5, 21.5, 9.5)], cBalconyRailing, 0xcccccc, 0.8);
      drawPoly([pt(13.5, 20, 8), pt(13.5, 21.5, 8), pt(13.5, 21.5, 9.5), pt(13.5, 20, 9.5)], cBalconyRailing, 0xcccccc, 0.8);
      drawPoly([pt(24.5, 20, 8), pt(24.5, 21.5, 8), pt(24.5, 21.5, 9.5), pt(24.5, 20, 9.5)], cBalconyRailing, 0xcccccc, 0.8);

      // Mái bằng khối phải (z = 26)
      drawPoly([pt(13, 2, 26), pt(25, 2, 26), pt(25, 20, 26), pt(13, 20, 26)], cRoofR);
      // Thành bo mái gờ đất (Parapet)
      drawPoly([pt(13, 20, 26), pt(25, 20, 26), pt(25, 20, 26.6), pt(13, 20, 26.6)], cRoofR_Inner);
      drawPoly([pt(25, 2, 26), pt(25, 20, 26), pt(25, 20, 26.6), pt(25, 2, 26.6)], cRoofR_Inner);

      // ==========================================
      // ĐỒ HỌA PHỤ CẢNH (Cây cối, hàng rào bụi cây)
      // ==========================================
      // Hàng rào bụi cây trước khối trái
      drawPoly([pt(-2, 21, 0), pt(10, 21, 0), pt(10, 21, 2.5), pt(-2, 21, 2.5)], cHedge);
      drawPoly([pt(10, 20, 0), pt(10, 21, 0), pt(10, 21, 2.5), pt(10, 20, 2.5)], cHedgeSide);
      // Hàng rào bụi cây trước khối phải
      drawPoly([pt(14, 21, 0), pt(20, 21, 0), pt(20, 21, 2.5), pt(14, 21, 2.5)], cHedge);
      drawPoly([pt(20, 20, 0), pt(20, 21, 0), pt(20, 21, 2.5), pt(20, 20, 2.5)], cHedgeSide);
      // Hàng rào bụi cây bên hông phải
      drawPoly([pt(26, 2, 0), pt(26, 10, 0), pt(26, 10, 2.5), pt(26, 2, 2.5)], cHedgeSide);
      drawPoly([pt(25, 10, 0), pt(26, 10, 0), pt(26, 10, 2.5), pt(25, 10, 2.5)], cHedge);

      // Cây xanh bên trái
      drawPoly([pt(-2.2, 10, 0), pt(-1.8, 10, 0), pt(-1.8, 10, 4), pt(-2.2, 10, 4)], cTrunk);
      drawPoly([pt(-3.5, 8.5, 4), pt(-0.5, 8.5, 4), pt(-0.5, 11.5, 4), pt(-3.5, 11.5, 4)], cLeavesL);
      drawPoly([pt(-0.5, 8.5, 4), pt(-0.5, 11.5, 4), pt(-0.5, 11.5, 10), pt(-0.5, 8.5, 10)], cLeavesR);
      drawPoly([pt(-3.5, 11.5, 4), pt(-0.5, 11.5, 4), pt(-0.5, 11.5, 10), pt(-3.5, 11.5, 10)], cLeavesL);
      drawPoly([pt(-3.5, 8.5, 10), pt(-0.5, 8.5, 10), pt(-0.5, 11.5, 10), pt(-3.5, 11.5, 10)], cLeavesR);

    } else if (count === 3) {
      // --- MANSION (Level 3 - Modern Luxury Pool Villa) ---
      const w = 24, d = 20;
      const pt = (ix: number, iy: number, iz: number) => isoPt(ix - w/2, iy - d/2, iz);

      const cGrass = 0x81C784; // Thảm cỏ xanh tươi
      const cDeck = 0xE0E0E0; // Sàn bê tông trắng xám quanh hồ bơi
      const cPool = 0x26C6DA; // Nước hồ bơi xanh ngọc cực đẹp
      const cPath = 0xF5F5F5; // Lối đi đá trắng

      const cWallL_Front = 0xFDFBF7; // Tường kem sáng mặt tiền khối trái
      const cWallL_Side = 0xE5E0D8; // Tường xám kem hông khối trái
      const cWallR_Front = 0xE8D8C8; // Tường đá ấm mặt tiền khối phải
      const cWallR_Side = 0xD7C4B7; // Tường đá hông khối phải

      const cRoof = 0x7E7D78; // Mái phẳng xám
      const cRoofBorder = 0x4A4946; // Gờ chắn mái sẫm màu

      const cWin = 0x1A252C; // Vách kính lớn đen xanh
      const cWinFrame = 0x34495E; // Khung cửa kính
      const cAwning = 0x4E5D6C; // Mái che canopy khối trái

      const cBalcony = 0xF5F5F5; // Ban công khối phải
      const cBalconyRailing = 0xFFFFFF; // Lan can kính trắng

      const cUmbrella = 0xFFEB3B; // Dù che nắng màu vàng tươi rực rỡ
      const cPole = 0x9E9E9E; // Cọc sắt dù
      const cLounger = 0xFFFFFF; // Ghế nghỉ trắng

      const cHedge = 0x66BB6A; // Hàng rào cỏ xanh lá
      const cHedgeSide = 0x4CAF50;

      // 1. Thảm cỏ nền (Base Grass)
      drawPoly([pt(-4, -4, 0), pt(w + 4, -4, 0), pt(w + 4, d + 4, 0), pt(-4, d + 4, 0)], cGrass);

      // 2. Lối đi đá trắng vào nhà (Path)
      drawPoly([pt(9, 17, 0), pt(14, 17, 0), pt(14, 21, 0), pt(9, 21, 0)], cPath);

      // 3. Hồ bơi hiện đại (Modern Swimming Pool) bên trái
      // Sàn Deck gỗ/bê tông quanh hồ bơi
      drawPoly([pt(-3, 8, 0), pt(5, 8, 0), pt(5, 18, 0), pt(-3, 18, 0)], cDeck);
      // Lòng hồ bơi (Water)
      drawPoly([pt(-2, 9, 0), pt(4, 9, 0), pt(4, 17, 0), pt(-2, 17, 0)], cPool);

      // Ghế nghỉ mát bãi biển (Sun Lounger) cạnh hồ bơi
      drawPoly([pt(1.5, 6.5, 0), pt(3.5, 6.5, 0), pt(3.5, 7.5, 0.2), pt(1.5, 7.5, 0.2)], cLounger);
      drawPoly([pt(1.5, 7.5, 0.2), pt(3.5, 7.5, 0.2), pt(3.5, 7.8, 1.2), pt(1.5, 7.8, 1.2)], cLounger); // Phần tựa lưng nghiêng

      // Dù che nắng màu vàng rực rỡ (Beach Parasol)
      // Trụ dù
      drawPoly([pt(0, 6, 0), pt(0.4, 6, 0), pt(0.4, 6, 6), pt(0, 6, 6)], cPole);
      // Tán dù chóp nón
      drawPoly([pt(0.2, 6, 7.5), pt(-2, 4, 5.5), pt(2, 4, 5.5)], cUmbrella);
      drawPoly([pt(0.2, 6, 7.5), pt(2, 4, 5.5), pt(2, 8, 5.5)], cUmbrella);
      drawPoly([pt(0.2, 6, 7.5), pt(2, 8, 5.5), pt(-2, 8, 5.5)], cUmbrella);
      drawPoly([pt(0.2, 6, 7.5), pt(-2, 8, 5.5), pt(-2, 4, 5.5)], cUmbrella);

      // ==========================================
      // KHỐI TRÁI: 2 tầng xám trắng (ix: 6..13, iy: 4..17, h: 14)
      // ==========================================
      // Tường hông trái (ix = 6)
      drawPoly([pt(6, 4, 0), pt(6, 17, 0), pt(6, 17, 14), pt(6, 4, 14)], cWallL_Side);
      // Tường mặt tiền trái (iy = 17)
      drawPoly([pt(6, 17, 0), pt(13, 17, 0), pt(13, 17, 14), pt(6, 17, 14)], cWallL_Front);

      // Cửa kính lớn tầng 1 mặt tiền trái
      drawPoly([pt(7.5, 17, 1), pt(11.5, 17, 1), pt(11.5, 17, 5.5), pt(7.5, 17, 5.5)], cWin);
      g.moveTo(pt(9.5, 17, 1).x, pt(9.5, 17, 1).y).lineTo(pt(9.5, 17, 5.5).x, pt(9.5, 17, 5.5).y).stroke({ color: cWinFrame, width: 0.8 });

      // Mái che canopy tầng 1
      drawPoly([pt(7, 17, 5.8), pt(12, 17, 5.8), pt(12, 18.2, 5.8), pt(7, 18.2, 5.8)], cAwning);
      drawPoly([pt(7, 17, 5.5), pt(12, 17, 5.5), pt(12, 17, 5.8), pt(7, 17, 5.8)], cAwning);

      // Cửa kính lớn tầng 2 mặt tiền trái
      drawPoly([pt(7.5, 17, 8), pt(11.5, 17, 8), pt(11.5, 17, 12.5), pt(7.5, 17, 12.5)], cWin);
      g.moveTo(pt(9.5, 17, 8).x, pt(9.5, 17, 8).y).lineTo(pt(9.5, 17, 12.5).x, pt(9.5, 17, 12.5).y).stroke({ color: cWinFrame, width: 0.8 });

      // Mái bằng khối trái (z = 14)
      drawPoly([pt(6, 4, 14), pt(13, 4, 14), pt(13, 17, 14), pt(6, 17, 14)], cRoof);
      drawPoly([pt(6, 17, 14), pt(13, 17, 14), pt(13, 17, 14.6), pt(6, 17, 14.6)], cRoofBorder);
      drawPoly([pt(6, 4, 14), pt(6, 17, 14), pt(6, 17, 14.6), pt(6, 4, 14.6)], cRoofBorder);

      // ==========================================
      // KHỐI PHẢI: Tường đá ấm, cao hơn (ix: 13..21, iy: 4..17, h: 16.5)
      // ==========================================
      // Tường hông phải (ix = 21)
      drawPoly([pt(21, 4, 0), pt(21, 17, 0), pt(21, 17, 16.5), pt(21, 4, 16.5)], cWallR_Side);
      // Tường mặt tiền phải (iy = 17)
      drawPoly([pt(13, 17, 0), pt(21, 17, 0), pt(21, 17, 16.5), pt(13, 17, 16.5)], cWallR_Front);

      // Cửa ra vào lớn bằng kính tầng 1
      const doorW = 5;
      const doorH = 6;
      const dx = 13 + (8 - doorW) / 2; // Cân giữa ix=13..21
      drawPoly([pt(dx, 17, 0.5), pt(dx + doorW, 17, 0.5), pt(dx + doorW, 17, 0.5 + doorH), pt(dx, 17, 0.5 + doorH)], cWin);
      g.moveTo(pt(dx + doorW / 2, 17, 0.5).x, pt(dx + doorW / 2, 17, 0.5).y).lineTo(pt(dx + doorW / 2, 17, 0.5 + doorH).x, pt(dx + doorW / 2, 17, 0.5 + doorH).y).stroke({ color: cWinFrame, width: 1 });

      // Ban công nhô rộng tầng 2 (z = 7.5)
      drawPoly([pt(13, 17, 7.5), pt(21, 17, 7.5), pt(21, 18.5, 7.5), pt(13, 18.5, 7.5)], cBalcony);
      // Lan can kính trắng
      drawPoly([pt(13, 18.5, 7.5), pt(21, 18.5, 7.5), pt(21, 18.5, 9), pt(13, 18.5, 9)], cBalconyRailing, 0xdddddd, 0.5);
      drawPoly([pt(13, 17, 7.5), pt(13, 18.5, 7.5), pt(13, 18.5, 9), pt(13, 17, 9)], cBalconyRailing, 0xdddddd, 0.5);
      drawPoly([pt(21, 17, 7.5), pt(21, 18.5, 7.5), pt(21, 18.5, 9), pt(21, 17, 9)], cBalconyRailing, 0xdddddd, 0.5);

      // Cửa kính lớn tầng 2 mặt tiền phải
      drawPoly([pt(14, 17, 8.5), pt(20, 17, 8.5), pt(20, 17, 14.5), pt(14, 17, 14.5)], cWin);
      g.moveTo(pt(17, 17, 8.5).x, pt(17, 17, 8.5).y).lineTo(pt(17, 17, 14.5).x, pt(17, 17, 14.5).y).stroke({ color: cWinFrame, width: 0.8 });

      // Mái bằng khối phải (z = 16.5)
      drawPoly([pt(13, 4, 16.5), pt(21, 4, 16.5), pt(21, 17, 16.5), pt(13, 17, 16.5)], cRoof);
      drawPoly([pt(13, 17, 16.5), pt(21, 17, 16.5), pt(21, 17, 17.1), pt(13, 17, 17.1)], cRoofBorder);
      drawPoly([pt(21, 4, 16.5), pt(21, 17, 16.5), pt(21, 17, 17.1), pt(21, 4, 17.1)], cRoofBorder);

      // ==========================================
      // CẢNH QUAN PHỤ
      // ==========================================
      // Bụi cỏ hàng rào trang trí trước nhà
      drawPoly([pt(5, 19, 0), pt(11, 19, 0), pt(11, 19, 2), pt(5, 19, 2)], cHedge);
      drawPoly([pt(11, 18, 0), pt(11, 19, 0), pt(11, 19, 2), pt(11, 18, 2)], cHedgeSide);
    } else if (count === 2) {
      // --- L-SHAPE VILLA (Level 2) ---
      const w1 = 14, d1 = 16, h1 = 10, rh1 = 8;
      const w2 = 12, d2 = 12, h2 = 8, rh2 = 6;
      const ox = 1.5, oy = 1.5;
      const totalW = w1 + w2;
      const pt = (ix: number, iy: number, iz: number) => isoPt(ix - totalW/2, iy - d1/2, iz);

      const cGrass = 0xAED581, cDriveway = 0x9E9E9E, cWall = 0xF5F5F5, cWallSide = 0xE0E0E0;
      const cRoof = 0xD84315, cRoofSide = 0xBF360C, cGarageDoor = 0xFFCC80, cMainDoor = 0xD84315;
      const cWin = 0xB3E5FC, cTrunk = 0x5D4037, cLeavesL = 0x388E3C, cLeavesR = 0x2E7D32;

      drawPoly([pt(-4, -4, 0), pt(totalW+4, -4, 0), pt(totalW+4, d1+6, 0), pt(-4, d1+6, 0)], cGrass);
      drawPoly([pt(w1+2, d1, 0), pt(w1+10, d1, 0), pt(w1+10, d1+6, 0), pt(w1+2, d1+6, 0)], cDriveway);

      // Tree 1
      drawPoly([pt(-2, d1+2, 0), pt(-1, d1+2, 0), pt(-1, d1+2, 2), pt(-2, d1+2, 2)], cTrunk);
      drawPoly([pt(-3.5, d1+2, 2), pt(-1.5, d1+2, 2), pt(-1.5, d1+2, 10)], cLeavesL);
      drawPoly([pt(-1.5, d1+2, 2), pt(0.5, d1+2, 2), pt(-1.5, d1+2, 10)], cLeavesR);

      // Garage
      drawPoly([pt(totalW, d1-d2, 0), pt(totalW, d1, 0), pt(totalW, d1, h2), pt(totalW, d1-d2, h2)], cWallSide);
      drawPoly([pt(w1, d1, 0), pt(totalW, d1, 0), pt(totalW, d1, h2), pt(w1+w2/2, d1, h2+rh2), pt(w1, d1, h2)], cWall);
      drawPoly([pt(w1+2, d1, 0), pt(w1+10, d1, 0), pt(w1+10, d1, 6), pt(w1+2, d1, 6)], cGarageDoor, 0xd89c50, 1);
      g.moveTo(pt(w1+2, d1, 2).x, pt(w1+2, d1, 2).y).lineTo(pt(w1+10, d1, 2).x, pt(w1+10, d1, 2).y).stroke({ color: 0xd89c50, width: 1 });
      g.moveTo(pt(w1+2, d1, 4).x, pt(w1+2, d1, 4).y).lineTo(pt(w1+10, d1, 4).x, pt(w1+10, d1, 4).y).stroke({ color: 0xd89c50, width: 1 });

      // Main House
      drawPoly([pt(w1, 0, 0), pt(w1, d1, 0), pt(w1, d1, h1), pt(w1, 0, h1)], cWallSide);
      drawPoly([pt(0, d1, 0), pt(w1, d1, 0), pt(w1, d1, h1), pt(w1/2, d1, h1+rh1), pt(0, d1, h1)], cWall);
      drawPoly([pt(4, d1, 0), pt(7, d1, 0), pt(7, d1, 4), pt(6.5, d1, 5), pt(4.5, d1, 5), pt(4, d1, 4)], cMainDoor);
      drawPoly([pt(9, d1, 2), pt(12, d1, 2), pt(12, d1, 5), pt(10.5, d1, 6), pt(9, d1, 5)], cWin, 0xffffff);
      g.moveTo(pt(10.5, d1, 2).x, pt(10.5, d1, 2).y).lineTo(pt(10.5, d1, 6).x, pt(10.5, d1, 6).y).stroke({color: 0xffffff, width: 1});
      g.moveTo(pt(9, d1, 4).x, pt(9, d1, 4).y).lineTo(pt(12, d1, 4).x, pt(12, d1, 4).y).stroke({color: 0xffffff, width: 1});
      drawPoly([pt(6, d1, h1+1), pt(8, d1, h1+1), pt(8, d1, h1+3), pt(7, d1, h1+4), pt(6, d1, h1+3)], cWin, 0xffffff);

      // Roofs (Garage first, then Main)
      drawPoly([pt(w1, d1-d2-oy, h2-1), pt(w1+w2/2, d1-d2-oy, h2+rh2+0.5), pt(w1+w2/2, d1+oy, h2+rh2+0.5), pt(w1, d1+oy, h2-1)], cRoofSide);
      drawPoly([pt(w1+w2/2, d1-d2-oy, h2+rh2+0.5), pt(totalW+ox, d1-d2-oy, h2-1), pt(totalW+ox, d1+oy, h2-1), pt(w1+w2/2, d1+oy, h2+rh2+0.5)], cRoof);
      drawPoly([pt(w1/2, -oy, h1+rh1+0.5), pt(w1+ox, -oy, h1-1), pt(w1+ox, d1+oy, h1-1), pt(w1/2, d1+oy, h1+rh1+0.5)], cRoof);
      drawPoly([pt(-ox, -oy, h1-1), pt(w1/2, -oy, h1+rh1+0.5), pt(w1/2, d1+oy, h1+rh1+0.5), pt(-ox, d1+oy, h1-1)], cRoofSide);

      // Tree 2
      const tx2 = totalW + 2, ty2 = d1 + 2;
      drawPoly([pt(tx2-0.5, ty2, 0), pt(tx2+0.5, ty2, 0), pt(tx2+0.5, ty2, 2), pt(tx2-0.5, ty2, 2)], cTrunk);
      drawPoly([pt(tx2-2.5, ty2, 2), pt(tx2, ty2, 2), pt(tx2, ty2, 10)], cLeavesL);
      drawPoly([pt(tx2, ty2, 2), pt(tx2+2.5, ty2, 2), pt(tx2, ty2, 10)], cLeavesR);

    } else {
      // --- SMALL HOUSE (Level 1) ---
      const w = 12, d = 16, h = 10, rh = 7.5;
      const pt = (ix: number, iy: number, iz: number) => isoPt(ix - w/2, iy - d/2, iz);

      const cBase = 0xD7CCC8; // Móng xám ấm
      const cWallR = 0xFDFBF7; // Tường mặt tiền trắng kem sáng (Facade)
      const cWallL = 0xBCAAA4; // Tường hông nâu gỗ nhạt (Side Wall)
      const cRoof = 0x9E4733; // Mái ngói đỏ cam đất nung
      const cRoofSide = 0x7E3524; // Viền đổ bóng mái ngói
      const cTrim = 0x5D4037; // Khung gỗ nâu đậm
      const cTrimSide = 0x4E342E; // Khung gỗ nâu đậm tối màu (mặt hông)
      const cDoor = 0x8D6E63; // Màu gỗ cánh cửa
      const cWin = 0x2C3E50; // Kính cửa sổ xanh xám tối màu

      // 1. Móng nhà (Base)
      drawPoly([pt(-1, -1, 0), pt(w + 1, -1, 0), pt(w + 1, d + 1, 0), pt(-1, d + 1, 0)], cBase);

      // 2. Tường hông bên phải (Side Wall)
      drawPoly([pt(w, 0, 0), pt(w, d, 0), pt(w, d, h), pt(w, 0, h)], cWallL);

      // 3. Tường mặt tiền bên trái (Facade Wall)
      drawPoly([pt(0, d, 0), pt(w, d, 0), pt(w, d, h), pt(w / 2, d, h + rh), pt(0, d, h)], cWallR);

      // 4. Viền cột góc gỗ nâu đậm (Corner Trims) để tạo chiều sâu 3D
      // Cột góc trước (Front Corner)
      drawPoly([pt(w - 0.8, d, 0), pt(w, d, 0), pt(w, d, h), pt(w - 0.8, d, h)], cTrim);
      drawPoly([pt(w, d - 0.8, 0), pt(w, d, 0), pt(w, d, h), pt(w, d - 0.8, h)], cTrimSide);
      // Cột góc trái (Left Corner)
      drawPoly([pt(0, d - 0.8, 0), pt(0, d, 0), pt(0, d, h), pt(0, d - 0.8, h)], cTrim);
      // Cột góc phải (Right Corner)
      drawPoly([pt(w - 0.8, 0, 0), pt(w, 0, 0), pt(w, 0, h), pt(w - 0.8, 0, h)], cTrimSide);

      // 5. Khung gỗ trang trí Tudor trên đầu mái mặt tiền (Triangle Timbering)
      // Viền mái chéo gables
      drawPoly([pt(0, d, h), pt(w / 2, d, h + rh), pt(w / 2, d, h + rh - 0.8), pt(0, d, h)], cTrim);
      drawPoly([pt(w, d, h), pt(w / 2, d, h + rh), pt(w / 2, d, h + rh - 0.8), pt(w, d, h)], cTrim);
      // Thanh dọc giữa mái
      drawPoly([pt(w / 2 - 0.4, d, h), pt(w / 2 + 0.4, d, h), pt(w / 2 + 0.4, d, h + rh - 0.8), pt(w / 2 - 0.4, d, h)], cTrim);
      // Các thanh chéo phụ
      drawPoly([pt(w / 4, d, h), pt(w / 2, d, h + rh / 2), pt(w / 2, d, h + rh / 2 - 0.6), pt(w / 4 + 0.6, d, h)], cTrim);
      drawPoly([pt(3 * w / 4, d, h), pt(w / 2, d, h + rh / 2), pt(w / 2, d, h + rh / 2 - 0.6), pt(3 * w / 4 - 0.6, d, h)], cTrim);

      // 6. Cửa chính gỗ ấm (Front Door) ở giữa mặt tiền
      const doorW = 4;
      const doorH = 6.5;
      const dx = w / 2 - doorW / 2;
      // Khung gỗ cửa đi
      drawPoly([pt(dx - 0.6, d, 0), pt(dx + doorW + 0.6, d, 0), pt(dx + doorW + 0.6, d, doorH + 0.6), pt(dx - 0.6, d, doorH + 0.6)], cTrim);
      // Cánh cửa chính
      drawPoly([pt(dx, d, 0), pt(dx + doorW, d, 0), pt(dx + doorW, d, doorH), pt(dx, d, doorH)], cDoor);
      // Chia vân gỗ trên cửa
      g.moveTo(pt(dx + doorW / 3, d, 0).x, pt(dx + doorW / 3, d, 0).y).lineTo(pt(dx + doorW / 3, d, doorH).x, pt(dx + doorW / 3, d, doorH).y).stroke({ color: cTrim, width: 0.8 });
      g.moveTo(pt(dx + 2 * doorW / 3, d, 0).x, pt(dx + 2 * doorW / 3, d, 0).y).lineTo(pt(dx + 2 * doorW / 3, d, doorH).x, pt(dx + 2 * doorW / 3, d, doorH).y).stroke({ color: cTrim, width: 0.8 });

      // 7. Cửa sổ bên hông (Side Window)
      const winW = 4.5;
      const winH = 4;
      const wy = d / 2 - winW / 2;
      // Khung gỗ cửa sổ
      drawPoly([pt(w, wy - 0.5, 3), pt(w, wy + winW + 0.5, 3), pt(w, wy + winW + 0.5, 3 + winH + 0.5), pt(w, wy - 0.5, 3 + winH + 0.5)], cTrimSide);
      // Kính màu tối
      drawPoly([pt(w, wy, 3.5), pt(w, wy + winW, 3.5), pt(w, wy + winW, 3.5 + winH), pt(w, wy, 3.5 + winH)], cWin);
      // Thanh chia ô cửa sổ nhỏ
      g.moveTo(pt(w, wy + winW / 2, 3.5).x, pt(w, wy + winW / 2, 3.5).y).lineTo(pt(w, wy + winW / 2, 3.5 + winH).x, pt(w, wy + winW / 2, 3.5 + winH).y).stroke({ color: 0xffffff, width: 0.5, alpha: 0.4 });

      // 8. Mái nhà (Roof)
      // Mái bên phải (Bottom-Right slope)
      drawPoly([pt(w / 2, -1, h + rh + 0.5), pt(w + 1, -1, h - 0.5), pt(w + 1, d + 1, h - 0.5), pt(w / 2, d + 1, h + rh + 0.5)], cRoof);
      // Viền mái trước nổi bật (Front gable overhang)
      drawPoly([pt(w + 1, d + 1, h - 0.5), pt(w / 2, d + 1, h + rh + 0.5), pt(w / 2, d, h + rh), pt(w, d, h)], cRoofSide);
      drawPoly([pt(-1, d + 1, h - 0.5), pt(w / 2, d + 1, h + rh + 0.5), pt(w / 2, d, h + rh), pt(0, d, h)], cRoofSide);
    }

    container.addChild(g);
  }
  // ─── Tokens ────────────────────────────────────────────────────────────────

  updateTokens(players: Map<string, PlayerState>) {
    players.forEach((player, id) => {
      if (player.isBankrupt) {
        const t = this.tokens.get(id);
        if (t) { t.visible = false; }
        return;
      }

      if (!this.tokens.has(id)) {
        const token = this._createToken(player);
        this.tokens.set(id, token);
        this.tokenContainer.addChild(token);
      }

      const token = this.tokens.get(id)!;
      const pos   = this._getTokenPos(player.position, id, players);

      gsap.to(token.position, {
        x: pos.x, y: pos.y,
        duration: 0.6,
        ease: 'power2.inOut',
      });
    });
  }

  private _createToken(player: PlayerState): PIXI.Container {
    const root = new PIXI.Container();
    const c = new PIXI.Container();
    const color = parseInt(player.color.replace('#', '0x'));

    const shadow = new PIXI.Graphics();
    shadow.ellipse(0, 8, 12, 6);
    shadow.fill({ color: 0x000000, alpha: 0.4 });
    root.addChild(shadow); // Bóng đứng yên

    const body = new PIXI.Graphics();
    body.circle(0, -12, 10);
    body.fill({ color });
    body.roundRect(-7, -6, 14, 14, 4);
    body.fill({ color });
    body.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });
    c.addChild(body);

    const letter = new PIXI.Text({
      text: player.name.charAt(0).toUpperCase(),
      style: new PIXI.TextStyle({ fontSize: 10, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' }),
    });
    letter.anchor.set(0.5, 0.5);
    letter.position.set(0, -12);
    c.addChild(letter);

    root.addChild(c);

    gsap.to(c, {
      y: '-=4',
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      delay: Math.random() * 0.5,
    });

    return root;
  }

  private _getTokenPos(position: number, playerId: string, players: Map<string, PlayerState>): { x: number; y: number } {
    const base = TILE_COORDINATES[position] || { x: 0, y: 0 };
    const samePos = Array.from(players.values()).filter(p => p.position === position && !p.isBankrupt);
    const myIndex = samePos.findIndex(p => p.id === playerId);
    const offsets = [
      { dx:  0, dy: 0 }, { dx: 12, dy: 6 }, { dx: -12, dy: 6 },
      { dx:  6, dy: -10 }, { dx: -6, dy: -10 }, { dx: 18, dy: -5 },
    ];
    // Nếu myIndex = -1 thì myIndex % offsets.length = -1
    // offsets[-1] sẽ là undefined!
    const index = Math.max(0, myIndex);
    const off = offsets[index % offsets.length] || { dx: 0, dy: 0 };

    return { x: base.x + off.dx, y: base.y + off.dy };
  }

  highlightTile(tileId: number | null, prevId: number | null) {
    if (prevId !== null) {
      const prev = this.tiles.get(prevId);
      if (prev) {
        // Draw normal hitbox
        let bg = prev.children.find(c => c.label === 'highlight') as PIXI.Graphics;
        if (bg) bg.destroy();
      }
    }
    if (tileId !== null) {
      const curr = this.tiles.get(tileId);
      if (curr) {
        const bg = new PIXI.Graphics();
        bg.label = 'highlight';
        bg.poly(this._getIsoPolygon(tileId));
        bg.fill({ color: 0xffffff, alpha: 0.3 });
        curr.addChildAt(bg, 0);
      }
    }
  }

  resize(w: number, h: number) {
    this.app.renderer.resize(w, h);
    this.centerBoard();
  }

  destroy() {
    this.app.destroy(false, { children: true });
  }

  // ─── Waypoint Editor (Dev Mode) ─────────────────────────────────────────────

  toggleEditMode() {
    this.editMode = !this.editMode;

    if (this.editMode) {
      // Create draggables
      for (let i = 0; i < TILE_COUNT; i++) {
        const pos = TILE_COORDINATES[i];
        const g = new PIXI.Graphics();
        g.circle(0, 0, 15);
        g.fill({ color: 0xff0000, alpha: 0.6 });
        g.stroke({ color: 0xffffff, width: 2 });

        const label = new PIXI.Text({ text: i.toString(), style: { fontSize: 12, fill: 0xffffff } });
        label.anchor.set(0.5);
        g.addChild(label);

        g.position.set(pos.x, pos.y);
        g.eventMode = 'static';
        g.cursor = 'grab';

        let dragging = false;
        g.on('pointerdown', () => { dragging = true; g.cursor = 'grabbing'; });
        g.on('globalpointermove', (e) => {
          if (dragging) {
            const newPos = this.boardContainer.toLocal(e.global);
            g.position.set(newPos.x, newPos.y);
            TILE_COORDINATES[i] = { x: Math.round(newPos.x), y: Math.round(newPos.y) };

            // Sync logic hitbox
            const tile = this.tiles.get(i);
            if (tile) tile.position.set(newPos.x, newPos.y);
          }
        });
        g.on('pointerup', () => { dragging = false; g.cursor = 'grab'; });
        g.on('pointerupoutside', () => { dragging = false; g.cursor = 'grab'; });

        this.boardContainer.addChild(g);
        this.editAnchors.push(g);
      }
    } else {
      this.editAnchors.forEach(a => a.destroy());
      this.editAnchors = [];
    }
  }

  private _drawPortModel(container: PIXI.Container, id: number, ownerColor?: number) {
    const g = new PIXI.Graphics();

    // Tùy chỉnh độ cao tổng thể
    const offsetY = -5;
    if ((id > 8 && id < 16) || (id > 24 && id < 32)) {
      g.scale.x = -1;
    }
    const isoPt = (ix: number, iy: number, iz: number) => ({
      x: ix - iy,
      y: offsetY + ix * 0.5 + iy * 0.5 - iz
    });

    const drawPoly = (points: {x:number, y:number}[], fill: number, strokeColor: number = -1, strokeW: number = 1) => {
      g.poly(points);
      g.fill({ color: fill });
      if (strokeColor !== -1) g.stroke({ color: strokeColor, width: strokeW, alpha: 0.9, alignment: 1 });
    };

    const w = 24, d = 20; 
    const pt = (ix: number, iy: number, iz: number) => isoPt(ix - w/2, iy - d/2, iz);

    // Bảng màu chuẩn từ hình ảnh
    const cSand = 0xEBDCB9; // Cát vàng nhạt kem
    const cSandDark = 0xC1AC8A; // Mặt hông cát đổ bóng
    const cWater = 0x51A8DD; // Nước biển xanh da trời nhạt
    const cWaterDeep = 0x1E88E5; // Bóng nước biển sâu
    const cWaterDark = 0x0D47A1; // Mặt hông nước biển sâu
    const cFoam = 0xF0F8FF; // Bọt sóng trắng kem
    const cWood = 0x7C5A43; // Sàn gỗ nâu vừa
    const cWoodDark = 0x543B2A; // Sàn gỗ bóng tối
    const cRoof = 0x8C3B30; // Đỏ gạch/đất nung mái vòm
    const cRoofSide = 0x6D2B22; // Đỏ tối hông mái
    const cGlass = 0xD0E8F2; // Mặt kính xanh ngọc nhạt
    const cGlassFrame = 0x3E2723; // Khung cửa gỗ đậm
    const cSofa = 0xFFFFFF; // Sofa trắng
    const cSofaShadow = 0xE0E0E0; // Bóng sofa
    
    const flagColor = ownerColor !== undefined ? ownerColor : 0xD32F2F;
    const boatColor = ownerColor !== undefined ? ownerColor : 0xD32F2F;

    // ------------------------------------------
    // 1. NỀN 3D NỔI (3D DIORAMA BASE)
    // ------------------------------------------
    // Vẽ mặt phẳng cát (Sand top)
    drawPoly([pt(-4, -4, 0), pt(12, -4, 0), pt(6, d+4, 0), pt(-4, d+4, 0)], cSand);
    // Vẽ mặt phẳng nước (Water top)
    drawPoly([pt(12, -4, 0), pt(w+4, -4, 0), pt(w+4, d+4, 0), pt(6, d+4, 0)], cWater);
    // Bờ biển đổ bóng nước sâu
    drawPoly([pt(12, -4, 0), pt(6, d+4, 0), pt(6.8, d+4, 0), pt(12.8, -4, 0)], cWaterDeep);
    // Vẽ bọt sóng dọc bờ biển
    drawPoly([pt(11.5, -4, 0), pt(12.5, -4, 0), pt(6.5, d+4, 0), pt(5.5, d+4, 0)], cFoam, -1);

    // Chiều dày của đế 3D (Độ cao h = -3)
    // Mặt hông trái (X axis, iy = d+4) - split cát và nước
    // Phần cát của hông trái: từ ix = -4 đến 6
    drawPoly([pt(-4, d+4, 0), pt(6, d+4, 0), pt(6, d+4, -3), pt(-4, d+4, -3)], cSandDark);
    // Phần nước của hông trái: từ ix = 6 đến w+4
    drawPoly([pt(6, d+4, 0), pt(w+4, d+4, 0), pt(w+4, d+4, -3), pt(6, d+4, -3)], cWaterDark);
    
    // Mặt hông phải (Y axis, ix = w+4) - hoàn toàn là nước
    drawPoly([pt(w+4, -4, 0), pt(w+4, d+4, 0), pt(w+4, d+4, -3), pt(w+4, -4, -3)], cWaterDark);

    // ------------------------------------------
    // 2. CÂY DỪA (TALL CURVED PALM TREES)
    // ------------------------------------------
    const drawPalmTree = (baseX: number, baseY: number, height: number, scale: number) => {
      const cTrunk = 0x8D6E63;
      const cTrunkRing = 0x5D4037;
      const segs = 7;
      let cx = baseX;
      let cy = baseY;
      let cz = 0;
      
      for (let i = 1; i <= segs; i++) {
        const nextZ = (height / segs) * i;
        // Cong nghiêng mạnh sang phải và phía trước
        const nextX = baseX + Math.sin((i / segs) * (Math.PI / 2.5)) * 4 * scale;
        const nextY = baseY + (i / segs) * 1.5 * scale;
        
        // Vẽ thân đốt dừa
        drawPoly([
          pt(cx - 0.4 * scale, cy - 0.4 * scale, cz),
          pt(nextX - 0.4 * scale, nextY - 0.4 * scale, nextZ),
          pt(nextX + 0.4 * scale, nextY + 0.4 * scale, nextZ),
          pt(cx + 0.4 * scale, cy + 0.4 * scale, cz)
        ], cTrunk);
        
        // Vẽ vòng thắt đốt dừa
        g.moveTo(pt(nextX - 0.4 * scale, nextY - 0.4 * scale, nextZ).x, pt(nextX - 0.4 * scale, nextY - 0.4 * scale, nextZ).y)
         .lineTo(pt(nextX + 0.4 * scale, nextY + 0.4 * scale, nextZ).x, pt(nextX + 0.4 * scale, nextY + 0.4 * scale, nextZ).y)
         .stroke({ color: cTrunkRing, width: 0.8 });

        cx = nextX;
        cy = nextY;
        cz = nextZ;
      }

      // Tán lá dừa sinh động
      const cLeaves = 0x2E7D32;
      const cLeavesLight = 0x4CAF50;
      
      // 5 cành lá chính cong rủ xuống
      const leaves = [
        { dx: -4.5, dy: -1.5, dz: -4 },
        { dx: 4.5, dy: 1.5, dz: -4 },
        { dx: -1.5, dy: 4.5, dz: -4 },
        { dx: 1.5, dy: -4.5, dz: -4 },
        { dx: -3.0, dy: -3.0, dz: -3.5 },
        { dx: 3.0, dy: 3.0, dz: -3.5 }
      ];

      leaves.forEach(leaf => {
        // Spine của lá
        const endPt = pt(cx + leaf.dx * scale, cy + leaf.dy * scale, cz + leaf.dz * scale);
        g.moveTo(pt(cx, cy, cz).x, pt(cx, cy, cz).y)
         .quadraticCurveTo(
            pt(cx + leaf.dx * 0.5 * scale, cy + leaf.dy * 0.5 * scale, cz + 1).x,
            pt(cx + leaf.dx * 0.5 * scale, cy + leaf.dy * 0.5 * scale, cz + 1).y,
            endPt.x, endPt.y
         )
         .stroke({ color: cLeavesLight, width: 1.5 });

        // Vẽ các lá nhỏ (leaflets) chìa ra
        for (let pct = 0.2; pct <= 1.0; pct += 0.2) {
          const lx = cx + leaf.dx * pct * scale;
          const ly = cy + leaf.dy * pct * scale;
          const lz = cz + leaf.dz * pct * scale;
          
          // Vẽ 2 lá đối xứng rủ xuống
          drawPoly([
            pt(lx, ly, lz),
            pt(lx - 0.4 * scale, ly - 0.4 * scale, lz - 1.2 * scale),
            pt(lx - 0.1 * scale, ly - 0.1 * scale, lz - 0.5 * scale)
          ], cLeaves);
          drawPoly([
            pt(lx, ly, lz),
            pt(lx + 0.4 * scale, ly + 0.4 * scale, lz - 1.2 * scale),
            pt(lx + 0.1 * scale, ly + 0.1 * scale, lz - 0.5 * scale)
          ], cLeaves);
        }
      });
    };

    // Vẽ 2 cây dừa đan nhau nghiêng bóng
    drawPalmTree(0, 2, 16, 1.1); // Cây dừa cao
    drawPalmTree(2, 0, 11, 0.85); // Cây dừa thấp hơn

    // ------------------------------------------
    // 3. NHÀ VÒM MÁI NHỌN GOTHIC (GOTHIC VAULT CABIN)
    // ------------------------------------------
    // Sàn gỗ nâng cao (Deck Platform)
    drawPoly([pt(3, 3, 0), pt(11, 3, 0), pt(11, 11, 0), pt(3, 11, 0)], cWoodDark);
    drawPoly([pt(3, 3, 1), pt(11, 3, 1), pt(11, 11, 1), pt(3, 11, 1)], cWood);
    drawPoly([pt(11, 3, 0), pt(11, 11, 0), pt(11, 11, 1), pt(11, 3, 1)], cWoodDark);
    drawPoly([pt(3, 11, 0), pt(11, 11, 0), pt(11, 11, 1), pt(3, 11, 1)], cWood);

    // Kẻ vân sàn gỗ
    for (let iy = 4.0; iy <= 10.5; iy += 1.5) {
      g.moveTo(pt(3, iy, 1).x, pt(3, iy, 1).y).lineTo(pt(11, iy, 1).x, pt(11, iy, 1).y).stroke({ color: cWoodDark, width: 0.8 });
    }

    // Tường bên hông gỗ tối (ix = 3)
    drawPoly([pt(3, 3, 1), pt(3, 11, 1), pt(3, 11, 7), pt(3, 3, 7)], cWoodDark);
    drawPoly([pt(3, 4.5, 2.2), pt(3, 6.5, 2.2), pt(3, 6.5, 5.5), pt(3, 4.5, 5.5)], cGlass, cGlassFrame, 1);
    drawPoly([pt(3, 7.5, 2.2), pt(3, 9.5, 2.2), pt(3, 9.5, 5.5), pt(3, 7.5, 5.5)], cGlass, cGlassFrame, 1);

    // Mặt kính trước hình vòm nhọn Gothic (Gothic Arch Front Facade - iy = 11)
    // Vẽ vách mặt tiền gỗ
    drawPoly([
      pt(3, 11, 1), pt(11, 11, 1), pt(11, 11, 7),
      pt(10, 11, 10.5), pt(7, 11, 15), pt(4, 11, 10.5), pt(3, 11, 7)
    ], cWood);

    // Vách kính vòm nhọn lớn ở trung tâm
    drawPoly([
      pt(4, 11, 1.8), pt(10, 11, 1.8), pt(10, 11, 8.5),
      pt(7, 11, 13.5), pt(4, 11, 8.5)
    ], cGlass);

    // Khung chia cửa kính Gothic
    g.moveTo(pt(7, 11, 1.8).x, pt(7, 11, 1.8).y).lineTo(pt(7, 11, 13.5).x, pt(7, 11, 13.5).y).stroke({ color: cGlassFrame, width: 1.2 });
    g.moveTo(pt(4, 11, 5).x, pt(4, 11, 5).y).lineTo(pt(10, 11, 5).x, pt(10, 11, 5).y).stroke({ color: cGlassFrame, width: 1 });
    g.moveTo(pt(5.5, 11, 1.8).x, pt(5.5, 11, 1.8).y).lineTo(pt(5.5, 11, 9.5).x, pt(5.5, 11, 9.5).y).stroke({ color: cGlassFrame, width: 0.8 });
    g.moveTo(pt(8.5, 11, 1.8).x, pt(8.5, 11, 1.8).y).lineTo(pt(8.5, 11, 9.5).x, pt(8.5, 11, 9.5).y).stroke({ color: cGlassFrame, width: 0.8 });

    // Khung gỗ bo ngoài hình vòm Gothic
    g.moveTo(pt(3, 11, 1).x, pt(3, 11, 1).y)
     .lineTo(pt(3, 11, 7).x, pt(3, 11, 7).y)
     .lineTo(pt(4, 11, 10.5).x, pt(4, 11, 10.5).y)
     .lineTo(pt(7, 11, 15).x, pt(7, 11, 15).y)
     .lineTo(pt(10, 11, 10.5).x, pt(10, 11, 10.5).y)
     .lineTo(pt(11, 11, 7).x, pt(11, 11, 7).y)
     .lineTo(pt(11, 11, 1).x, pt(11, 11, 1).y)
     .stroke({ color: cGlassFrame, width: 1.8 });

    // MÁI NHỌN GOTHIC CONG RA NGOÀI (GOTHIC ROOF VAULT)
    const roofSteps = [
      { x1: 3, z1: 7, x2: 4, z2: 10.5 },
      { x1: 4, z1: 10.5, x2: 5.2, z2: 13 },
      { x1: 5.2, z1: 13, x2: 7, z2: 15 },
      { x1: 7, z1: 15, x2: 8.8, z2: 13 },
      { x1: 8.8, z1: 13, x2: 10, z2: 10.5 },
      { x1: 10, z1: 10.5, x2: 11, z2: 7 }
    ];

    roofSteps.forEach((step, idx) => {
      const col = idx <= 2 ? cRoofSide : cRoof;
      drawPoly([
        pt(step.x1, 3, step.z1),
        pt(step.x2, 3, step.z2),
        pt(step.x2, 11.2, step.z2),
        pt(step.x1, 11.2, step.z1)
      ], col);
    });

    g.moveTo(pt(3, 11.2, 7).x, pt(3, 11.2, 7).y)
     .lineTo(pt(4, 11.2, 10.5).x, pt(4, 11.2, 10.5).y)
     .lineTo(pt(7, 11.2, 15).x, pt(7, 11.2, 15).y)
     .lineTo(pt(10, 11.2, 10.5).x, pt(10, 11.2, 10.5).y)
     .lineTo(pt(11, 11.2, 7).x, pt(11, 11.2, 7).y)
     .stroke({ color: 0xFFFFFF, width: 1.5, alpha: 0.95 });

    // Lá cờ sở hữu trên chóp mái nhọn
    if (ownerColor !== undefined) {
      drawPoly([pt(7, 6, 15), pt(7, 6, 19), pt(7.3, 6, 19), pt(7.3, 6, 15)], 0xDDDDDD);
      drawPoly([pt(7.2, 6, 19), pt(9.5, 6, 19), pt(9.0, 6, 17.5), pt(9.5, 6, 16), pt(7.2, 6, 16)], flagColor);
    }

    // ------------------------------------------
    // 4. SOFA TRẮNG TRÊN BAN CÔNG (WHITE SOFA DECK)
    // ------------------------------------------
    drawPoly([pt(4.5, 9.5, 1), pt(7.5, 9.5, 1), pt(7.5, 10.5, 1), pt(4.5, 10.5, 1)], cSofaShadow);
    drawPoly([pt(4.5, 9.5, 1.8), pt(7.5, 9.5, 1.8), pt(7.5, 10.5, 1.8), pt(4.5, 10.5, 1.8)], cSofa);
    drawPoly([pt(7.5, 9.5, 1), pt(7.5, 10.5, 1), pt(7.5, 10.5, 1.8), pt(7.5, 9.5, 1.8)], cSofaShadow);
    drawPoly([pt(4.5, 10.5, 1), pt(7.5, 10.5, 1), pt(7.5, 10.5, 1.8), pt(4.5, 10.5, 1.8)], cSofa);

    drawPoly([pt(4.5, 9.2, 1.8), pt(7.5, 9.2, 1.8), pt(7.5, 9.5, 1.8), pt(4.5, 9.5, 1.8)], cSofaShadow);
    drawPoly([pt(4.5, 9.2, 3.2), pt(7.5, 9.2, 3.2), pt(7.5, 9.5, 3.2), pt(4.5, 9.5, 3.2)], cSofa);
    drawPoly([pt(4.5, 9.5, 1.8), pt(7.5, 9.5, 1.8), pt(7.5, 9.5, 3.2), pt(4.5, 9.5, 3.2)], cSofa);
    drawPoly([pt(7.5, 9.2, 1.8), pt(7.5, 9.5, 1.8), pt(7.5, 9.5, 3.2), pt(7.5, 9.2, 3.2)], cSofaShadow);

    // ------------------------------------------
    // 5. CẦU TÀU GỖ (WOODEN DOCK RAMP)
    // ------------------------------------------
    drawPoly([pt(8.5, 11, 1), pt(10, 11, 1), pt(13, 16.5, 0.2), pt(11.5, 16.5, 0.2)], cWood);
    for (let step = 11.5; step <= 16.0; step += 0.8) {
      const pct = (step - 11) / 5;
      const xLeft = 8.5 + (11.5 - 8.5) * pct;
      const xRight = 10 + (13 - 10) * pct;
      const zInterp = 1 - 0.8 * pct;
      g.moveTo(pt(xLeft, step, zInterp).x, pt(xLeft, step, zInterp).y)
       .lineTo(pt(xRight, step, zInterp).x, pt(xRight, step, zInterp).y)
       .stroke({ color: cWoodDark, width: 1.0 });
    }

    // ------------------------------------------
    // 6. CA NÔ CAO TỐC (SPEEDBOAT / JET SKI)
    // ------------------------------------------
    drawPoly([
      pt(12.5, 13, 0.1),
      pt(16.0, 16.5, 0.15),
      pt(17.0, 15.5, 0.15),
      pt(13.5, 12, 0.1)
    ], 0xFFFFFF);
    
    drawPoly([
      pt(13.2, 13.3, 0.65),
      pt(15.7, 15.8, 0.7),
      pt(16.3, 15.2, 0.7),
      pt(13.8, 12.7, 0.65)
    ], boatColor);

    drawPoly([
      pt(13.8, 13.9, 0.65),
      pt(14.8, 14.9, 0.7),
      pt(15.2, 14.5, 0.7),
      pt(14.2, 13.5, 0.65)
    ], 0xB3E5FC);

    // ------------------------------------------
    // 7. ĐÁ CUỘI TRANG TRÍ (DECORATIVE BOULDERS)
    // ------------------------------------------
    const drawStone = (sx: number, sy: number) => {
      drawPoly([pt(sx, sy, 0), pt(sx+1.2, sy, 0.6), pt(sx+0.6, sy+1.2, 0.6), pt(sx, sy+0.6, 0)], 0xCFD8DC);
      drawPoly([pt(sx+1.2, sy, 0.6), pt(sx+0.6, sy+1.2, 0.6), pt(sx+0.6, sy+0.6, 1.2)], 0xB0BEC5);
      drawPoly([pt(sx, sy+0.6, 0), pt(sx+0.6, sy+1.2, 0.6), pt(sx+0.6, sy+0.6, 1.2)], 0x90A4AE);
    };
    drawStone(1, 10);
    drawStone(7, 2);

    container.addChild(g);
  }

  exportWaypoints() {
    console.log("export const TILE_COORDINATES: { [id: number]: { x: number; y: number } } = " + JSON.stringify(TILE_COORDINATES, null, 2) + ";");
    alert("Tọa độ đã được in ra Console (F12)!");
  }
}

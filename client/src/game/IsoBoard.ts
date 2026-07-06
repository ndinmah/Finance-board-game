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

      // Vẽ nhà
      if (tile.houseCount > 0) {
        this._drawHouseIndicators(visualLayer, tile.houseCount);
      }

      // Mortgage indicator
      if (tile.isMortgaged) {
        const lock = new PIXI.Text({ text: '🔒', style: { fontSize: 24 } });
        lock.anchor.set(0.5);
        visualLayer.addChild(lock);
      }

      container.addChild(visualLayer);
    });
  }

  private _drawHouseIndicators(container: PIXI.Container, count: number) {
    const isHotel = count === 4;
    const dotColor = isHotel ? 0xFF4444 : 0x44FF88;
    const dotCount = isHotel ? 1 : count;
    const dotR = isHotel ? 8 : 5;

    for (let i = 0; i < dotCount; i++) {
      const dot = new PIXI.Graphics();
      dot.circle(0, 0, dotR);
      dot.fill({ color: dotColor });
      dot.stroke({ color: 0xffffff, width: 2 });

      const spread = (dotCount - 1) * 14;
      dot.position.set(-spread / 2 + i * 14, -25);
      container.addChild(dot);
    }
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

  exportWaypoints() {
    console.log("export const TILE_COORDINATES: { [id: number]: { x: number; y: number } } = " + JSON.stringify(TILE_COORDINATES, null, 2) + ";");
    alert("Tọa độ đã được in ra Console (F12)!");
  }
}

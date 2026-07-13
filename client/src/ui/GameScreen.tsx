import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { IsoBoard } from '../game/IsoBoard';
import GameHUD from './GameHUD';
import DiceRoller from './DiceRoller';
import PropertyModal from './PropertyModal';
import TaxModal from './TaxModal';
import AirportModal from './AirportModal';
import FestivalModal from './FestivalModal';
import JailModal from './JailModal';
import ChanceModal from './ChanceModal';
import BuyUpgradeModal from './BuyUpgradeModal';
import EventLog from './EventLog';
import WinnerModal from './WinnerModal';
import './GameScreen.css';

export default function GameScreen() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const boardRef    = useRef<IsoBoard | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  const { board, players, selectedTileId, winnerId, gamePhase } = useGameStore();
  const setSelectedTileFn = useGameStore(s => s.setSelectedTile);
  const [prevSelected, setPrevSelected] = useState<number | null>(null);

  // Init PixiJS board
  useEffect(() => {
    if (!canvasRef.current) return;
    const iso = new IsoBoard({
      onTileClick: (id) => {
        setPrevSelected(selectedTileId);
        setSelectedTileFn(selectedTileId === id ? null : id);
      },
      onTileHover: () => {},
    });
    iso.init(canvasRef.current).then(() => { boardRef.current = iso; });
    return () => { boardRef.current?.destroy(); boardRef.current = null; };
  }, []);

  // Sync board state to PixiJS
  useEffect(() => {
    if (!boardRef.current || board.size === 0) return;
    boardRef.current.updateTiles(board, players);
    boardRef.current.updateTokens(players);
  }, [board, players]);

  // Highlight selected tile
  useEffect(() => {
    boardRef.current?.highlightTile(selectedTileId, prevSelected);
  }, [selectedTileId]);

  // Handle resize
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      boardRef.current?.resize(entry.contentRect.width, entry.contentRect.height);
    });
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="game-screen">
      {/* Board canvas */}
      <div className="board-wrapper" ref={wrapperRef}>
        <canvas ref={canvasRef} className="board-canvas" />
      </div>

      {/* HUD overlay */}
      <div className="game-ui-layer">
        <GameHUD />
        {/* <DiceRoller /> */}
        <EventLog />
      </div>

      {/* Modals */}
      {selectedTileId !== null && (() => {
        const t = board.get(selectedTileId);
        if (!t) return null;
        if (t.tileType === 'property' || t.tileType === 'port') {
          return <PropertyModal tileId={selectedTileId} onClose={() => setSelectedTileFn(null)} />;
        }
        if (t.tileType === 'tax') {
          return <TaxModal onClose={() => setSelectedTileFn(null)} />;
        }
        if (t.tileType === 'airport') {
          return <AirportModal onClose={() => setSelectedTileFn(null)} />;
        }
        if (t.tileType === 'festival') {
          return <FestivalModal onClose={() => setSelectedTileFn(null)} />;
        }
        if (t.tileType === 'jail') {
          return <JailModal onClose={() => setSelectedTileFn(null)} />;
        }
        if (t.tileType === 'chance') {
          return <ChanceModal onClose={() => setSelectedTileFn(null)} />;
        }
        // Fallback for go if we just want to close them instantly
        // or we can just leave them as not rendering a modal.
        // If users click on them, they shouldn't trigger an error, just no modal.
        return null;
      })()}
      <BuyUpgradeModal />
      {gamePhase === 'ended' && winnerId && <WinnerModal />}

      {/* Editor Controls (Uncomment when you need to recalibrate coordinates) */}
      <div className="map-editor-controls" style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999, display: 'flex', gap: '8px' }}>
        <button
          onClick={() => boardRef.current?.toggleEditMode()}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Toggle Map Editor
        </button>
        <button
          onClick={() => boardRef.current?.exportWaypoints()}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Export Waypoints
        </button>
      </div>

    </div>
  );
}

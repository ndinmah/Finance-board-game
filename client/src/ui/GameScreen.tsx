import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { IsoBoard } from '../game/IsoBoard';
import GameHUD from './GameHUD';
import DiceRoller from './DiceRoller';
import PropertyModal from './PropertyModal';
import BuyUpgradeModal from './BuyUpgradeModal';
import EventLog from './EventLog';
import ChatBox from './ChatBox';
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
        <DiceRoller />
        <EventLog />
        <ChatBox />
      </div>

      {/* Modals */}
      {selectedTileId !== null && (
        <PropertyModal tileId={selectedTileId} onClose={() => setSelectedTileFn(null)} />
      )}
      <BuyUpgradeModal />
      {gamePhase === 'ended' && winnerId && <WinnerModal />}

      {/* Editor Controls (Uncomment when you need to recalibrate coordinates) */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999, display: 'flex', gap: '8px' }}>
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

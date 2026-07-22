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
import ChanceCard from './ChanceCard';
import ChanceModal from './ChanceModal';
import BuyUpgradeModal from './BuyUpgradeModal';
import EventLog from './EventLog';
import WinnerModal from './WinnerModal';
import GoModal from './GoModal';
import PlayerPickerModal from './PlayerPickerModal';
import boardBg from '../assets/broad.png';

export default function GameScreen() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const boardRef    = useRef<IsoBoard | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  const board = useGameStore(s => s.board);
  const players = useGameStore(s => s.players);
  const selectedTileId = useGameStore(s => s.selectedTileId);
  const winnerId = useGameStore(s => s.winnerId);
  const gamePhase = useGameStore(s => s.gamePhase);
  const turnPhase = useGameStore(s => s.turnPhase);
  const events = useGameStore(s => s.events);
  const setSelectedTileFn = useGameStore(s => s.setSelectedTile);
  const [prevSelected, setPrevSelected] = useState<number | null>(null);

  // Chance Card Display logic
  const [showChanceCard, setShowChanceCard] = useState(false);
  const [lastChanceEventTime, setLastChanceEventTime] = useState(0);

  useEffect(() => {
    const chanceEvent = [...events].reverse().find(e => e.type === 'chance');
    if (chanceEvent && chanceEvent.timestamp > lastChanceEventTime) {
      setLastChanceEventTime(chanceEvent.timestamp);
      setShowChanceCard(true);
    }
  }, [events, lastChanceEventTime]);

  // Use a ref to store the latest selectedTileId to avoid stale closure in the initial useEffect callback
  const selectedTileIdRef = useRef(selectedTileId);
  useEffect(() => {
    selectedTileIdRef.current = selectedTileId;
  }, [selectedTileId]);

  // Init PixiJS board
  useEffect(() => {
    if (!canvasRef.current) return;
    const iso = new IsoBoard({
      onTileClick: (id) => {
        const currentSelected = selectedTileIdRef.current;
        setPrevSelected(currentSelected);
        // Luôn set thành id thay vì toggle để tránh lỗi click bị bắn 2 lần liên tiếp gây đóng modal lập tức
        setSelectedTileFn(id);
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

  // Handle chance phase highlights
  useEffect(() => {
    if (!boardRef.current) return;
    const iso = boardRef.current;

    const validTiles = new Set<number>();

    if (turnPhase === 'chance_shield_select' || turnPhase === 'chance_give_city_select') {
      board.forEach((tile, id) => {
        if (tile.ownerId === useGameStore.getState().myPlayerId && (tile.tileType === 'property' || tile.tileType === 'port')) {
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'chance_festival_city_select') {
      board.forEach((tile, id) => {
        if (tile.ownerId === useGameStore.getState().myPlayerId && (tile.tileType === 'property' || tile.tileType === 'port')) {
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'chance_attack_select') {
      const state = useGameStore.getState();
      board.forEach((tile, id) => {
        if (tile.ownerId && tile.ownerId !== state.myPlayerId && tile.houseCount < 4) {
          if (state.pendingChanceEffect === 'SABOTAGE' && tile.tileType === 'port') return;
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'airport_select') {
      board.forEach((tile, id) => {
        if ((tile.tileType === 'property' || tile.tileType === 'port') && (!tile.ownerId || tile.ownerId === useGameStore.getState().myPlayerId)) {
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'go_remote_upgrade') {
      const state = useGameStore.getState();
      const me = state.players.get(state.myPlayerId);
      if (me) {
        board.forEach((tile, id) => {
          if (tile.ownerId === me.id && tile.tileType === 'property') {
            const getMaxHouses = (passCount: number, currentHouses: number) => {
              if (passCount === 0) return 2;
              if (currentHouses < 3) return 3;
              return 4;
            };
            const maxHouses = getMaxHouses(me.passCount, tile.houseCount);
            if (tile.houseCount < maxHouses) {
              const nextLevelCost = tile.houseCount === 3 ? tile.hotelCost : tile.buildCost;
              if (me.money >= nextLevelCost) {
                validTiles.add(id);
              }
            }
          }
        });
      }
    }

    if (validTiles.size > 0) {
      iso.highlightValidTiles(validTiles, turnPhase);
    } else {
      iso.clearHighlights();
    }
  }, [turnPhase, board]);

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
    <div className="fixed inset-0 flex overflow-hidden bg-[#1a2744] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${boardBg})` }}>
      {/* Board canvas */}
      <div className="absolute inset-0" ref={wrapperRef}>
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-3 [&>*]:pointer-events-auto">
        <GameHUD />
        <DiceRoller />
        <EventLog />
      </div>

      {/* Modals */}
      <ModalRouter onClose={() => setSelectedTileFn(null)} />
      <BuyUpgradeModal />
      <PlayerPickerModal />
      {showChanceCard && <ChanceCard onClose={() => setShowChanceCard(false)} />}
      {gamePhase === 'ended' && winnerId && <WinnerModal />}

      {/* Editor Controls (Uncomment when you need to recalibrate coordinates) */}
      {/* <div className="hidden md:flex absolute top-2.5 right-2.5 z-[9999] gap-2 pointer-events-auto">
        <button
          onClick={() => boardRef.current?.toggleEditMode()}
          className="bg-red-500 text-white border-none py-2 px-3 rounded cursor-pointer font-bold"
        >
          Toggle Map Editor
        </button>
        <button
          onClick={() => boardRef.current?.exportWaypoints()}
          className="bg-blue-500 text-white border-none py-2 px-3 rounded cursor-pointer font-bold"
        >
          Export Waypoints
        </button>
      </div> */}

    </div>
  );
}

interface ModalRouterProps {
  onClose: () => void;
}

function ModalRouter({ onClose }: ModalRouterProps) {
  const selectedTileId = useGameStore(s => s.selectedTileId);
  const turnPhase = useGameStore(s => s.turnPhase);
  const tile = useGameStore(s => selectedTileId !== null ? s.board.get(selectedTileId) : undefined);

  if (selectedTileId === null || !tile) return null;
  if (turnPhase === 'go_remote_upgrade' && tile.tileType === 'property') return null;

  switch (tile.tileType) {
    case 'property':
    case 'port':
      return <PropertyModal tileId={selectedTileId} onClose={onClose} />;
    case 'tax':
      return <TaxModal onClose={onClose} />;
    case 'airport':
      return <AirportModal onClose={onClose} />;
    case 'festival':
      return <FestivalModal onClose={onClose} />;
    case 'jail':
      return <JailModal onClose={onClose} />;
    case 'go':
      return <GoModal onClose={onClose} />;
    case 'chance':
      return <ChanceModal onClose={onClose} />;
    default:
      return null;
  }
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
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
import boardBg from '../assets/broad.webp';

const DICE_RESULT_HOLD_MS = 1000;

export default function GameScreen() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const boardRef    = useRef<IsoBoard | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const [boardReady, setBoardReady] = useState(false);

  const board = useGameStore(s => s.board);
  const players = useGameStore(s => s.players);
  const selectedTileId = useGameStore(s => s.selectedTileId);
  const winnerId = useGameStore(s => s.winnerId);
  const gamePhase = useGameStore(s => s.gamePhase);
  const turnPhase = useGameStore(s => s.turnPhase);
  const currentPlayerId = useGameStore(s => s.currentPlayerId);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const movementMode = useGameStore(s => s.movementMode);
  const pendingChanceEffect = useGameStore(s => s.pendingChanceEffect);
  const events = useGameStore(s => s.events);
  const setSelectedTileFn = useGameStore(s => s.setSelectedTile);
  const [prevSelected, setPrevSelected] = useState<number | null>(null);
  const [revealedRollCount, setRevealedRollCount] = useState(0);
  const dicePresentationActiveRef = useRef(false);
  const handleRollRevealed = useCallback((rollCount: number) => {
    setRevealedRollCount(rollCount);
  }, []);
  const handleDicePresentationChange = useCallback((active: boolean) => {
    dicePresentationActiveRef.current = active;
  }, []);
  const handleModalClose = useCallback(() => {
    setSelectedTileFn(null);
  }, [setSelectedTileFn]);

  // Chance Card Display logic
  const latestChanceEvent = [...events].reverse().find(event => event.type === 'chance');
  const latestChanceEventTime = latestChanceEvent?.timestamp ?? 0;
  const shouldResumeChancePresentation = Boolean(
    latestChanceEvent
    && latestChanceEvent.playerId === currentPlayerId
    && (
      turnPhase.startsWith('chance_')
      || (turnPhase === 'moving' && latestChanceEvent.cardId.startsWith('GOTO_'))
    )
  );
  const [showChanceCard, setShowChanceCard] = useState(shouldResumeChancePresentation);
  const [lastChanceEventTime, setLastChanceEventTime] = useState(latestChanceEventTime);
  const chancePresentationPending = latestChanceEventTime > lastChanceEventTime;
  const handleChanceCardClose = useCallback(() => setShowChanceCard(false), []);

  useEffect(() => {
    if (latestChanceEventTime > lastChanceEventTime) {
      setLastChanceEventTime(latestChanceEventTime);
      setShowChanceCard(true);
    }
  }, [latestChanceEventTime, lastChanceEventTime]);

  // Use a ref to store the latest selectedTileId to avoid stale closure in the initial useEffect callback
  const selectedTileIdRef = useRef(selectedTileId);
  const turnPhaseRef = useRef(turnPhase);
  const showChanceCardRef = useRef(showChanceCard);
  const settledPlayersRef = useRef(players);
  const mountedDuringMovementRef = useRef(turnPhase === 'moving');
  useEffect(() => {
    selectedTileIdRef.current = selectedTileId;
  }, [selectedTileId]);

  useEffect(() => {
    turnPhaseRef.current = turnPhase;
    showChanceCardRef.current = showChanceCard;
  }, [showChanceCard, turnPhase]);

  const previousTurnContextRef = useRef({ currentPlayerId, turnPhase });
  useEffect(() => {
    const previous = previousTurnContextRef.current;
    const turnContextChanged = previous.currentPlayerId !== currentPlayerId || previous.turnPhase !== turnPhase;
    if (turnContextChanged && currentPlayerId === myPlayerId) {
      setSelectedTileFn(null);
      setPrevSelected(null);
    }
    previousTurnContextRef.current = { currentPlayerId, turnPhase };
  }, [currentPlayerId, myPlayerId, setSelectedTileFn, turnPhase]);

  useEffect(() => {
    if (turnPhase !== 'moving') settledPlayersRef.current = players;
  }, [players, turnPhase]);

  // Init PixiJS board
  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;
    let iso: IsoBoard | null = null;
    const initFrame = requestAnimationFrame(() => {
      if (disposed || !canvasRef.current) return;
      iso = new IsoBoard({
        onTileClick: (id) => {
          const state = useGameStore.getState();
          const isMyTurn = state.currentPlayerId === state.myPlayerId;
          if (isMyTurn && (turnPhaseRef.current === 'moving' || showChanceCardRef.current || dicePresentationActiveRef.current)) return;
          if (isMyTurn && turnPhaseRef.current === 'go_remote_upgrade') {
            const me = state.players.get(state.myPlayerId);
            const tile = state.board.get(id);
            if (!me || !tile || tile.ownerId !== me.id || tile.tileType !== 'property') return;

            const maxHouses = me.passCount === 0 ? 2 : tile.houseCount < 3 ? 3 : 4;
            const nextLevelCost = tile.houseCount === 3 ? tile.hotelCost : tile.buildCost;
            if (tile.houseCount >= maxHouses || me.money < nextLevelCost) return;
          }
          if (isMyTurn && turnPhaseRef.current === 'airport_select') {
            const tile = state.board.get(id);
            const isValidType = tile?.tileType === 'property' || tile?.tileType === 'port';
            if (!tile || !isValidType || (tile.ownerId && tile.ownerId !== state.myPlayerId)) return;
          }
          const currentSelected = selectedTileIdRef.current;
          setPrevSelected(currentSelected);
          // Luôn set thành id thay vì toggle để tránh lỗi click bị bắn 2 lần liên tiếp gây đóng modal lập tức
          setSelectedTileFn(id);
        },
        onTileHover: () => {},
      });
      const instance = iso;
      instance.init(canvasRef.current).then(() => {
        if (disposed) {
          instance.destroy();
          return;
        }
        boardRef.current = instance;
        const state = useGameStore.getState();
        instance.updateTiles(state.board, state.players);
        instance.updateTokens(state.turnPhase === 'moving' ? settledPlayersRef.current : state.players);
        setBoardReady(true);

      });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(initFrame);
      if (boardRef.current === iso) {
        iso?.destroy();
        boardRef.current = null;
      }
    };
  }, [setSelectedTileFn]);

  const diceRollCount = useGameStore(s => s.dice.rollCount);
  const prevRollCountRef = useRef(diceRollCount);
  const playersRef = useRef(players);
  const movementKeyRef = useRef<string | null>(null);
  const movementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Sync board tiles to PixiJS
  useEffect(() => {
    if (!boardRef.current || board.size === 0) return;
    boardRef.current.updateTiles(board, players);
  }, [board, players]);

  // Start each movement once and let Canvas notify the server when it has finished.
  useEffect(() => {
    if (!boardReady || !boardRef.current || players.size === 0) return;

    if (turnPhase === 'moving') {
      if (showChanceCard || chancePresentationPending) return;
      if (mountedDuringMovementRef.current) return;

      const currentPlayerId = useGameStore.getState().currentPlayerId;
      const targetPos = players.get(currentPlayerId)?.position;
      if (targetPos === undefined) return;

      const movementKey = `${currentPlayerId}:${targetPos}:${diceRollCount}:${movementMode}`;
      if (movementKeyRef.current === movementKey) return;

      const followsDiceRoll = diceRollCount > 0 && diceRollCount !== prevRollCountRef.current;
      if (followsDiceRoll && revealedRollCount !== diceRollCount) return;

      movementKeyRef.current = movementKey;
      prevRollCountRef.current = diceRollCount;
      if (movementTimerRef.current) clearTimeout(movementTimerRef.current);

      if (followsDiceRoll) {
        boardRef.current.setTargetDestination(targetPos);
      }

      movementTimerRef.current = setTimeout(() => {
        movementTimerRef.current = null;
        boardRef.current?.updateTokens(playersRef.current, playerId => {
          const targetPosition = playersRef.current.get(playerId)?.position;
          send('animationDone', { playerId, targetPosition });
        }, movementMode);
      }, followsDiceRoll ? DICE_RESULT_HOLD_MS : 0);
      return;
    }

    if (movementTimerRef.current) {
      clearTimeout(movementTimerRef.current);
      movementTimerRef.current = null;
    }
    movementKeyRef.current = null;
    prevRollCountRef.current = diceRollCount;
    boardRef.current.updateTokens(players);
  }, [boardReady, chancePresentationPending, diceRollCount, movementMode, players, revealedRollCount, showChanceCard, turnPhase]);

  useEffect(() => {
    if (
      !boardReady
      || !mountedDuringMovementRef.current
      || turnPhase !== 'moving'
      || showChanceCard
      || chancePresentationPending
    ) return;

    mountedDuringMovementRef.current = false;
    const state = useGameStore.getState();
    const playerId = state.currentPlayerId;
    const targetPosition = state.players.get(playerId)?.position;
    send('animationDone', { playerId, targetPosition });
  }, [boardReady, chancePresentationPending, showChanceCard, turnPhase]);

  useEffect(() => () => {
    if (movementTimerRef.current) clearTimeout(movementTimerRef.current);
  }, []);

  // Highlight selected tile
  useEffect(() => {
    boardRef.current?.highlightTile(selectedTileId, prevSelected);
  }, [boardReady, prevSelected, selectedTileId]);

  // Handle chance phase highlights
  useEffect(() => {
    if (!boardRef.current) return;
    const iso = boardRef.current;

    const validTiles = new Set<number>();
    const activePlayer = players.get(currentPlayerId);

    if (turnPhase === 'chance_shield_select' || turnPhase === 'chance_give_city_select') {
      board.forEach((tile, id) => {
        if (tile.ownerId === currentPlayerId && (tile.tileType === 'property' || tile.tileType === 'port')) {
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'chance_festival_city_select') {
      board.forEach((tile, id) => {
        if (tile.ownerId === currentPlayerId && (tile.tileType === 'property' || tile.tileType === 'port')) {
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'chance_attack_select') {
      board.forEach((tile, id) => {
        if (tile.ownerId && tile.ownerId !== currentPlayerId && tile.houseCount < 4) {
          if (pendingChanceEffect === 'SABOTAGE' && tile.tileType === 'port') return;
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'airport_select') {
      board.forEach((tile, id) => {
        if ((tile.tileType === 'property' || tile.tileType === 'port') && (!tile.ownerId || tile.ownerId === currentPlayerId)) {
          validTiles.add(id);
        }
      });
    } else if (turnPhase === 'festival_select' || turnPhase === 'pay_debt') {
      board.forEach((tile, id) => {
        const isOwnedAsset = tile.ownerId === currentPlayerId && (tile.tileType === 'property' || tile.tileType === 'port');
        if (isOwnedAsset && (turnPhase === 'pay_debt' || (activePlayer?.money ?? 0) >= 50)) validTiles.add(id);
      });
    } else if (turnPhase === 'go_remote_upgrade') {
      if (activePlayer) {
        board.forEach((tile, id) => {
          if (tile.ownerId === activePlayer.id && tile.tileType === 'property') {
            const getMaxHouses = (passCount: number, currentHouses: number) => {
              if (passCount === 0) return 2;
              if (currentHouses < 3) return 3;
              return 4;
            };
            const maxHouses = getMaxHouses(activePlayer.passCount, tile.houseCount);
            if (tile.houseCount < maxHouses) {
              const nextLevelCost = tile.houseCount === 3 ? tile.hotelCost : tile.buildCost;
              if (activePlayer.money >= nextLevelCost) {
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
  }, [boardReady, board, currentPlayerId, pendingChanceEffect, players, turnPhase]);

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
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-3">
        <GameHUD />
        <DiceRoller boardReady={boardReady} onRollRevealed={handleRollRevealed} onPresentationChange={handleDicePresentationChange} />
        <EventLog />
      </div>

      {/* Modals */}
      <ModalRouter onClose={handleModalClose} />
      <BuyUpgradeModal />
      <PlayerPickerModal />
      {showChanceCard && <ChanceCard onClose={handleChanceCardClose} />}
      {gamePhase === 'ended' && winnerId && <WinnerModal />}

      {/* Editor Controls (Uncomment when you need to recalibrate coordinates) */}
      {/* <div className="hidden md:flex absolute top-2.5 right-2.5 z-[9999] gap-2 pointer-events-auto">
        <button
          onClick={() => boardRef.current?.toggleEditMode()}
          className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] bg-red-500 text-white border-none py-2 px-3 rounded cursor-pointer font-bold"
        >
          Toggle Map Editor
        </button>
        <button
          onClick={() => boardRef.current?.exportWaypoints()}
          className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] bg-blue-500 text-white border-none py-2 px-3 rounded cursor-pointer font-bold"
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
  if (turnPhase === 'go_remote_upgrade') return null;

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

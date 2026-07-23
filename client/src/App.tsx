import { useEffect, lazy, Suspense } from 'react';
import { useGameStore } from './store/gameStore';
import LobbyScreen from './ui/LobbyScreen';
import WaitingRoom from './ui/WaitingRoom';
import './App.css';

const GameScreen = lazy(() => import('./ui/GameScreen'));

// Computed once at module load — never changes during session
const IS_DEV = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');

export default function App() {
  const gamePhase = useGameStore(s => s.gamePhase);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const loadDevState = useGameStore(s => s.loadDevState);
  const error = useGameStore(s => s.error);
  const setError = useGameStore(s => s.setError);

  useEffect(() => {
    if (IS_DEV) loadDevState();
  }, [loadDevState]);

  const screen = IS_DEV ? <Suspense fallback={null}><GameScreen /></Suspense> :
    !myPlayerId ? <LobbyScreen /> :
    gamePhase === 'waiting' ? <WaitingRoom /> :
    <Suspense fallback={null}><GameScreen /></Suspense>;

  return (
    <>
      {/* Overlay nhắc xoay máy khi portrait trên mobile */}
      <div className="rotate-prompt">
        <div className="rotate-prompt__icon">📱</div>
        <div className="rotate-prompt__text">Xoay ngang để chơi</div>
        <div className="rotate-prompt__sub">Webopoly được tối ưu cho chế độ nằm ngang</div>
      </div>
      {screen}
      {error && (myPlayerId || IS_DEV) ? (
        <div className="fixed left-1/2 top-3 z-[3000] flex w-[min(92vw,34rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-rose-300/30 bg-rose-950/95 px-4 py-3 text-sm font-semibold text-rose-50 shadow-2xl backdrop-blur-xl" role="alert">
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200" onClick={() => setError(null)} aria-label="Đóng thông báo lỗi">Đóng</button>
        </div>
      ) : null}
    </>
  );
}

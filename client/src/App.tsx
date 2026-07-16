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

  useEffect(() => {
    if (IS_DEV) loadDevState();
  }, []);

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
    </>
  );
}

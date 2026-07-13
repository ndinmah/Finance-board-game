import { useGameStore } from './store/gameStore';
import LobbyScreen from './ui/LobbyScreen';
import WaitingRoom from './ui/WaitingRoom';
import GameScreen  from './ui/GameScreen';
import './App.css';

import { useEffect } from 'react';

export default function App() {
  const { gamePhase, myPlayerId, loadDevState } = useGameStore();

  useEffect(() => {
    const isDev = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');
    if (isDev) {
      loadDevState();
    }
  }, []);

  const isDev = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');

  const screen = isDev ? <GameScreen /> :
    !myPlayerId ? <LobbyScreen /> :
    gamePhase === 'waiting' ? <WaitingRoom /> :
    <GameScreen />;

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

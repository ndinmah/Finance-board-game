import { useGameStore } from './store/gameStore';
import LobbyScreen from './ui/LobbyScreen';
import WaitingRoom from './ui/WaitingRoom';
import GameScreen  from './ui/GameScreen';
import './App.css';

import { useEffect } from 'react';

export default function App() {
  const { gamePhase, myPlayerId, loadDevState } = useGameStore();

  useEffect(() => {
    // Dev route check
    const isDev = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev1');
    if (isDev) {
      loadDevState();
    }
  }, []);

  const isDev = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev1');
  if (isDev) return <GameScreen />;

  // Not joined any room yet
  if (!myPlayerId) return <LobbyScreen />;

  // In a room but game not started
  if (gamePhase === 'waiting') return <WaitingRoom />;

  // Game in progress or ended
  return <GameScreen />;
}

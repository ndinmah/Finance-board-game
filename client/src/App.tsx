
import { useGameStore } from './store/gameStore';
import LobbyScreen from './ui/LobbyScreen';
import WaitingRoom from './ui/WaitingRoom';
import GameScreen  from './ui/GameScreen';
import './App.css';

import { useEffect } from 'react';

export default function App() {
  const { gamePhase, myPlayerId } = useGameStore();

  useEffect(() => {
    // The dev hack is removed. Use "Thêm Bot" in Waiting Room instead to test!
  }, []);

  // Not joined any room yet
  if (!myPlayerId) return <LobbyScreen />;

  // In a room but game not started
  if (gamePhase === 'waiting') return <WaitingRoom />;

  // Game in progress or ended
  return <GameScreen />;
}

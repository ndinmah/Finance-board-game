import React from 'react';
import { useGameStore } from './store/gameStore';
import LobbyScreen from './ui/LobbyScreen';
import WaitingRoom from './ui/WaitingRoom';
import GameScreen  from './ui/GameScreen';
import './App.css';

export default function App() {
  const { gamePhase, players, myPlayerId } = useGameStore();

  // Not joined any room yet
  if (!myPlayerId) return <LobbyScreen />;

  // In a room but game not started
  if (gamePhase === 'waiting') return <WaitingRoom />;

  // Game in progress or ended
  return <GameScreen />;
}

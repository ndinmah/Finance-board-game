import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../utils/format';
import './GameHUD.css';

export default function GameHUD() {
  const { players, currentPlayerId, myPlayerId, turnNumber, turnOrder } = useGameStore();

  const activePlayers = turnOrder
    .map(id => players.get(id))
    .filter(Boolean);

  return (
    <div className="hud-container">
      {/* Turn indicator */}
      <div className="hud-turn-badge">
        <span className="turn-label">Lượt #{turnNumber + 1}</span>
        <span className="turn-player">
          {players.get(currentPlayerId)?.name || '...'}
          {currentPlayerId === myPlayerId ? ' (bạn)' : ''}
        </span>
      </div>

      {/* Player scoreboard */}
      <div className="hud-scoreboard">
        {activePlayers.map(p => {
          if (!p) return null;
          const isActive  = p.id === currentPlayerId;
          const isMe      = p.id === myPlayerId;
          return (
            <div key={p.id} className={`hud-player ${isActive ? 'active' : ''} ${isMe ? 'is-me' : ''} ${p.isBankrupt ? 'bankrupt' : ''}`}>
              <div className="hud-avatar" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
                {p.isInJail && <span className="jail-icon">⛓️</span>}
                {p.isBot && <span className="bot-icon">🤖</span>}
                {!p.isConnected && <span className="dc-icon">📡</span>}
              </div>
              <div className="hud-info">
                <span className="hud-name">{p.name}{isMe ? ' ★' : ''}</span>
                <span className="hud-money">💰 {formatMoney(p.money)}</span>
              </div>
              {isActive && <div className="active-indicator" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useGameStore, type PlayerState } from '../store/gameStore';
import { formatMoney } from '../utils/format';
import PlayerAvatar from './PlayerAvatar';
import { getAccessiblePlayerInk } from './playerVisuals';
import './GameChrome.css';

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="game-hud-wallet-icon">
      <path d="M4 6.5h13.5A2.5 2.5 0 0 1 20 9v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 4.5 4H17v2H4.5a.5.5 0 0 0-.5.5Z" fill="currentColor" />
      <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Zm0 2a.5.5 0 1 0 0 1h4v-1h-4Z" fill="currentColor" />
    </svg>
  );
}

function TurnTimer({ deadline, durationMs }: { deadline: number; durationMs: number }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (deadline <= 0 || durationMs <= 0) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline, durationMs]);

  const remainingMs = Math.max(0, deadline - now);
  const progress = durationMs > 0 ? Math.min(1, remainingMs / durationMs) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div
      className="game-hud-turn-timer"
      role="progressbar"
      aria-label={`Thời gian còn lại của lượt: ${remainingSeconds} giây`}
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={remainingMs}
    >
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

interface PlayerCardProps {
  player: PlayerState;
  isActive: boolean;
  isMe: boolean;
  turnDeadline: number;
  turnDurationMs: number;
}

function PlayerCard({ player, isActive, isMe, turnDeadline, turnDurationMs }: PlayerCardProps) {
  const playerInk = getAccessiblePlayerInk(player.color);
  return (
    <article
      className={`game-hud-player ${isActive ? 'is-active' : ''} ${player.isBankrupt ? 'is-bankrupt' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      style={{
        '--player-color': player.color,
        '--player-ink': playerInk,
        '--player-text-shadow': playerInk === '#ffffff' ? '0 1px 2px rgba(0, 0, 0, 0.42)' : 'none',
      } as CSSProperties}
    >
      {isActive ? <span className="sr-only">{isMe ? 'Đến lượt của bạn' : `Đến lượt ${player.name}`}</span> : null}
      <div className="game-hud-player-copy">
        <div className="game-hud-player-name">
          <p>{player.name}</p>
          {isMe ? <span>Bạn</span> : null}
        </div>
        <div className="game-hud-money">
          <WalletIcon />
          <span>{formatMoney(player.money)}</span>
        </div>
        {isActive && turnDeadline > 0 && turnDurationMs > 0 ? (
          <TurnTimer deadline={turnDeadline} durationMs={turnDurationMs} />
        ) : null}
      </div>
      <div className="game-hud-avatar">
        <PlayerAvatar
          name={player.name}
          color={player.color}
          className="game-hud-avatar-visual"
          imageClassName="game-hud-avatar-img"
          loading="eager"
        />
        <span className={`game-hud-connection ${player.isConnected ? 'is-online' : 'is-offline'}`} aria-label={player.isConnected ? 'Đang kết nối' : 'Mất kết nối'} />
      </div>
      <div className="game-hud-badges">
        {player.isInJail ? <span className="is-jail">Trong tù</span> : null}
        {player.isBot ? <span>Bot</span> : null}
      </div>
    </article>
  );
}

export default function GameHUD() {
  const players = useGameStore(s => s.players);
  const currentPlayerId = useGameStore(s => s.currentPlayerId);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const turnOrder = useGameStore(s => s.turnOrder);
  const turnDeadline = useGameStore(s => s.turnDeadline);
  const turnDurationMs = useGameStore(s => s.turnDurationMs);

  const corners = useMemo(() => {
    const myTurnIndex = turnOrder.indexOf(myPlayerId);
    const clockwiseIds = myTurnIndex >= 0
      ? [...turnOrder.slice(myTurnIndex + 1), ...turnOrder.slice(0, myTurnIndex)]
      : turnOrder.filter(id => id !== myPlayerId);
    const clockwisePlayers = clockwiseIds
      .map(id => players.get(id))
      .filter((player): player is PlayerState => player !== undefined);
    const me = players.get(myPlayerId);

    const all = me ? [me, ...clockwisePlayers] : clockwisePlayers;
    const n = all.length;

    if (n <= 4) {
      return {
        bottomRight: all.slice(0, 1),
        bottomLeft:  all.slice(1, 2),
        topLeft:     all.slice(2, 3),
        topRight:    all.slice(3, 4),
      };
    }

    if (n === 5) {
      return {
        bottomRight: all.slice(0, 1),
        bottomLeft:  all.slice(1, 3),
        topLeft:     all.slice(3, 4),
        topRight:    all.slice(4, 5),
      };
    }

    if (n === 6) {
      return {
        bottomRight: all.slice(0, 1),
        bottomLeft:  all.slice(1, 3),
        topLeft:     all.slice(3, 5),
        topRight:    all.slice(5, 6),
      };
    }

    if (n === 7) {
      return {
        bottomRight: all.slice(0, 1),
        bottomLeft:  all.slice(1, 3),
        topLeft:     all.slice(3, 5),
        topRight:    all.slice(5, 7),
      };
    }

    return {
      bottomRight: [all[0], ...all.slice(7, 8)],
      bottomLeft:  all.slice(1, 3),
      topLeft:     all.slice(3, 5),
      topRight:    all.slice(5, 7),
    };
  }, [myPlayerId, players, turnOrder]);

  const renderCorner = (cornerPlayers: PlayerState[]) => cornerPlayers.map(player => (
    <PlayerCard
      key={player.id}
      player={player}
      isActive={player.id === currentPlayerId}
      isMe={player.id === myPlayerId}
      turnDeadline={turnDeadline}
      turnDurationMs={turnDurationMs}
    />
  ));

  return (
    <header className="game-hud" aria-label="Thông tin ván đấu">
      <section className="game-hud-corner game-hud-corner--bottom-right" aria-label="Bạn và người chơi kế tiếp">
        {renderCorner(corners.bottomRight)}
      </section>
      <section className="game-hud-corner game-hud-corner--bottom-left" aria-label="Người chơi phía dưới bên trái">
        {renderCorner(corners.bottomLeft)}
      </section>
      <section className="game-hud-corner game-hud-corner--top-left" aria-label="Người chơi phía trên bên trái">
        {renderCorner(corners.topLeft)}
      </section>
      <section className="game-hud-corner game-hud-corner--top-right" aria-label="Người chơi phía trên bên phải">
        {renderCorner(corners.topRight)}
      </section>
    </header>
  );
}

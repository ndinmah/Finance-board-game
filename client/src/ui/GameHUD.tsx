import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useGameStore, type PlayerState } from '../store/gameStore';
import PlayerAvatar from './PlayerAvatar';
import { getAccessiblePlayerInk } from './playerVisuals';

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
      className="game-hud-turn-timer [height:0.24rem] [margin:0_0.48rem_0.36rem] [overflow:hidden] [border-radius:999px] [background:#e8edf0] [&_>_span]:[width:100%] [&_>_span]:[height:100%] [&_>_span]:[display:block] [&_>_span]:[border-radius:inherit] [&_>_span]:[background:linear-gradient(90deg,_#f5c518,_#ffe781)] [&_>_span]:[box-shadow:0_0_0.45rem_rgba(245,_197,_24,_0.72)] [&_>_span]:[transform-origin:left_center] [&_>_span]:[transition:transform_250ms_linear]"
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
      className={`game-hud-player [position:relative] [isolation:isolate] [width:clamp(11.5rem,_17vw,_13.8rem)] [min-width:0] [height:4.5rem] [flex:0_0_auto] [display:grid] [grid-template-columns:minmax(0,_1fr)_4.4rem] [overflow:hidden] [border:2.5px_solid_var(--player-color,_var(--game-chrome-primary))] [border-radius:0.68rem] [background:#ffffff] [box-shadow:0_0.45rem_1.3rem_rgba(1,_15,_24,_0.32)] [transition:opacity_180ms_ease,_transform_180ms_ease,_box-shadow_180ms_ease] [&.is-active]:[transform:translateY(-2px)] [&.is-active]:[box-shadow:0_0.7rem_1.8rem_rgba(1,_15,_24,_0.4),_0_0_0_2px_rgba(255,_220,_93,_0.92),_0_0_1rem_rgba(255,_220,_93,_0.4)] [&.is-bankrupt]:[opacity:0.48] [&.is-bankrupt]:[filter:grayscale(0.85)] max-[768px]:[width:clamp(8.5rem,_13vw,_10.2rem)] max-[768px]:[grid-template-columns:minmax(0,_1fr)_3.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[width:clamp(8.8rem,_14vw,_10.5rem)] [@media(max-height:480px)_and_(orientation:landscape)]:[height:4.5rem] [@media(max-height:480px)_and_(orientation:landscape)]:[grid-template-columns:minmax(0,_1fr)_4rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.85rem] motion-reduce:[&.is-active::before]:[animation:none] motion-reduce:[transition:none] ${isActive ? 'is-active' : ''} ${player.isBankrupt ? 'is-bankrupt' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      style={{
        '--player-color': player.color,
        '--player-ink': playerInk,
        '--player-text-shadow': playerInk === '#ffffff' ? '0 1px 2px rgba(0, 0, 0, 0.42)' : 'none',
      } as CSSProperties}
    >
      {isActive ? <span className="sr-only">{isMe ? 'Đến lượt của bạn' : `Đến lượt ${player.name}`}</span> : null}
      <div className="game-hud-player-copy [min-width:0] [height:100%] [display:flex] [flex-direction:column]">
        <div className="game-hud-player-name [min-width:0] [display:flex] [align-items:center] [justify-content:center] [gap:0.3rem] [min-height:2rem] [padding:0.34rem_0.55rem] [background:linear-gradient(rgba(0,_0,_0,_0.05),_rgba(0,_0,_0,_0.05)),_var(--player-color,_var(--game-chrome-primary))] [&_p]:[min-width:0] [&_p]:[overflow:hidden] [&_p]:[color:var(--player-ink,_#ffffff)] [&_p]:[font-size:0.88rem] [&_p]:[font-weight:950] [&_p]:[letter-spacing:0.035em] [&_p]:[text-align:center] [&_p]:[text-shadow:var(--player-text-shadow,_0_1px_2px_rgba(0,_0,_0,_0.42))] [&_p]:[text-transform:uppercase] [&_p]:[text-overflow:ellipsis] [&_p]:[white-space:nowrap] [&_span]:[flex:0_0_auto] [&_span]:[padding:0.15rem_0.36rem] [&_span]:[border-radius:0.3rem] [&_span]:[background:color-mix(in_srgb,_var(--player-ink,_#ffffff),_transparent_82%)] [&_span]:[color:var(--player-ink,_#ffffff)] [&_span]:[font-size:0.62rem] [&_span]:[font-weight:900] [&_span]:[text-transform:uppercase] max-[768px]:[padding:0.28rem_0.4rem] max-[768px]:[gap:0.2rem] max-[768px]:[&_p]:[font-size:0.78rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.28rem_0.4rem] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.2rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_p]:[font-size:0.78rem]">
          <p>{player.name}</p>
        </div>
        <div className="game-hud-money [display:flex] [min-height:2.25rem] [flex:1] [align-items:center] [justify-content:center] [gap:0.25rem] [color:#18272f] [font-size:1rem] [font-weight:900] [font-variant-numeric:tabular-nums] max-[768px]:[font-size:0.9rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.9rem]">
          <span>{player.money} K</span>
        </div>
        {isActive && turnDeadline > 0 && turnDurationMs > 0 ? (
          <TurnTimer deadline={turnDeadline} durationMs={turnDurationMs} />
        ) : null}
      </div>
      <div className="game-hud-avatar [position:relative] [width:100%] [height:100%] [overflow:hidden] [border-left:3px_solid_var(--player-color,_var(--game-chrome-primary))] [background:var(--player-color,_#06141d)] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:1.2rem]">
        <PlayerAvatar
          name={player.name}
          color={player.color}
          className="game-hud-avatar-visual [width:100%] [height:100%] [border-radius:0]"
          imageClassName="game-hud-avatar-img [width:100%] [height:100%] [object-fit:cover] [display:block]"
          loading="eager"
        />
        <span className={`game-hud-connection [position:absolute] [right:0.25rem] [bottom:0.25rem] [z-index:2] [width:0.68rem] [height:0.68rem] [border:2px_solid_#06141d] [border-radius:999px] [&.is-online]:[background:var(--color-status-success)] [&.is-offline]:[background:var(--color-status-danger)] ${player.isConnected ? 'is-online' : 'is-offline'}`} aria-label={player.isConnected ? 'Đang kết nối' : 'Mất kết nối'} />
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
    <header className="game-hud [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [inset:0] [z-index:20] [color:var(--game-chrome-text)] [pointer-events:none]" aria-label="Thông tin ván đấu">
      <section className="game-hud-corner [position:absolute] [display:flex] [align-items:stretch] [gap:0.55rem] [pointer-events:auto] game-hud-corner--bottom-right [right:max(0.65rem,_env(safe-area-inset-right))] [bottom:max(0.65rem,_env(safe-area-inset-bottom))] [flex-direction:row-reverse]" aria-label="Bạn và người chơi kế tiếp">
        {renderCorner(corners.bottomRight)}
      </section>
      <section className="game-hud-corner [position:absolute] [display:flex] [align-items:stretch] [gap:0.55rem] [pointer-events:auto] game-hud-corner--bottom-left [bottom:max(0.65rem,_env(safe-area-inset-bottom))] [left:max(0.65rem,_env(safe-area-inset-left))] [flex-direction:row-reverse]" aria-label="Người chơi phía dưới bên trái">
        {renderCorner(corners.bottomLeft)}
      </section>
      <section className="game-hud-corner [position:absolute] [display:flex] [align-items:stretch] [gap:0.55rem] [pointer-events:auto] game-hud-corner--top-left [top:max(0.65rem,_env(safe-area-inset-top))] [left:max(0.65rem,_env(safe-area-inset-left))]" aria-label="Người chơi phía trên bên trái">
        {renderCorner(corners.topLeft)}
      </section>
      <section className="game-hud-corner [position:absolute] [display:flex] [align-items:stretch] [gap:0.55rem] [pointer-events:auto] game-hud-corner--top-right [top:max(0.65rem,_env(safe-area-inset-top))] [right:max(0.65rem,_env(safe-area-inset-right))]" aria-label="Người chơi phía trên bên phải">
        {renderCorner(corners.topRight)}
      </section>
    </header>
  );
}

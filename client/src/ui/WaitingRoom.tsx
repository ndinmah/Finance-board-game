import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send, getCurrentRoomCode, leaveRoom } from '../net/colyseusClient';
import PlayerAvatar from './PlayerAvatar';

const MAX_PLAYERS = 8;

function DiceLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="5" y="5" width="38" height="38" rx="12" />
      <circle cx="16" cy="16" r="3" />
      <circle cx="32" cy="16" r="3" />
      <circle cx="24" cy="24" r="3" />
      <circle cx="16" cy="32" r="3" />
      <circle cx="32" cy="32" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="7" width="16" height="12" rx="4" />
      <path d="M12 7V4M9 4h6M8 13h.01M16 13h.01M9 17h6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
    </svg>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('copy failed');
}

export default function WaitingRoom() {
  const players = useGameStore(s => s.players);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const me = players.get(myPlayerId);
  const roomCode = getCurrentRoomCode();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (!me?.isReady) return;
    void import('./GameScreen');
  }, [me?.isReady]);

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timer = window.setTimeout(() => setCopyStatus('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const handleCopy = async () => {
    if (!roomCode) return;
    try {
      await copyText(roomCode);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const playerList = Array.from(players.values());
  const slots = Array.from({ length: MAX_PLAYERS }, (_, index) => playerList[index]);
  const allReady = playerList.length >= 2 && playerList.every(player => player.isReady);
  const readyCount = playerList.filter(player => player.isReady).length;

  return (
    <main className="lobby-flow-page [--lobby-primary:var(--color-brand-primary)] [--lobby-primary-soft:var(--color-brand-primary-soft)] [--lobby-primary-deep:var(--color-brand-primary-deep)] [--lobby-surface:var(--color-surface-raised)] [--lobby-surface-strong:var(--color-surface-canvas)] [position:fixed] [inset:0] [z-index:0] [display:grid] [place-items:center] [overflow:auto] [overscroll-behavior:contain] [padding:max(1rem,_env(safe-area-inset-top))_max(1rem,_env(safe-area-inset-right))_max(1rem,_env(safe-area-inset-bottom))_max(1rem,_env(safe-area-inset-left))] [background:radial-gradient(circle_at_14%_20%,_rgba(75,_213,_255,_0.2),_transparent_28rem),_radial-gradient(circle_at_88%_82%,_rgba(75,_213,_255,_0.11),_transparent_26rem),_linear-gradient(145deg,_var(--color-surface-canvas)_0%,_#082b3c_52%,_#041720_100%)] [isolation:isolate] before:[position:absolute] before:[inset:0] before:[z-index:-2] before:[content:''] before:[opacity:0.22] before:[background-image:linear-gradient(rgba(255,_255,_255,_0.04)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,_255,_255,_0.04)_1px,_transparent_1px)] before:[background-size:3.2rem_3.2rem] before:[mask-image:linear-gradient(to_bottom,_black,_transparent_90%)] after:[position:absolute] after:[width:min(34rem,_70vw)] after:[aspect-ratio:1] after:[top:-24rem] after:[right:-8rem] after:[z-index:-1] after:[border:1px_solid_rgba(75,_213,_255,_0.24)] after:[border-radius:50%] after:[content:''] after:[box-shadow:0_0_0_4rem_rgba(75,_213,_255,_0.028),_0_0_0_8rem_rgba(75,_213,_255,_0.018)] max-[760px]:portrait:[display:block] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:max(0.65rem,_env(safe-area-inset-top))_max(1.25rem,_env(safe-area-inset-right))_max(0.65rem,_env(safe-area-inset-bottom))_max(1.25rem,_env(safe-area-inset-left))]">
      <div className="lobby-flow-shell [width:min(70rem,_100%)] [min-height:min(42rem,_calc(100dvh_-_2rem))] [display:grid] [overflow:hidden] [border:1px_solid_rgba(75,_213,_255,_0.2)] [border-radius:2rem] [background:rgba(4,_24,_35,_0.86)] [box-shadow:0_2rem_6rem_rgba(0,_0,_0,_0.52),_inset_0_1px_rgba(255,_255,_255,_0.05)] [backdrop-filter:blur(1.4rem)] animate-lobby-shell-enter max-[760px]:portrait:[min-height:100%] max-[760px]:portrait:[grid-template-columns:1fr] [@media(max-height:480px)_and_(orientation:landscape)]:[width:min(60rem,_100%)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:0] [@media(max-height:480px)_and_(orientation:landscape)]:[height:calc(100dvh_-_1.3rem)] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:1.35rem] motion-reduce:[animation:none] lobby-flow-shell--waiting [grid-template-columns:minmax(20rem,_0.72fr)_minmax(0,_1.28fr)] max-[760px]:portrait:[grid-template-columns:1fr] [@media(max-height:480px)_and_(orientation:landscape)]:[grid-template-columns:minmax(18rem,_0.7fr)_minmax(0,_1.3fr)]">
        <section className="waiting-summary-panel [display:flex] [flex-direction:column] [gap:1.5rem] [padding:clamp(1.8rem,_4vw,_3.25rem)] [background:linear-gradient(155deg,_rgba(12,_112,_144,_0.97),_rgba(5,_45,_65,_0.99))] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:1.4rem_1.6rem] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.8rem]" aria-labelledby="waiting-title">
          <div className="waiting-brand [position:relative] [z-index:1] [display:flex] [align-items:center] [gap:0.9rem] [&_>_div]:[display:flex] [&_>_div]:[flex-direction:column] [&_span]:[color:#abd9e5] [&_span]:[font-size:0.68rem] [&_span]:[font-weight:800] [&_span]:[letter-spacing:0.1em] [&_span]:[text-transform:uppercase] [&_strong]:[color:#ffffff] [&_strong]:[font-family:'Nunito',_sans-serif] [&_strong]:[font-size:1.45rem] [&_strong]:[font-weight:900] [&_strong]:[line-height:1.1]">
            <span className="lobby-logo [width:3.4rem] [height:3.4rem] [display:grid] [flex:none] [place-items:center] [border:1px_solid_rgba(255,_255,_255,_0.36)] [border-radius:1.1rem] [color:#06344a] [background:linear-gradient(145deg,_#d8f7ff,_var(--lobby-primary))] [box-shadow:0_0.8rem_2rem_rgba(75,_213,_255,_0.24)] [&_svg]:[width:2.2rem] [&_svg]:[fill:currentColor] [&_svg_rect]:[fill:none] [&_svg_rect]:[stroke:currentColor] [&_svg_rect]:[stroke-width:2.5] [@media(max-height:480px)_and_(orientation:landscape)]:[width:2.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[height:2.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.85rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_svg]:[width:1.75rem] lobby-logo--small [width:2.8rem] [height:2.8rem] [border-radius:0.9rem] [&_svg]:[width:1.8rem]"><DiceLogo /></span>
            <div><span>Webopoly</span><strong id="waiting-title">Phòng chờ</strong></div>
          </div>

          <div className="waiting-code-card [padding:1.3rem] [border:1px_solid_rgba(75,_213,_255,_0.3)] [border-radius:1.1rem] [background:rgba(3,_26,_39,_0.48)] [box-shadow:inset_0_1px_rgba(255,_255,_255,_0.04)] [&_>_span]:[display:block] [&_>_span]:[color:#abd9e5] [&_>_span]:[font-size:0.65rem] [&_>_span]:[font-weight:800] [&_>_span]:[letter-spacing:0.1em] [&_>_span]:[text-transform:uppercase] [&_strong]:[display:block] [&_strong]:[margin:0.25rem_0] [&_strong]:[color:#d8f7ff] [&_strong]:[font-family:'Nunito',_sans-serif] [&_strong]:[font-size:clamp(2rem,_4vw,_3rem)] [&_strong]:[font-variant-numeric:tabular-nums] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.16em] [&_strong]:[line-height:1.1] [&_p]:[color:#91bdc8] [&_p]:[font-size:0.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.8rem_1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_strong]:[font-size:2rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_p]:[display:none]">
            <span>Mã mời bạn bè</span>
            <div className="waiting-code-row [display:flex] [align-items:center] [gap:0.8rem] [&_strong]:[min-width:0] [&_strong]:[flex:1]">
              <strong id="debug-room-id">{roomCode || '------'}</strong>
              <button
                type="button"
                className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed waiting-copy-button [min-width:44px] [min-height:44px] [display:inline-flex] [flex:none] [align-items:center] [justify-content:center] [gap:0.42rem] [border:1px_solid_rgba(75,_213,_255,_0.34)] [border-radius:0.75rem] [padding:0.55rem_0.7rem] [color:#d8f7ff] [background:rgba(75,_213,_255,_0.1)] [font-size:0.68rem] [font-weight:900] [cursor:pointer] [transition:border-color_180ms_ease,_background-color_180ms_ease,_transform_150ms_ease] [&_svg]:[width:1.05rem] [&_svg]:[height:1.05rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [&:hover:not(:disabled)]:[border-color:var(--lobby-primary)] [&:hover:not(:disabled)]:[background:rgba(75,_213,_255,_0.18)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.97)]"
                onClick={() => void handleCopy()}
                disabled={!roomCode}
                aria-label="Sao chép mã phòng"
              >
                <CopyIcon />
                <span>{copyStatus === 'copied' ? 'Đã chép' : copyStatus === 'failed' ? 'Không thể chép' : 'Sao chép'}</span>
              </button>
            </div>
            <p aria-live="polite">
              {copyStatus === 'copied'
                ? 'Mã phòng đã được sao chép.'
                : copyStatus === 'failed'
                  ? 'Không thể tự sao chép. Hãy chọn mã phòng và sao chép thủ công.'
                  : 'Chia sẻ 6 số này để cùng vào bàn.'}
            </p>
          </div>

          <div className="waiting-progress [&_p]:[color:#91bdc8] [&_p]:[font-size:0.7rem] [&_>_div:first-child]:[display:flex] [&_>_div:first-child]:[align-items:center] [&_>_div:first-child]:[justify-content:space-between] [&_>_div:first-child]:[color:#d4f1f8] [&_>_div:first-child]:[font-size:0.72rem] [&_>_div:first-child]:[font-weight:800]">
            <div><span>Người chơi</span><strong>{playerList.length}/{MAX_PLAYERS}</strong></div>
            <div className="waiting-progress-track [height:0.45rem] [margin:0.55rem_0] [overflow:hidden] [border-radius:999px] [background:rgba(3,_22,_33,_0.64)] [&_span]:[display:block] [&_span]:[height:100%] [&_span]:[border-radius:inherit] [&_span]:[background:linear-gradient(90deg,_var(--lobby-primary-deep),_var(--lobby-primary))] [&_span]:[transition:width_280ms_cubic-bezier(0.16,_1,_0.3,_1)] motion-reduce:[&_span]:[transition:none]"><span style={{ width: `${(playerList.length / MAX_PLAYERS) * 100}%` }} /></div>
            <p>{readyCount}/{playerList.length} người đã sẵn sàng</p>
          </div>

          <div className="waiting-actions [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:0.75rem] [margin-top:auto]">
            {!me?.isReady ? (
              <button id="btn-ready" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-primary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [color:#052332] [background:linear-gradient(145deg,_var(--color-brand-primary-soft),_var(--lobby-primary))] [box-shadow:0_0.7rem_1.6rem_rgba(75,_213,_255,_0.2)] [&:hover:not(:disabled)]:[filter:brightness(1.06)] [&:hover:not(:disabled)]:[box-shadow:0_0.8rem_2rem_rgba(75,_213,_255,_0.3)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none]" type="button" onClick={() => send('ready')}>
                <CheckIcon /><span>Sẵn sàng</span>
              </button>
            ) : (
              <button id="btn-unready" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-secondary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [border:1px_solid_rgba(75,_213,_255,_0.25)] [color:#d8f7ff] [background:rgba(255,_255,_255,_0.045)] [&:hover:not(:disabled)]:[border-color:rgba(75,_213,_255,_0.52)] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.075)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none] waiting-cancel-ready [border-color:rgba(255,_220,_93,_0.34)] [color:#fff1b8] [background:rgba(255,_220,_93,_0.08)]" type="button" onClick={() => send('ready')}>
                <CheckIcon /><span>Hủy sẵn sàng</span>
              </button>
            )}
            {playerList.length < MAX_PLAYERS ? (
              <button className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-secondary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [border:1px_solid_rgba(75,_213,_255,_0.25)] [color:#d8f7ff] [background:rgba(255,_255,_255,_0.045)] [&:hover:not(:disabled)]:[border-color:rgba(75,_213,_255,_0.52)] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.075)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none]" type="button" onClick={() => send('addBot')}>
                <BotIcon /><span>Thêm bot</span>
              </button>
            ) : null}
            <button id="btn-leave-room" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-secondary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [border:1px_solid_rgba(75,_213,_255,_0.25)] [color:#d8f7ff] [background:rgba(255,_255,_255,_0.045)] [&:hover:not(:disabled)]:[border-color:rgba(75,_213,_255,_0.52)] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.075)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none] waiting-leave-button [grid-column:1_/_-1] [border-color:rgba(251,_113,_133,_0.32)] [color:#ffe4e6] [background:rgba(251,_113,_133,_0.08)] [&:hover:not(:disabled)]:[border-color:rgba(251,_113,_133,_0.62)] [&:hover:not(:disabled)]:[background:rgba(251,_113,_133,_0.14)]" type="button" onClick={leaveRoom}>
              <LeaveIcon /><span>Rời phòng</span>
            </button>
          </div>
        </section>

        <section className="waiting-roster-panel [min-width:0] [display:flex] [flex-direction:column] [padding:clamp(1.8rem,_4vw,_3.25rem)] [background:rgba(3,_18,_28,_0.91)] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:1.4rem_1.6rem]" aria-labelledby="roster-title">
          <div className="waiting-roster-heading [&_h2]:[color:#f7fffb] [&_h2]:[font-family:'Nunito',_sans-serif] [&_h2]:[font-size:1.72rem] [&_h2]:[font-weight:900] [&_h2]:[line-height:1.12] [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [margin-bottom:1.35rem] [&_>_div_>_span]:[color:#78a7b3] [&_>_div_>_span]:[font-size:0.65rem] [&_>_div_>_span]:[font-weight:800] [&_>_div_>_span]:[letter-spacing:0.12em] [&_>_div_>_span]:[text-transform:uppercase] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:0.8rem]">
            <div>
              <span>Đội hình hiện tại</span>
              <h2 id="roster-title">Người chơi</h2>
            </div>
            <span className={allReady ? 'waiting-live [display:inline-flex] [align-items:center] [gap:0.45rem] [border:1px_solid_rgba(245,_197,_24,_0.2)] [border-radius:999px] [padding:0.45rem_0.7rem] [color:#e9d78b] [background:rgba(245,_197,_24,_0.06)] [font-size:0.66rem] [font-weight:800] [white-space:nowrap] [&_i]:[width:0.42rem] [&_i]:[height:0.42rem] [&_i]:[border-radius:50%] [&_i]:[background:#f5c518] [&_i]:[box-shadow:0_0_0.55rem_rgba(245,_197,_24,_0.72)] waiting-live--ready [border-color:rgba(72,_199,_142,_0.26)] [color:#b9f6d8] [background:rgba(72,_199,_142,_0.08)] [&_i]:[background:#48c78e] [&_i]:[box-shadow:0_0_0.55rem_rgba(72,_199,_142,_0.7)]' : 'waiting-live [display:inline-flex] [align-items:center] [gap:0.45rem] [border:1px_solid_rgba(245,_197,_24,_0.2)] [border-radius:999px] [padding:0.45rem_0.7rem] [color:#e9d78b] [background:rgba(245,_197,_24,_0.06)] [font-size:0.66rem] [font-weight:800] [white-space:nowrap] [&_i]:[width:0.42rem] [&_i]:[height:0.42rem] [&_i]:[border-radius:50%] [&_i]:[background:#f5c518] [&_i]:[box-shadow:0_0_0.55rem_rgba(245,_197,_24,_0.72)]'}>
              <i aria-hidden="true" /> {allReady ? 'Sắp bắt đầu' : 'Đang chờ'}
            </span>
          </div>

          <div className="waiting-player-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:0.75rem] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.55rem]">
            {slots.map((player, index) => player ? (
              <article className={player.id === myPlayerId ? 'waiting-player [min-width:0] [min-height:4.45rem] [display:flex] [align-items:center] [gap:0.75rem] [padding:0.72rem] [border:1px_solid_rgba(75,_213,_255,_0.14)] [border-radius:1rem] [background:rgba(255,_255,_255,_0.035)] [transition:border-color_180ms_ease,_background-color_180ms_ease,_transform_180ms_ease] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:3.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.52rem_0.65rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.75rem] motion-reduce:[transition:none] waiting-player--me [border-color:rgba(75,_213,_255,_0.48)] [background:linear-gradient(135deg,_rgba(75,_213,_255,_0.13),_rgba(255,_255,_255,_0.035))]' : 'waiting-player [min-width:0] [min-height:4.45rem] [display:flex] [align-items:center] [gap:0.75rem] [padding:0.72rem] [border:1px_solid_rgba(75,_213,_255,_0.14)] [border-radius:1rem] [background:rgba(255,_255,_255,_0.035)] [transition:border-color_180ms_ease,_background-color_180ms_ease,_transform_180ms_ease] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:3.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.52rem_0.65rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.75rem] motion-reduce:[transition:none]'} key={player.id}>
                <PlayerAvatar name={player.name} color={player.color} className="waiting-avatar [width:2.65rem] [height:2.65rem] [display:grid] [flex:none] [place-items:center] [border:1px_solid_color-mix(in_srgb,_var(--avatar-color,_#8ca69d),_white_22%)] [border-radius:0.82rem] [color:var(--avatar-ink,_#071a23)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.2),_transparent),_var(--avatar-color,_#506b62)] [font-family:'Nunito',_sans-serif] [font-size:1rem] [font-weight:900] [@media(max-height:480px)_and_(orientation:landscape)]:[width:2.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[height:2.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.68rem]" />
                <div className="waiting-player-name [min-width:0] [display:flex] [flex:1] [flex-direction:column] [&_strong]:[overflow:hidden] [&_strong]:[color:#edfaff] [&_strong]:[font-size:0.8rem] [&_strong]:[font-weight:800] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_span]:[color:#749da8] [&_span]:[font-size:0.63rem]">
                  <strong>{player.name}</strong>
                  <span>{player.id === myPlayerId ? 'Bạn' : player.isBot ? 'Máy' : `Người chơi ${index + 1}`}</span>
                </div>
                <span className={player.isReady ? 'waiting-player-state [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [&_i]:[width:0.42rem] [&_i]:[height:0.42rem] [&_i]:[border-radius:50%] [&_i]:[background:#f5c518] [&_i]:[box-shadow:0_0_0.55rem_rgba(245,_197,_24,_0.72)] [display:inline-flex] [align-items:center] [gap:0.3rem] [color:#a68f43] [font-size:0.6rem] [font-weight:800] [white-space:nowrap] [&_svg]:[width:0.95rem] [&_svg]:[height:0.95rem] waiting-player-state--ready [color:var(--lobby-primary)]' : 'waiting-player-state [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [&_i]:[width:0.42rem] [&_i]:[height:0.42rem] [&_i]:[border-radius:50%] [&_i]:[background:#f5c518] [&_i]:[box-shadow:0_0_0.55rem_rgba(245,_197,_24,_0.72)] [display:inline-flex] [align-items:center] [gap:0.3rem] [color:#a68f43] [font-size:0.6rem] [font-weight:800] [white-space:nowrap] [&_svg]:[width:0.95rem] [&_svg]:[height:0.95rem]'}>
                  {player.isReady ? <CheckIcon /> : <i aria-hidden="true" />}
                  <span>{player.isReady ? 'Sẵn sàng' : 'Đang đợi'}</span>
                </span>
              </article>
            ) : (
              <article className="waiting-player [min-width:0] [min-height:4.45rem] [display:flex] [align-items:center] [gap:0.75rem] [padding:0.72rem] [border:1px_solid_rgba(75,_213,_255,_0.14)] [border-radius:1rem] [background:rgba(255,_255,_255,_0.035)] [transition:border-color_180ms_ease,_background-color_180ms_ease,_transform_180ms_ease] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:3.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.52rem_0.65rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.75rem] motion-reduce:[transition:none] waiting-player--empty [border-style:dashed] [opacity:0.48]" key={`empty-${index}`}>
                <span className="waiting-avatar [width:2.65rem] [height:2.65rem] [display:grid] [flex:none] [place-items:center] [border:1px_solid_color-mix(in_srgb,_var(--avatar-color,_#8ca69d),_white_22%)] [border-radius:0.82rem] [color:var(--avatar-ink,_#071a23)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.2),_transparent),_var(--avatar-color,_#506b62)] [font-family:'Nunito',_sans-serif] [font-size:1rem] [font-weight:900] [@media(max-height:480px)_and_(orientation:landscape)]:[width:2.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[height:2.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.68rem]">+</span>
                <div className="waiting-player-name [min-width:0] [display:flex] [flex:1] [flex-direction:column] [&_strong]:[overflow:hidden] [&_strong]:[color:#edfaff] [&_strong]:[font-size:0.8rem] [&_strong]:[font-weight:800] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_span]:[color:#749da8] [&_span]:[font-size:0.63rem]"><strong>Chỗ trống</strong><span>Đang chờ tham gia</span></div>
              </article>
            ))}
          </div>

          <p className={allReady ? 'waiting-footer-status [&_>_span]:[width:0.42rem] [&_>_span]:[height:0.42rem] [&_>_span]:[border-radius:50%] [&_>_span]:[background:var(--lobby-primary)] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(75,_213,_255,_0.8)] [display:flex] [align-items:center] [justify-content:center] [gap:0.55rem] [margin-top:auto] [padding-top:1.2rem] [color:#789fa9] [font-size:0.68rem] [text-align:center] [&_>_span]:[background:#f5c518] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(245,_197,_24,_0.65)] [@media(max-height:480px)_and_(orientation:landscape)]:[padding-top:0.7rem] waiting-footer-status--ready [color:#b7e6f1] [&_>_span]:[background:var(--lobby-primary)] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(75,_213,_255,_0.8)]' : 'waiting-footer-status [&_>_span]:[width:0.42rem] [&_>_span]:[height:0.42rem] [&_>_span]:[border-radius:50%] [&_>_span]:[background:var(--lobby-primary)] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(75,_213,_255,_0.8)] [display:flex] [align-items:center] [justify-content:center] [gap:0.55rem] [margin-top:auto] [padding-top:1.2rem] [color:#789fa9] [font-size:0.68rem] [text-align:center] [&_>_span]:[background:#f5c518] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(245,_197,_24,_0.65)] [@media(max-height:480px)_and_(orientation:landscape)]:[padding-top:0.7rem]'}>
            <span aria-hidden="true" />
            {allReady ? 'Đủ người và tất cả đã sẵn sàng. Ván đấu đang bắt đầu…' : 'Cần ít nhất 2 người và tất cả cùng sẵn sàng.'}
          </p>
        </section>
      </div>
    </main>
  );
}

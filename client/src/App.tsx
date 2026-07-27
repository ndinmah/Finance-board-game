import { useEffect, lazy, Suspense, useState } from 'react';
import { useGameStore } from './store/gameStore';
import {
  canReconnectPreviousSession,
  hasReconnectSession,
  leaveRoom,
  reconnectPreviousSession,
} from './net/colyseusClient';
import LobbyScreen from './ui/LobbyScreen';
import WaitingRoom from './ui/WaitingRoom';

const GameScreen = lazy(() => import('./ui/GameScreen'));

// Computed once at module load — never changes during session
const IS_DEV = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');

type RecoveryStatus = 'idle' | 'restoring' | 'failed';

interface RecoveryScreenProps {
  status: Exclude<RecoveryStatus, 'idle'>;
  message: string | null;
  onRetry: () => void;
  onLeave: () => void;
}

interface LoadingFallbackProps {
  onReload: () => void;
  onLeave?: () => void;
}

function LoadingFallback({ onReload, onLeave }: LoadingFallbackProps) {
  return (
    <main className="app-state-screen [position:fixed] [inset:0] [z-index:var(--layer-app-state)] [display:grid] [place-items:center] [overflow:auto] [padding:max(1.25rem,_env(safe-area-inset-top))_max(1.25rem,_env(safe-area-inset-right))_max(1.25rem,_env(safe-area-inset-bottom))_max(1.25rem,_env(safe-area-inset-left))] [color:var(--color-text-primary)] [text-align:center] [background:radial-gradient(circle_at_50%_20%,_rgba(75,_213,_255,_0.16),_transparent_24rem),_var(--color-surface-canvas)]">
      <section className="app-state-card [width:min(28rem,_100%)] [padding:clamp(1.5rem,_5vw,_2rem)] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-panel)] [background:color-mix(in_srgb,_var(--color-surface-raised)_95%,_transparent)] [box-shadow:var(--shadow-panel)] [&_h1]:[font-family:'Nunito',_sans-serif] [&_h1]:[font-size:clamp(1.45rem,_4vw,_1.75rem)] [&_h1]:[font-weight:900] [&_h1]:[line-height:1.2] [&_p]:[margin-top:0.75rem] [&_p]:[color:var(--color-text-secondary)] [&_p]:[font-size:0.92rem] [&_p]:[line-height:1.6]" aria-labelledby="loading-title">
        <div className="app-state-spinner [width:3rem] [height:3rem] [margin:0_auto_1.25rem] [border:4px_solid_color-mix(in_srgb,_var(--color-brand-primary)_20%,_transparent)] [border-top-color:var(--color-brand-primary)] [border-radius:50%] animate-app-spin [&.is-paused]:[animation:none] motion-reduce:[animation:none]" aria-hidden="true" />
        <div role="status" aria-live="polite">
          <h1 id="loading-title">Đang tải bàn chơi</h1>
          <p>Nếu quá trình này kéo dài, bạn có thể tải lại để khôi phục phiên hiện tại.</p>
        </div>
        <div className="app-state-actions [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:0.75rem] [margin-top:1.5rem] [&_>_:only-child]:[grid-column:1_/_-1] max-[480px]:[grid-template-columns:1fr] max-[480px]:[&_>_:only-child]:[grid-column:auto]">
          <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] app-action--primary [border-color:transparent] [color:var(--color-text-on-brand)] [background:var(--color-brand-primary)]" onClick={onReload}>
            Tải lại
          </button>
          {onLeave ? (
            <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] app-action--secondary" onClick={onLeave}>
              Về sảnh
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function RecoveryScreen({ status, message, onRetry, onLeave }: RecoveryScreenProps) {
  const restoring = status === 'restoring';
  return (
    <main className="app-state-screen [position:fixed] [inset:0] [z-index:var(--layer-app-state)] [display:grid] [place-items:center] [overflow:auto] [padding:max(1.25rem,_env(safe-area-inset-top))_max(1.25rem,_env(safe-area-inset-right))_max(1.25rem,_env(safe-area-inset-bottom))_max(1.25rem,_env(safe-area-inset-left))] [color:var(--color-text-primary)] [text-align:center] [background:radial-gradient(circle_at_50%_20%,_rgba(75,_213,_255,_0.16),_transparent_24rem),_var(--color-surface-canvas)]">
      <section
        className="app-state-card [width:min(28rem,_100%)] [padding:clamp(1.5rem,_5vw,_2rem)] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-panel)] [background:color-mix(in_srgb,_var(--color-surface-raised)_95%,_transparent)] [box-shadow:var(--shadow-panel)] [&_h1]:[font-family:'Nunito',_sans-serif] [&_h1]:[font-size:clamp(1.45rem,_4vw,_1.75rem)] [&_h1]:[font-weight:900] [&_h1]:[line-height:1.2] [&_p]:[margin-top:0.75rem] [&_p]:[color:var(--color-text-secondary)] [&_p]:[font-size:0.92rem] [&_p]:[line-height:1.6]"
        role={restoring ? 'status' : 'alert'}
        aria-live="polite"
      >
        <div className={`app-state-spinner [width:3rem] [height:3rem] [margin:0_auto_1.25rem] [border:4px_solid_color-mix(in_srgb,_var(--color-brand-primary)_20%,_transparent)] [border-top-color:var(--color-brand-primary)] [border-radius:50%] animate-app-spin [&.is-paused]:[animation:none] motion-reduce:[animation:none] ${restoring ? '' : 'is-paused'}`} aria-hidden="true" />
        <h1>
          {restoring ? 'Đang khôi phục ván đấu' : 'Chưa thể trở lại ván đấu'}
        </h1>
        <p>
          {restoring
            ? 'Đang kết nối lại đúng người chơi và đồng bộ trạng thái mới nhất…'
            : message || 'Máy chủ chưa thể khôi phục phiên chơi của bạn.'}
        </p>
        {!restoring ? (
          <div className="app-state-actions [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:0.75rem] [margin-top:1.5rem] [&_>_:only-child]:[grid-column:1_/_-1] max-[480px]:[grid-template-columns:1fr] max-[480px]:[&_>_:only-child]:[grid-column:auto]">
            <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] app-action--primary [border-color:transparent] [color:var(--color-text-on-brand)] [background:var(--color-brand-primary)]" onClick={onRetry}>
              Thử lại
            </button>
            <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] app-action--secondary" onClick={onLeave}>
              Về sảnh
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function App() {
  const gamePhase = useGameStore(s => s.gamePhase);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const loadDevState = useGameStore(s => s.loadDevState);
  const error = useGameStore(s => s.error);
  const setError = useGameStore(s => s.setError);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>(() => (
    !IS_DEV && hasReconnectSession() ? 'restoring' : 'idle'
  ));

  useEffect(() => {
    if (IS_DEV) {
      loadDevState();
      return;
    }
    if (!hasReconnectSession()) return;

    let active = true;
    void reconnectPreviousSession().then(restored => {
      if (!active) return;
      setRecoveryStatus(restored ? 'idle' : 'failed');
    });
    return () => {
      active = false;
    };
  }, [loadDevState]);

  const handleRetryRecovery = () => {
    setRecoveryStatus('restoring');
    void reconnectPreviousSession().then(restored => {
      setRecoveryStatus(restored ? 'idle' : 'failed');
    });
  };

  const handleLeaveRecovery = () => {
    leaveRoom();
    setError(null);
    setRecoveryStatus('idle');
  };
  const handleReload = () => window.location.reload();

  const screen = recoveryStatus !== 'idle' ? (
    <RecoveryScreen status={recoveryStatus} message={error} onRetry={handleRetryRecovery} onLeave={handleLeaveRecovery} />
  ) : IS_DEV ? <Suspense fallback={<LoadingFallback onReload={handleReload} />}><GameScreen /></Suspense> :
    !myPlayerId ? <LobbyScreen /> :
    gamePhase === 'waiting' ? <WaitingRoom /> :
    <Suspense fallback={<LoadingFallback onReload={handleReload} onLeave={handleLeaveRecovery} />}><GameScreen /></Suspense>;
  const canRetryRecovery = !IS_DEV && canReconnectPreviousSession();

  return (
    <>
      {/* Overlay nhắc xoay máy khi portrait trên mobile */}
      <div className="rotate-prompt [display:none] max-[900px]:portrait:[display:flex] max-[900px]:portrait:[position:fixed] max-[900px]:portrait:[inset:0] max-[900px]:portrait:[z-index:var(--layer-orientation-lock)] max-[900px]:portrait:[background:var(--color-surface-canvas)] max-[900px]:portrait:[flex-direction:column] max-[900px]:portrait:[align-items:center] max-[900px]:portrait:[justify-content:center] max-[900px]:portrait:[gap:20px] max-[900px]:portrait:[color:var(--color-text-primary)] max-[900px]:portrait:[font-family:'Inter',_sans-serif]">
        <svg className="rotate-prompt-icon max-[900px]:portrait:[width:4rem] max-[900px]:portrait:[height:4rem] max-[900px]:portrait:[color:var(--color-brand-primary)] max-[900px]:portrait:animate-rotate-hint" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="20" y="11" width="24" height="42" rx="5" />
          <path d="M29 17h6M30 47h4M10 30a22 22 0 0 1 7-15m-7 15 6-5m-6 5-4-6M54 34a22 22 0 0 1-7 15m7-15-6 5m6-5 4 6" />
        </svg>
        <div className="rotate-prompt-text max-[900px]:portrait:[font-size:18px] max-[900px]:portrait:[font-weight:700] max-[900px]:portrait:[text-align:center] max-[900px]:portrait:[opacity:0.9]">Xoay ngang để chơi</div>
        <div className="rotate-prompt-sub max-[900px]:portrait:[font-size:13px] max-[900px]:portrait:[opacity:0.5] max-[900px]:portrait:[text-align:center]">Webopoly được tối ưu cho chế độ nằm ngang</div>
      </div>
      {screen}
      {error && recoveryStatus === 'idle' && (myPlayerId || IS_DEV) ? (
        <div className="app-error-banner [position:fixed] [top:max(0.75rem,_env(safe-area-inset-top))] [left:50%] [z-index:var(--layer-app-alert)] [width:min(44rem,_calc(100vw_-_1.5rem))] [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.5rem] [padding:0.75rem] [border:1px_solid_color-mix(in_srgb,_var(--color-status-danger)_38%,_transparent)] [border-radius:1rem] [color:#fff1f2] [background:var(--color-status-danger-surface)] [box-shadow:var(--shadow-panel)] [transform:translateX(-50%)] [backdrop-filter:blur(20px)]" role="alert">
          <span className="app-error-message [min-width:min(16rem,_100%)] [flex:1_1_16rem] [padding:0.2rem_0.35rem] [font-size:0.88rem] [font-weight:700] [line-height:1.45] max-[480px]:[flex-basis:100%]">{error}</span>
          {canRetryRecovery ? (
            <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-error-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] [flex:0_0_auto] [border-color:rgba(255,_255,_255,_0.22)] [color:#fff1f2] [background:rgba(255,_255,_255,_0.09)] max-[480px]:[flex:1_1_0] app-error-action--primary [border-color:transparent] [color:var(--color-text-on-brand)] [background:var(--color-brand-primary)] [color:#4c0519] [background:#fff1f2]" onClick={handleRetryRecovery}>Thử lại</button>
          ) : (
            <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-error-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] [flex:0_0_auto] [border-color:rgba(255,_255,_255,_0.22)] [color:#fff1f2] [background:rgba(255,_255,_255,_0.09)] max-[480px]:[flex:1_1_0] app-error-action--primary [border-color:transparent] [color:var(--color-text-on-brand)] [background:var(--color-brand-primary)] [color:#4c0519] [background:#fff1f2]" onClick={handleReload}>Tải lại</button>
          )}
          {!IS_DEV ? <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-error-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] [flex:0_0_auto] [border-color:rgba(255,_255,_255,_0.22)] [color:#fff1f2] [background:rgba(255,_255,_255,_0.09)] max-[480px]:[flex:1_1_0]" onClick={handleLeaveRecovery}>Về sảnh</button> : null}
          <button type="button" className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] app-error-action [min-height:44px] [padding:0.68rem_1rem] [border:1px_solid_var(--color-border-subtle)] [border-radius:var(--radius-control)] [color:var(--color-text-primary)] [background:var(--color-surface-subtle)] [font-size:0.8rem] [font-weight:900] [&:hover]:[filter:brightness(1.08)] [&:focus-visible]:[outline:3px_solid_var(--color-focus-ring)] [&:focus-visible]:[outline-offset:2px] [flex:0_0_auto] [border-color:rgba(255,_255,_255,_0.22)] [color:#fff1f2] [background:rgba(255,_255,_255,_0.09)] max-[480px]:[flex:1_1_0]" onClick={() => setError(null)} aria-label="Đóng thông báo lỗi">Đóng</button>
        </div>
      ) : null}
    </>
  );
}

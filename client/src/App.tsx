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
import './App.css';

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
    <main className="app-state-screen">
      <section className="app-state-card" aria-labelledby="loading-title">
        <div className="app-state-spinner" aria-hidden="true" />
        <div role="status" aria-live="polite">
          <h1 id="loading-title">Đang tải bàn chơi</h1>
          <p>Nếu quá trình này kéo dài, bạn có thể tải lại để khôi phục phiên hiện tại.</p>
        </div>
        <div className="app-state-actions">
          <button type="button" className="app-action app-action--primary" onClick={onReload}>
            Tải lại
          </button>
          {onLeave ? (
            <button type="button" className="app-action app-action--secondary" onClick={onLeave}>
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
    <main className="app-state-screen">
      <section
        className="app-state-card"
        role={restoring ? 'status' : 'alert'}
        aria-live="polite"
      >
        <div className={`app-state-spinner ${restoring ? '' : 'is-paused'}`} aria-hidden="true" />
        <h1>
          {restoring ? 'Đang khôi phục ván đấu' : 'Chưa thể trở lại ván đấu'}
        </h1>
        <p>
          {restoring
            ? 'Đang kết nối lại đúng người chơi và đồng bộ trạng thái mới nhất…'
            : message || 'Máy chủ chưa thể khôi phục phiên chơi của bạn.'}
        </p>
        {!restoring ? (
          <div className="app-state-actions">
            <button type="button" className="app-action app-action--primary" onClick={onRetry}>
              Thử lại
            </button>
            <button type="button" className="app-action app-action--secondary" onClick={onLeave}>
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
      <div className="rotate-prompt">
        <svg className="rotate-prompt__icon" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="20" y="11" width="24" height="42" rx="5" />
          <path d="M29 17h6M30 47h4M10 30a22 22 0 0 1 7-15m-7 15 6-5m-6 5-4-6M54 34a22 22 0 0 1-7 15m7-15-6 5m6-5 4 6" />
        </svg>
        <div className="rotate-prompt__text">Xoay ngang để chơi</div>
        <div className="rotate-prompt__sub">Webopoly được tối ưu cho chế độ nằm ngang</div>
      </div>
      {screen}
      {error && recoveryStatus === 'idle' && (myPlayerId || IS_DEV) ? (
        <div className="app-error-banner" role="alert">
          <span className="app-error-message">{error}</span>
          {canRetryRecovery ? (
            <button type="button" className="app-error-action app-error-action--primary" onClick={handleRetryRecovery}>Thử lại</button>
          ) : (
            <button type="button" className="app-error-action app-error-action--primary" onClick={handleReload}>Tải lại</button>
          )}
          {!IS_DEV ? <button type="button" className="app-error-action" onClick={handleLeaveRecovery}>Về sảnh</button> : null}
          <button type="button" className="app-error-action" onClick={() => setError(null)} aria-label="Đóng thông báo lỗi">Đóng</button>
        </div>
      ) : null}
    </>
  );
}

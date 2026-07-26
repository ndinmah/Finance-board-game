import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send, getCurrentRoomCode, leaveRoom } from '../net/colyseusClient';
import PlayerAvatar from './PlayerAvatar';
import './LobbyFlow.css';

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
    <main className="lobby-flow-page">
      <div className="lobby-flow-shell lobby-flow-shell--waiting">
        <section className="waiting-summary-panel" aria-labelledby="waiting-title">
          <div className="waiting-brand">
            <span className="lobby-logo lobby-logo--small"><DiceLogo /></span>
            <div><span>Webopoly</span><strong id="waiting-title">Phòng chờ</strong></div>
          </div>

          <div className="waiting-code-card">
            <span>Mã mời bạn bè</span>
            <div className="waiting-code-row">
              <strong id="debug-room-id">{roomCode || '------'}</strong>
              <button
                type="button"
                className="waiting-copy-button"
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

          <div className="waiting-progress">
            <div><span>Người chơi</span><strong>{playerList.length}/{MAX_PLAYERS}</strong></div>
            <div className="waiting-progress-track"><span style={{ width: `${(playerList.length / MAX_PLAYERS) * 100}%` }} /></div>
            <p>{readyCount}/{playerList.length} người đã sẵn sàng</p>
          </div>

          <div className="waiting-actions">
            {!me?.isReady ? (
              <button id="btn-ready" className="lobby-primary-button" type="button" onClick={() => send('ready')}>
                <CheckIcon /><span>Sẵn sàng</span>
              </button>
            ) : (
              <button id="btn-unready" className="lobby-secondary-button waiting-cancel-ready" type="button" onClick={() => send('ready')}>
                <CheckIcon /><span>Hủy sẵn sàng</span>
              </button>
            )}
            {playerList.length < MAX_PLAYERS ? (
              <button className="lobby-secondary-button" type="button" onClick={() => send('addBot')}>
                <BotIcon /><span>Thêm bot</span>
              </button>
            ) : null}
            <button id="btn-leave-room" className="lobby-secondary-button waiting-leave-button" type="button" onClick={leaveRoom}>
              <LeaveIcon /><span>Rời phòng</span>
            </button>
          </div>
        </section>

        <section className="waiting-roster-panel" aria-labelledby="roster-title">
          <div className="waiting-roster-heading">
            <div>
              <span>Đội hình hiện tại</span>
              <h2 id="roster-title">Người chơi</h2>
            </div>
            <span className={allReady ? 'waiting-live waiting-live--ready' : 'waiting-live'}>
              <i aria-hidden="true" /> {allReady ? 'Sắp bắt đầu' : 'Đang chờ'}
            </span>
          </div>

          <div className="waiting-player-grid">
            {slots.map((player, index) => player ? (
              <article className={player.id === myPlayerId ? 'waiting-player waiting-player--me' : 'waiting-player'} key={player.id}>
                <PlayerAvatar name={player.name} color={player.color} className="waiting-avatar" />
                <div className="waiting-player-name">
                  <strong>{player.name}</strong>
                  <span>{player.id === myPlayerId ? 'Bạn' : player.isBot ? 'Máy' : `Người chơi ${index + 1}`}</span>
                </div>
                <span className={player.isReady ? 'waiting-player-state waiting-player-state--ready' : 'waiting-player-state'}>
                  {player.isReady ? <CheckIcon /> : <i aria-hidden="true" />}
                  <span>{player.isReady ? 'Sẵn sàng' : 'Đang đợi'}</span>
                </span>
              </article>
            ) : (
              <article className="waiting-player waiting-player--empty" key={`empty-${index}`}>
                <span className="waiting-avatar">+</span>
                <div className="waiting-player-name"><strong>Chỗ trống</strong><span>Đang chờ tham gia</span></div>
              </article>
            ))}
          </div>

          <p className={allReady ? 'waiting-footer-status waiting-footer-status--ready' : 'waiting-footer-status'}>
            <span aria-hidden="true" />
            {allReady ? 'Đủ người và tất cả đã sẵn sàng. Ván đấu đang bắt đầu…' : 'Cần ít nhất 2 người và tất cả cùng sẵn sàng.'}
          </p>
        </section>
      </div>
    </main>
  );
}

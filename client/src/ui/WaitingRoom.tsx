import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { send, getCurrentRoomCode } from '../net/colyseusClient';
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

export default function WaitingRoom() {
  const players = useGameStore(s => s.players);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const me = players.get(myPlayerId);

  useEffect(() => {
    void import('./GameScreen');
  }, []);

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
            <strong id="debug-room-id">{getCurrentRoomCode() || '------'}</strong>
            <p>Chia sẻ 6 số này để cùng vào bàn.</p>
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
              <div className="waiting-ready-badge"><CheckIcon /><span>Bạn đã sẵn sàng</span></div>
            )}
            {playerList.length < MAX_PLAYERS ? (
              <button className="lobby-secondary-button" type="button" onClick={() => send('addBot')}>
                <BotIcon /><span>Thêm bot</span>
              </button>
            ) : null}
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
                <span className="waiting-avatar" style={{ '--player-color': player.color } as React.CSSProperties}>
                  <img
                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt=""
                    width="32"
                    height="32"
                    style={{ borderRadius: '0.4rem', display: 'block' }}
                  />
                </span>
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


import { useGameStore } from '../store/gameStore';
import { send, getCurrentRoom } from '../net/colyseusClient';
import './WaitingRoom.css';

export default function WaitingRoom() {
  const { players, myPlayerId } = useGameStore();
  const me = players.get(myPlayerId);

  const handleReady = () => send('ready');

  const playerList = Array.from(players.values());
  const allReady = playerList.length >= 2 && playerList.every(p => p.isReady);

  return (
    <div className="waiting-overlay">
      <div className="waiting-card">
        <h2 className="waiting-title">🎲 Phòng Chờ</h2>
        <p className="waiting-sub">Chờ người chơi khác... ({playerList.length}/6)</p>
        <p className="waiting-hint" id="debug-room-id">Mã phòng: {getCurrentRoom()?.id || 'Unknown'}</p>

        <div className="player-list">
          {playerList.map(p => (
            <div key={p.id} className={`player-row ${p.id === myPlayerId ? 'is-me' : ''}`}>
              <span className="player-avatar" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="player-name">{p.name}{p.id === myPlayerId ? ' (bạn)' : ''}</span>
              <span className={`ready-badge ${p.isReady ? 'ready' : 'not-ready'}`}>
                {p.isReady ? '✅ Sẵn sàng' : '⏳ Chờ...'}
              </span>
            </div>
          ))}

          {Array.from({ length: Math.max(0, 2 - playerList.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-row empty">
              <span className="player-avatar empty-avatar">?</span>
              <span className="player-name">Đang chờ...</span>
            </div>
          ))}
        </div>

        {!me?.isReady && (
          <button id="btn-ready" className="btn-ready" onClick={handleReady}>
            ✅ Sẵn Sàng!
          </button>
        )}
        {me?.isReady && !allReady && (
          <p className="waiting-hint">Đang chờ người chơi khác sẵn sàng...</p>
        )}
        {allReady && (
          <p className="waiting-hint starting">🚀 Bắt đầu ngay...</p>
        )}
      </div>
    </div>
  );
}

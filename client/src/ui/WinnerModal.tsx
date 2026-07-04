
import { useGameStore } from '../store/gameStore';
import { leaveRoom } from '../net/colyseusClient';
import './WinnerModal.css';

export default function WinnerModal() {
  const { players, winnerId, myPlayerId } = useGameStore();
  const winner = players.get(winnerId);
  const isMe = winnerId === myPlayerId;

  return (
    <div className="winner-overlay">
      <div className="winner-card">
        <div className="winner-animation">{isMe ? '🏆' : '🥈'}</div>
        <h2 className="winner-title">{isMe ? 'Bạn thắng!' : `${winner?.name || 'Người chơi'} thắng!`}</h2>
        <p className="winner-sub">
          {isMe ? 'Xuất sắc! Bạn là đại gia bất động sản!' : 'Chúc mừng người chiến thắng!'}
        </p>
        {winner && (
          <div className="winner-stats">
            <div className="stat"><span>💰 Tiền còn</span><strong>{winner.money.toLocaleString()}đ</strong></div>
          </div>
        )}
        <button id="btn-return-lobby" className="btn-return" onClick={leaveRoom}>
          🏠 Về Sảnh
        </button>
      </div>
    </div>
  );
}

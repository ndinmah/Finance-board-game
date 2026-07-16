
import { useGameStore } from '../store/gameStore';
import { leaveRoom } from '../net/colyseusClient';
import { formatMoney } from '../utils/format';

export default function WinnerModal() {
  const { players, winnerId, myPlayerId } = useGameStore();
  const winner = players.get(winnerId);
  const isMe = winnerId === myPlayerId;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-[8px] flex items-center justify-center z-[200]">
      <div className="bg-gradient-to-br from-[#1e2d5a] to-[#162040] border-[2px] border-[rgba(245,197,24,0.5)] rounded-[16px] md:rounded-[24px] p-[32px_20px] md:p-[48px_40px] text-center w-[90%] max-w-[380px] shadow-[0_0_60px_rgba(245,197,24,0.2),0_24px_64px_rgba(0,0,0,0.7)] animate-winner-slide">
        <div className="text-[60px] md:text-[80px] animate-trophy-bounce block">{isMe ? '🏆' : '🥈'}</div>
        <h2 className="font-nunito text-[24px] md:text-[32px] font-black bg-gradient-to-br from-[#f5c518] to-[#e67e22] text-transparent bg-clip-text m-[12px_0_8px]">{isMe ? 'Bạn thắng!' : `${winner?.name || 'Người chơi'} thắng!`}</h2>
        <p className="text-[#8faad4] text-[13px] md:text-[15px] mb-[20px]">
          {isMe ? 'Xuất sắc! Bạn là đại gia bất động sản!' : 'Chúc mừng người chiến thắng!'}
        </p>
        {winner && (
          <div className="flex justify-center gap-[16px] md:gap-[24px] mb-[24px]">
            <div className="flex flex-col gap-[4px] text-[13px] text-[#8faad4]"><span>💰 Tiền còn</span><strong className="text-[#f5c518] text-[16px] md:text-[18px] font-extrabold">{formatMoney(winner.money)}</strong></div>
          </div>
        )}
        <button id="btn-return-lobby" className="w-full md:w-auto bg-gradient-to-br from-[#4a90d9] to-[#2176ae] text-white text-[15px] md:text-[16px] font-bold p-[12px_24px] md:p-[14px_32px] rounded-[14px] border-none cursor-pointer shadow-[0_4px_16px_rgba(74,144,217,0.4)] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(74,144,217,0.6)] mt-[20px]" onClick={leaveRoom}>
          Quay về Sảnh
        </button>
      </div>
    </div>
  );
}

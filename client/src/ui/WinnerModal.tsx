
import { useGameStore } from '../store/gameStore';
import { leaveRoom } from '../net/colyseusClient';
import { formatMoney } from '../utils/format';

export default function WinnerModal() {
  const { players, winnerId, myPlayerId } = useGameStore();
  const winner = players.get(winnerId);
  const isMe = winnerId === myPlayerId;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-[0.5333rem] flex items-center justify-center z-[200]">
      <div className="bg-gradient-to-br from-[#1e2d5a] to-[#162040] border-[0.1333rem] border-[rgba(245,197,24,0.5)] rounded-[1.0667rem] md:rounded-[1.6rem] p-[2.1333rem_1.3333rem] md:p-[3.2rem_2.6667rem] text-center w-[90%] max-w-[25.3333rem] shadow-[0_0_4rem_rgba(245,197,24,0.2),0_1.6rem_4.2667rem_rgba(0,0,0,0.7)] animate-winner-slide">
        <div className="text-[4rem] md:text-[5.3333rem] animate-trophy-bounce block">{isMe ? '🏆' : '🥈'}</div>
        <h2 className="font-nunito text-[1.6rem] md:text-[2.1333rem] font-black bg-gradient-to-br from-[#f5c518] to-[#e67e22] text-transparent bg-clip-text m-[0.8rem_0_0.5333rem]">{isMe ? 'Bạn thắng!' : `${winner?.name || 'Người chơi'} thắng!`}</h2>
        <p className="text-[#8faad4] text-[0.8667rem] md:text-[1rem] mb-[1.3333rem]">
          {isMe ? 'Xuất sắc! Bạn là đại gia bất động sản!' : 'Chúc mừng người chiến thắng!'}
        </p>
        {winner && (
          <div className="flex justify-center gap-[1.0667rem] md:gap-[1.6rem] mb-[1.6rem]">
            <div className="flex flex-col gap-[0.2667rem] text-[0.8667rem] text-[#8faad4]"><span>💰 Tiền còn</span><strong className="text-[#f5c518] text-[1.0667rem] md:text-[1.2rem] font-extrabold">{formatMoney(winner.money)}</strong></div>
          </div>
        )}
        <button id="btn-return-lobby" className="w-full md:w-auto bg-gradient-to-br from-[#4a90d9] to-[#2176ae] text-white text-[1rem] md:text-[1.0667rem] font-bold p-[0.8rem_1.6rem] md:p-[0.9333rem_2.1333rem] rounded-[0.9333rem] border-none cursor-pointer shadow-[0_0.2667rem_1.0667rem_rgba(74,144,217,0.4)] transition-all duration-150 hover:-translate-y-[0.1333rem] hover:shadow-[0_0.5333rem_1.6rem_rgba(74,144,217,0.6)] mt-[1.3333rem]" onClick={leaveRoom}>
          Quay về Sảnh
        </button>
      </div>
    </div>
  );
}

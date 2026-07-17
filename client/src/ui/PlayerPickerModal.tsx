import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose?: () => void;
}

export default function PlayerPickerModal({ onClose }: Props) {
  const { players, myPlayerId, turnPhase, currentPlayerId } = useGameStore();

  // Modal này chỉ được hiển thị khi đang trong phase chọn người chơi để tặng đất (chance_give_city_target)
  // và mình là người đang thực hiện lượt.
  if (turnPhase !== 'chance_give_city_target' || currentPlayerId !== myPlayerId) {
    return null;
  }

  const validTargets = Array.from(players.values()).filter(p => p.id !== myPlayerId && !p.isBankrupt);

  const handleSelect = (targetId: string) => {
    send('chanceGiveCityTarget', { targetId });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[0.5333rem] flex items-center justify-center z-[1000] p-4">
      <div className="relative w-full max-w-[32rem] bg-white rounded-[1.6rem] overflow-hidden shadow-[0_1.6rem_3.2rem_rgba(0,0,0,0.25),inset_0_0.1333rem_0.2667rem_rgba(255,255,255,0.8)] animate-card-modal-slide">
        
        <div className="p-[1.3333rem_1.6rem] bg-[#8b5cf6] text-white flex justify-between items-center border-b border-[rgba(0,0,0,0.08)]">
          <h3 className="text-[1.3333rem] font-bold m-0 leading-tight drop-shadow-[0_0.0667rem_0.2667rem_rgba(0,0,0,0.3)]">
            🎁 Tặng Đất Cho Ai?
          </h3>
          {/* Không có nút X vì lựa chọn này là bắt buộc */}
        </div>

        <div className="p-[1.6rem] bg-[#fdfaf5] max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          <p className="text-[1rem] text-[#4b5563] text-center mb-2">
            Vui lòng chọn 1 người chơi để tặng khu đất bạn vừa chọn. Hành động này không thể hoàn tác!
          </p>

          {validTargets.length > 0 ? (
            validTargets.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full flex items-center p-3 bg-white border border-[rgba(0,0,0,0.08)] rounded-[0.8rem] shadow-sm hover:border-[#8b5cf6] hover:shadow-md transition-all text-left group"
              >
                <div 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0 mr-4"
                  style={{ backgroundColor: p.color }}
                >
                  <img src={`/images/avt/avt_${p.avatarIndex}.jpg`} alt={p.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[1.0667rem] text-[#1f2937] group-hover:text-[#8b5cf6] transition-colors">{p.name}</div>
                  <div className="text-[0.9333rem] text-[#6b7280] flex items-center gap-1 mt-0.5">
                    Tài sản: <span className="font-bold text-[#f59e0b]">{formatMoneyFull(p.money)}$</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center group-hover:bg-[#8b5cf6] group-hover:text-white transition-colors">
                  ➔
                </div>
              </button>
            ))
          ) : (
            <div className="text-center p-4 bg-[rgba(239,68,68,0.1)] text-[#ef4444] rounded-[0.8rem] font-medium">
              Không có đối thủ hợp lệ nào. (Sẽ tự động bỏ qua)
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

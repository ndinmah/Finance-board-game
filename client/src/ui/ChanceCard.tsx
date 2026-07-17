import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface Props {
  onClose: () => void;
}

// Metadata cho 18 thẻ Cơ Hội
const CHANCE_CARDS_META: Record<string, { title: string; desc: string; color: 'green' | 'yellow' | 'red' }> = {
  'DISCOUNT_RENT': { title: 'Phiếu Giảm Giá', desc: 'Giảm 50% tiền thuê lần tiếp theo trả cho đối thủ.', color: 'green' },
  'DOUBLE_RENT': { title: 'Cho Vay Nặng Lãi', desc: 'Lần tiếp theo giẫm vào đất đối thủ, tiền thuê tăng GẤP ĐÔI.', color: 'red' },
  'SHIELD': { title: 'Tấm Khiên Vững Chắc', desc: 'Bảo vệ 1 khu đất khỏi mọi đợt tấn công tiếp theo.', color: 'green' },
  'FORCE_SELL': { title: 'Cưỡng Chế Bán', desc: 'Ép đối thủ phải bán lại 1 khu đất cho Ngân Hàng.', color: 'red' },
  'SABOTAGE': { title: 'Phá Hoại', desc: 'Giảm 1 cấp nhà của 1 khu đất đối thủ.', color: 'red' },
  'EARTHQUAKE': { title: 'Động Đất', desc: 'Phá hủy hoàn toàn 1 khu đất đối thủ (thành đất vô chủ).', color: 'red' },
  'BLACKOUT': { title: 'Cúp Điện', desc: '1 khu đất đối thủ bị cúp điện, mất doanh thu trong 2 lượt.', color: 'red' },
  'CHANCE_FESTIVAL': { title: 'Tài Trợ Lễ Hội', desc: 'Miễn phí tổ chức Lễ Hội tại 1 khu đất của bạn.', color: 'yellow' },
  'GIVE_CITY': { title: 'Từ Thiện', desc: 'Bắt buộc chọn 1 khu đất của bạn để tặng cho đối thủ.', color: 'yellow' },
  'GOTO_AIRPORT': { title: 'Vé Máy Bay', desc: 'Đi thẳng đến Sân Bay, nhưng phải đợi lượt sau mới được bay.', color: 'green' },
  'GOTO_START': { title: 'Về Vạch Xuất Phát', desc: 'Đi thẳng về Ô Xuất Phát và nhận thưởng 200K.', color: 'green' },
  'GOTO_ACTIVE_FESTIVAL': { title: 'Đi Xem Hội', desc: 'Đi thẳng đến khu đất đang tổ chức Lễ Hội (không mất tiền).', color: 'yellow' },
  'GOTO_FESTIVAL_CORNER': { title: 'Lạc Đường', desc: 'Đi thẳng đến Ô Lễ Hội (nhưng không được tổ chức).', color: 'yellow' },
  'GOTO_TAX': { title: 'Thanh Tra Thuế', desc: 'Đi thẳng đến Ô Thuế, nộp 10% tài sản.', color: 'red' },
  'GOTO_JAIL': { title: 'Bị Bắt Giam', desc: 'Đi thẳng vào Tù, không nhận tiền Xuất Phát.', color: 'red' },
  'BIRTHDAY': { title: 'Chúc Mừng Sinh Nhật', desc: 'Tất cả người chơi khác tặng bạn 20K.', color: 'green' },
  'PENALTY': { title: 'Nộp Phạt Phân Phối', desc: 'Mất 50K cho Ngân Hàng.', color: 'red' },
  'JAIL_CARD': { title: 'Thẻ Ra Tù Miễn Phí', desc: 'Có thể dùng để thoát khỏi nhà giam.', color: 'green' },
};

export default function ChanceCard({ onClose }: Props) {
  const events = useGameStore(s => s.events);
  const [progress, setProgress] = useState(100);

  // Tìm event Chance cuối cùng
  const chanceEvent = [...events].reverse().find(e => e.type === 'chance');
  
  let cardId = '';
  if (chanceEvent) {
    const parts = chanceEvent.message.split(': ');
    if (parts.length > 1) {
      cardId = parts[1].trim();
    }
  }

  const meta = CHANCE_CARDS_META[cardId] || { 
    title: 'Cơ Hội', 
    desc: chanceEvent?.message || 'Bạn vừa rút một thẻ Cơ Hội.', 
    color: 'yellow' 
  };

  const bgColors = {
    green: 'bg-[#10b981]',
    yellow: 'bg-[#f59e0b]',
    red: 'bg-[#ef4444]',
  };
  
  const textColors = {
    green: 'text-[#047857]',
    yellow: 'text-[#b45309]',
    red: 'text-[#b91c1c]',
  };

  useEffect(() => {
    // ProgressBar tự đóng sau 4 giây
    const duration = 4000;
    const interval = 50;
    const step = (100 / (duration / interval));
    
    const timer = setInterval(() => {
      setProgress(p => {
        if (p <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return p - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[0.5333rem] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      {/* Khung thẻ bài (Tỷ lệ 2.5 : 3.5 tiêu chuẩn) */}
      <div className="relative w-[21.3333rem] md:w-[25.3333rem] max-h-[82vh] aspect-[2.5/3.5] animate-card-modal-slide" onClick={e => e.stopPropagation()}>
        
        {/* Lớp nền tạo hiệu ứng bóng và viền nổi */}
        <div className="absolute inset-0 bg-white rounded-[1.3333rem] shadow-[0_2rem_4rem_rgba(0,0,0,0.4),0_0_0_0.0667rem_rgba(255,255,255,0.8)_inset] overflow-hidden flex flex-col border-[0.5333rem] border-white">
          
          {/* Header nhỏ mô phỏng Monopoly */}
          <div className="text-center font-black uppercase text-[0.8rem] tracking-[0.2em] py-2 text-[#9ca3af] bg-[#f9fafb] border-b border-[#f3f4f6]">
            CƠ HỘI
          </div>
 
          {/* Khung ảnh minh họa */}
          <div className="w-full h-[45%] bg-[#f8fafc] relative flex-shrink-0 border-b border-[#e2e8f0] flex items-center justify-center overflow-hidden p-4">
             {/* Animated background glows */}
             <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl opacity-30 animate-pulse ${meta.color === 'green' ? 'bg-emerald-400' : meta.color === 'red' ? 'bg-rose-400' : 'bg-amber-400'}`} />
             <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-30 animate-pulse delay-1000 ${meta.color === 'green' ? 'bg-emerald-400' : meta.color === 'red' ? 'bg-rose-400' : 'bg-amber-400'}`} />
             
             {/* Holographic Glowing Badge */}
             <div className="w-[6rem] h-[6rem] rounded-full flex items-center justify-center relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.12),_inset_0_2px_4px_rgba(255,255,255,0.6)] border border-white/60 backdrop-blur-[4px] bg-white/40">
               <span className="text-[3rem] animate-trophy-bounce select-none">
                 {meta.color === 'green' ? '💎' : meta.color === 'red' ? '⚡' : '✨'}
               </span>
             </div>
          </div>
 
          {/* Nội dung text (nằm giữa) */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white to-[#fdfaf5]">
            <h2 className={`text-[1.7333rem] font-black leading-[1.1] mb-3 tracking-tight ${textColors[meta.color]}`}>
              {meta.title}
            </h2>
            <p className="text-[1.0667rem] text-[#4b5563] font-medium leading-snug m-0">
              {meta.desc}
            </p>
          </div>
 
          {/* Thanh progress bar ở viền dưới cùng */}
          <div className="h-[0.4rem] w-full bg-gray-100 absolute bottom-0 left-0">
            <div 
              className={`h-full ${bgColors[meta.color]} transition-all duration-75 ease-linear`} 
              style={{ width: `${progress}%` }}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}

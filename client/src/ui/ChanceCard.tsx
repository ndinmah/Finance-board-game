import { useEffect, useState, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useGameStore } from '../store/gameStore';

interface Props {
  onClose: () => void;
}

// Metadata cho 18 thẻ Cơ Hội
const CHANCE_CARDS_META: Record<string, { title: string; desc: string; color: 'green' | 'yellow' | 'red'; image?: string }> = {
  'DISCOUNT_RENT': { title: 'Phiếu Giảm Giá', desc: 'Giảm 50% khi thanh toán tiền thuê tiếp theo.', color: 'green', image: '/images/chance/DISCOUNT_RENT.webp' },
  'DOUBLE_RENT': { title: 'Cho Vay Nặng Lãi', desc: 'Bạn phải trả gấp đôi tiền thuê ở lần thuê tiếp theo.', color: 'red', image: '/images/chance/DOUBLE_RENT.webp' },
  'SHIELD': { title: 'Tao Có Khiên', desc: 'Bảo vệ thành phố khỏi việc chuộc lại và tránh được 1 lần tấn công từ đối thủ.', color: 'green', image: '/images/chance/SHIELD.webp' },
  'FORCE_SELL': { title: 'Phải Chịu', desc: 'Buộc đối thủ phải bán 1 thành phố mà bạn chọn (trừ khách sạn).', color: 'red', image: '/images/chance/FORCE_SELL.webp' },
  'SABOTAGE': { title: 'Phá Hoại', desc: 'Phá hủy 1 tòa nhà của đối thủ (hạ 1 cấp nhà của đối thủ, không bao gồm khách sạn).', color: 'red', image: '/images/chance/SABOTAGE.webp' },
  'EARTHQUAKE': { title: 'Ơ Động Đất À', desc: 'Một trận động đất phá hủy thành phố, đất đai trở nên vô chủ (trừ khách sạn).', color: 'red', image: '/images/chance/EARTHQUAKE.webp' },
  'BLACKOUT': { title: 'Cúp Điện', desc: 'Bạn tắt đèn trong thành phố của đối thủ, thành phố trở nên không hoạt động cho đến khi đối thủ đi qua ô Bắt Đầu 3 lần.', color: 'red', image: '/images/chance/BLACKOUT.webp' },
  'CHANCE_FESTIVAL': { title: 'Địa Điểm Hot', desc: 'Chọn 1 thành phố để tổ chức Festival.', color: 'yellow', image: '/images/chance/CHANCE_FESTIVAL.webp' },
  'GIVE_CITY': { title: 'Anh Này Giàu Thế', desc: 'Hãy tặng cho bất kỳ người chơi nào 1 thành phố của mình.', color: 'yellow', image: '/images/chance/GIVE_CITY.webp' },
  'GOTO_AIRPORT': { title: 'Lửa Chùa', desc: 'Tham gia 1 chuyến đi vòng quanh thế giới.', color: 'green', image: '/images/chance/GOTO_AIRPORT.webp' },
  'GOTO_START': { title: 'Bắt Đầu', desc: 'Chuyển tới ô Bắt Đầu.', color: 'green', image: '/images/chance/GOTO_START.webp' },
  'GOTO_ACTIVE_FESTIVAL': { title: 'Toang Rồi Ông Giáo Ạ', desc: 'Đi tới ô đang tổ chức Festival.', color: 'yellow', image: '/images/chance/GOTO_ACTIVE_FESTIVAL.webp' },
  'GOTO_FESTIVAL_CORNER': { title: 'Ngon Thí', desc: 'Đi tới ô Festival.', color: 'yellow', image: '/images/chance/GOTO_FESTIVAL_CORNER.webp' },
  'GOTO_TAX': { title: 'I Love TikTok', desc: 'Đến văn phòng thuế.', color: 'red', image: '/images/chance/GOTO_TAX.webp' },
  'GOTO_JAIL': { title: 'Nhà Tù', desc: 'Vào tù, đi thẳng vào tù.', color: 'red', image: '/images/chance/GOTO_JAIL.webp' },
  'BIRTHDAY': { title: 'Chúc Mừng Sinh Nhật', desc: 'Nhận 25.000 từ mỗi đối thủ.', color: 'green', image: '/images/chance/BIRTHDAY.webp' },
  'PENALTY': { title: 'Phạt', desc: 'Bạn mất 50.000.', color: 'red', image: '/images/chance/PENALTY.webp' },
  'JAIL_CARD': { title: 'Thẻ Ra Tù Miễn Phí', desc: 'Bạn được phép thoát khỏi tù (có thể sử dụng sau, không bán được).', color: 'green', image: '/images/chance/JAIL_CARD.webp' },
};

export default function ChanceCard({ onClose }: Props) {
  const events = useGameStore(s => s.events);
  const [progress, setProgress] = useState(100);
  
  // 3D Tilt State
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Tìm event Chance cuối cùng
  const chanceEvent = [...events].reverse().find(e => e.type === 'chance');

  const cardId = chanceEvent?.cardId ?? '';

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
  
  const shadowColors = {
    green: 'rgba(16, 185, 129, 0.4)',
    yellow: 'rgba(245, 158, 11, 0.4)',
    red: 'rgba(239, 68, 68, 0.4)',
  };

  useEffect(() => {
    const duration = 4000;
    const interval = 50;
    const step = (100 / (duration / interval));
    setProgress(100);

    const progressTimer = setInterval(() => {
      setProgress(current => Math.max(0, current - step));
    }, interval);
    const closeTimer = setTimeout(onClose, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(closeTimer);
    };
  }, [chanceEvent?.timestamp, onClose]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Rotate max 12 degrees
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setRotX(rotateX);
    setRotY(rotateY);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotX(0);
    setRotY(0);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[0.5333rem] flex items-center justify-center z-[1000] p-4" 
      style={{ perspective: '1200px' }}
      role="dialog" 
      aria-modal="true" 
      aria-label="Thẻ Cơ Hội" 
      onClick={onClose}
    >
      
      {/* Wrapper có animation trượt vào ban đầu */}
      <div className="animate-card-modal-slide">
        {/* Khung thẻ xoay 3D */}
        <div 
          ref={cardRef}
          className="relative w-[21.3333rem] md:w-[25.3333rem] max-h-[82vh] aspect-[2.5/3.5] transition-transform ease-out will-change-transform"
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovering ? 1.05 : 1}, ${isHovering ? 1.05 : 1}, ${isHovering ? 1.05 : 1})`,
            transitionDuration: isHovering ? '75ms' : '500ms',
            transformStyle: 'preserve-3d'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          onClick={e => e.stopPropagation()}
        >
          
          {/* Lớp nền chính của thẻ */}
          <div 
            className="absolute inset-0 bg-white rounded-[1.3333rem] overflow-hidden flex flex-col border-[0.5333rem] border-white z-10"
            style={{
              boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 50px ${isHovering ? shadowColors[meta.color] : 'transparent'}, inset 0 0 0 1px rgba(255,255,255,0.8)`,
              transform: 'translateZ(0px)', // Bắt buộc cho 3D context
            }}
          >
            {/* Header */}
            <div 
              className="text-center font-black uppercase text-[1rem] tracking-[0.25em] py-3 text-white shadow-sm z-20" 
              style={{ backgroundColor: meta.color === 'green' ? '#10b981' : meta.color === 'red' ? '#ef4444' : '#f59e0b' }}
            >
              THẺ CƠ HỘI
            </div>

            {/* Khung ảnh */}
            <div className="w-full h-[55%] relative flex-shrink-0 border-b-2 border-gray-100 flex items-center justify-center overflow-hidden p-4 bg-gray-50 z-20" style={{ transformStyle: 'preserve-3d' }}>
               {/* Glow mờ ảo phía sau */}
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-3xl opacity-30 animate-pulse ${meta.color === 'green' ? 'bg-emerald-400' : meta.color === 'red' ? 'bg-rose-400' : 'bg-amber-400'}`} />
               
               {meta.image ? (
                 <img
                   src={meta.image}
                   alt={meta.title}
                   className="w-full h-full object-contain relative z-10 drop-shadow-xl"
                   style={{
                     transform: `translateZ(${isHovering ? '40px' : '0px'}) scale(${isHovering ? 1.05 : 1})`,
                     transition: 'transform 200ms ease-out'
                   }}
                 />
               ) : (
                 <div className="w-[6rem] h-[6rem] rounded-full flex items-center justify-center relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.12),_inset_0_2px_4px_rgba(255,255,255,0.6)] border border-white/60 backdrop-blur-[4px] bg-white/40">
                   <span className="text-[3rem] animate-trophy-bounce select-none">
                     {meta.color === 'green' ? '💎' : meta.color === 'red' ? '⚡' : '✨'}
                   </span>
                 </div>
               )}
            </div>

            {/* Nội dung text */}
            <div 
              className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white z-20" 
              style={{ transform: `translateZ(${isHovering ? '25px' : '0px'})`, transition: 'transform 200ms ease-out' }}
            >
              <h2 className={`text-[1.8rem] font-black leading-[1.1] mb-3 tracking-tight drop-shadow-sm ${textColors[meta.color]}`}>
                {meta.title}
              </h2>
              <p className="text-[1.1rem] text-gray-700 font-medium leading-relaxed m-0">
                {meta.desc}
              </p>
            </div>

            {/* Thanh progress bar ở viền dưới cùng */}
            <div className="h-[0.5rem] w-full bg-gray-200 absolute bottom-0 left-0 z-20">
              <div
                className={`h-full ${bgColors[meta.color]} transition-all duration-75 ease-linear`}
                style={{ width: `${progress}%`, boxShadow: `0 0 10px ${shadowColors[meta.color]}` }}
              />
            </div>

            {/* Holographic foil glare overlay (Hiệu ứng phản quang) */}
            <div 
              className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay transition-opacity duration-300"
              style={{
                opacity: isHovering ? 0.7 : 0,
                background: `linear-gradient(105deg, 
                  transparent 20%, 
                  rgba(255, 255, 255, 0.4) 25%, 
                  rgba(255, 255, 255, 0.6) 50%, 
                  transparent 54%, 
                  transparent 100%)`,
                backgroundSize: '200% 200%',
                backgroundPosition: `${(rotY + 15) * 3}% ${(rotX + 15) * 3}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

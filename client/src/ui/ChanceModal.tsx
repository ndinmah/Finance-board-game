import ModalShell, { ModalCloseButton } from './ModalShell';

interface Props {
  onClose: () => void;
}

const ChanceIllustration = () => (
  <img src="/images/chance.webp" alt="Cơ hội" className="w-full h-full object-cover rounded-[0.8rem] shadow-[0_0.2667rem_0.8rem_rgba(0,0,0,0.15)] block contrast-[1.05]" />
);

export default function ChanceModal({ onClose }: Props) {
  return (
    <ModalShell ariaLabel="Thông tin ô Cơ hội" onClose={onClose}>
      <div className="relative w-full max-w-[38.6667rem] md:max-w-[48rem] animate-card-modal-slide
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[1.6rem] before:shadow-[0_0.2667rem_0.8rem_rgba(0,0,0,0.1)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[1.6rem] after:shadow-[0_0.2667rem_0.8rem_rgba(0,0,0,0.1)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div className="bg-white rounded-[1.6rem] overflow-hidden shadow-[0_1.6rem_3.2rem_rgba(0,0,0,0.25),0_0_0_0.0667rem_rgba(0,0,0,0.05),inset_0_0.1333rem_0.2667rem_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
          
          {/* Header Gradient */}
          <div className="p-[0.9333rem_1.6rem] text-white flex justify-between items-center relative border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b]">
            <h3 className="text-[1.3333rem] font-black m-0 leading-tight tracking-[0.0667rem] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center gap-2">
              ✨ THÔNG TIN CƠ HỘI (CHANCE)
            </h3>
            <ModalCloseButton className="absolute right-[0.75rem] top-1/2 -translate-y-1/2" onClick={onClose} />
          </div>
          
          <div className="p-[1.0667rem] md:p-[1.3333rem_1.6rem]">
            <div className="flex flex-row gap-4 items-stretch w-full">
              
              {/* Left Stub (Ticket Stub) */}
              <div className="flex-none w-[10rem] md:w-[12rem] flex flex-col items-center justify-center bg-[#fffbeb] border border-[#fde68a] rounded-[1rem] p-[0.8rem] shadow-[inset_0_2px_4px_rgba(245,158,11,0.02)]">
                <div className="w-full aspect-[4/3] relative overflow-hidden rounded-[0.8rem] shrink-0">
                  <ChanceIllustration />
                </div>
                
                {/* CSS Barcode */}
                <div className="w-full mt-3 flex flex-col items-center gap-1 shrink-0 opacity-70">
                  <div className="h-[1.6rem] w-[8rem] flex items-center justify-between px-1">
                    <div className="w-[3px] h-full bg-[#78350f]"></div>
                    <div className="w-[1px] h-full bg-[#78350f]"></div>
                    <div className="w-[2px] h-full bg-[#78350f]"></div>
                    <div className="w-[4px] h-full bg-[#78350f]"></div>
                    <div className="w-[1px] h-full bg-[#78350f]"></div>
                    <div className="w-[3px] h-full bg-[#78350f]"></div>
                    <div className="w-[1px] h-full bg-[#78350f]"></div>
                    <div className="w-[2px] h-full bg-[#78350f]"></div>
                    <div className="w-[3px] h-full bg-[#78350f]"></div>
                    <div className="w-[1px] h-full bg-[#78350f]"></div>
                    <div className="w-[4px] h-full bg-[#78350f]"></div>
                    <div className="w-[2px] h-full bg-[#78350f]"></div>
                    <div className="w-[1px] h-full bg-[#78350f]"></div>
                    <div className="w-[3px] h-full bg-[#78350f]"></div>
                  </div>
                  <span className="text-[0.6rem] font-bold text-[#b45309] tracking-[0.15em] uppercase">CHANCE-24-INFO</span>
                </div>
              </div>

              {/* Dashed Line Separator */}
              <div className="w-0 border-l-2 border-dashed border-[#fde68a] self-stretch mx-1" />

              {/* Right Boarding Pass Ticket Info */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="bg-[#fffbeb] border border-dashed border-[#fde68a] rounded-[1rem] p-[0.8rem_1rem] text-left relative shadow-[inset_0_2px_4px_rgba(245,158,11,0.02),0_8px_24px_rgba(245,158,11,0.04)] overflow-hidden flex flex-col gap-2">
                  
                  {/* Ticket punch holes on the left and right edges */}
                  <div className="absolute top-1/2 -left-[0.4rem] -translate-y-1/2 w-[0.8rem] h-[0.8rem] rounded-full bg-white border border-[#fde68a] z-20" />
                  <div className="absolute top-1/2 -right-[0.4rem] -translate-y-1/2 w-[0.8rem] h-[0.8rem] rounded-full bg-white border border-[#fde68a] z-20" />

                  <div className="flex justify-between items-center border-b border-dashed border-[#fde68a] pb-1 mb-0.5">
                    <span className="font-extrabold text-[#92400e] text-[0.7333rem] uppercase tracking-[0.0667rem] flex items-center gap-1">🎲 THẺ CƠ HỘI NGẪU NHIÊN</span>
                    <span className="text-[0.6667rem] font-extrabold text-[#92400e] bg-[#fef3c7] p-[0.1333rem_0.5rem] rounded-[0.2667rem] shadow-sm">RANDOM DRAW</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-black text-[1.1rem] text-[#78350f] tracking-wide">VẬN MAY & THỬ THÁCH</span>
                      <span className="text-[0.6667rem] text-[#b45309] mt-[0.0667rem] font-semibold">Tự động rút thẻ khi người chơi dừng vào ô này</span>
                    </div>
                  </div>
                </div>

                <div className="w-full text-left">
                  <h4 className="text-[0.7333rem] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-[0.0533rem] flex items-center gap-1">📋 Đặc điểm ô Cơ Hội</h4>
                  <ul className="flex flex-col gap-2 p-0 m-0 list-none">
                    <li className="bg-white border border-[#e2e8f0] rounded-[0.6667rem] p-[0.5333rem_0.8rem] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[0.0667rem] shadow-sm">
                      <span className="w-[1.8667rem] h-[1.8667rem] rounded-[0.4rem] bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center text-[0.9333rem] shrink-0 shadow-sm border border-[#e2e8f0]">🍀</span>
                      <div className="flex-1">
                        <div className="font-bold text-[#1e293b] text-[0.8rem]">Thẻ Hỗ Trợ (Màu xanh)</div>
                        <div className="text-[0.7rem] text-[#64748b] mt-[0.0667rem] leading-[1.3]">Nhận khiên bảo vệ, giảm tiền thuê, tặng tiền thưởng hoặc vé máy bay miễn phí.</div>
                      </div>
                    </li>
                    <li className="bg-white border border-[#e2e8f0] rounded-[0.6667rem] p-[0.5333rem_0.8rem] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[0.0667rem] shadow-sm">
                      <span className="w-[1.8667rem] h-[1.8667rem] rounded-[0.4rem] bg-[#fffbeb] text-[#ef4444] flex items-center justify-center text-[0.9333rem] shrink-0 shadow-sm border border-[#e2e8f0]">💥</span>
                      <div className="flex-1">
                        <div className="font-bold text-[#1e293b] text-[0.8rem]">Thẻ Phá Hoại (Màu đỏ)</div>
                        <div className="text-[0.7rem] text-[#64748b] mt-[0.0667rem] leading-[1.3]">Gây động đất phá hủy nhà, cúp điện cắt nguồn thu đối thủ hoặc phạt tiền.</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

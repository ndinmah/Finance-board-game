import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const FestivalIllustration = () => (
  <img src="/images/festival.webp" alt="Festival" className="w-full h-full object-contain" />
);

export default function FestivalModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="relative w-full max-w-[580px] md:max-w-[820px] animate-card-modal-slide
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[24px] before:shadow-[0_4px_12px_rgba(0,0,0,0.1)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[24px] after:shadow-[0_4px_12px_rgba(0,0,0,0.1)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-[16px_24px] text-white flex justify-between items-start relative border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-br from-[#a855f7] to-[#7e22ce]">
            <h3 className="text-[22px] font-bold m-0 leading-[1.2] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">LỄ HỘI THÀNH PHỐ</h3>
            <button className="absolute top-4 right-4 bg-[rgba(0,0,0,0.15)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)]" onClick={onClose}>✕</button>
          </div>
          
          <div className="p-[12px] md:p-[16px_20px]">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center w-full max-w-[650px] mx-auto">
              <div className="flex-none md:flex-[0_0_180px] flex flex-col items-center justify-center">
                <div className="w-[150px] md:w-full scale-90">
                  <FestivalIllustration />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="bg-[#faf5ff] border border-dashed border-[#d8b4fe] rounded-[12px] p-[10px_12px] text-left relative shadow-[0_4px_12px_rgba(126,34,206,0.02)]">
                  <div className="flex justify-between items-center border-b border-dashed border-[#d8b4fe] pb-1 mb-1.5">
                    <span className="font-extrabold text-[#7e22ce] text-[11px] uppercase tracking-[1px] flex items-center gap-1">🎉 CITY FESTIVAL / LỄ HỘI</span>
                    <span className="text-[10px] font-extrabold text-[#c026d3] bg-[#fdf4ff] p-[2px_6px] rounded-[4px]">FESTIVAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-black text-[15px] text-[#1e1b4b]">TỔ CHỨC SỰ KIỆN</span>
                      <span className="text-[10px] text-[#6b21a8] mt-[1px]">Tăng hệ số thuê thành phố</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-[#7e22ce] uppercase font-bold">Chi phí đăng cai</div>
                      <div className="text-[15px] font-extrabold text-[#1e1b4b]">{formatMoneyFull(50)} $</div>
                    </div>
                  </div>
                </div>

                <div className="w-full text-left">
                  <h4 className="text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-[0.8px]">📋 Quy tắc lễ hội</h4>
                  <ul className="flex flex-col gap-1.5 p-0 m-0 list-none">
                    <li className="bg-white border border-[#e2e8f0] rounded-[10px] p-[6px_10px] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[1px]">
                      <span className="w-[28px] h-[28px] rounded-[6px] bg-[#faf5ff] text-[#7e22ce] flex items-center justify-center text-[14px] shrink-0">📈</span>
                      <span className="flex-1 text-[11.5px] text-[#334155] leading-[1.35]">Tổ chức lễ hội làm <strong className="font-bold">tăng vĩnh viễn</strong> hệ số thu tiền thuê đất.</span>
                    </li>
                    <li className="bg-white border border-[#e2e8f0] rounded-[10px] p-[6px_10px] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[1px]">
                      <span className="w-[28px] h-[28px] rounded-[6px] bg-[#faf5ff] text-[#7e22ce] flex items-center justify-center text-[14px] shrink-0">📍</span>
                      <span className="flex-1 text-[11.5px] text-[#334155] leading-[1.35]">Chỉ có thể tổ chức tại <strong className="font-bold">một thành phố duy nhất</strong> tại một thời điểm.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

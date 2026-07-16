import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const AirportIllustration = () => (
  <img src="/images/airport.webp" alt="Airport" className="w-full h-full object-contain" />
);

export default function AirportModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="relative w-full max-w-[580px] md:max-w-[820px] animate-card-modal-slide
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[24px] before:shadow-[0_4px_12px_rgba(0,0,0,0.1)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[24px] after:shadow-[0_4px_12px_rgba(0,0,0,0.1)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-[16px_24px] text-white flex justify-between items-start relative border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]">
            <h3 className="text-[22px] font-bold m-0 leading-[1.2] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">CHUYẾN ĐI VÒNG QUANH THẾ GIỚI</h3>
            <button className="absolute top-4 right-4 bg-[rgba(0,0,0,0.15)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)]" onClick={onClose}>✕</button>
          </div>
          
          <div className="p-[12px] md:p-[16px_20px]">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center w-full max-w-[650px] mx-auto">
              <div className="flex-none md:flex-[0_0_180px] flex flex-col items-center justify-center">
                <div className="w-[150px] md:w-full scale-90">
                  <AirportIllustration />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-[12px] p-[10px_12px] text-left relative shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
                  <div className="flex justify-between items-center border-b border-dashed border-[#cbd5e1] pb-1 mb-1.5">
                    <span className="font-extrabold text-[#0284c7] text-[11px] uppercase tracking-[1px] flex items-center gap-1">✈️ BOARDING PASS / VÉ MÁY BAY</span>
                    <span className="text-[10px] font-extrabold text-[#b45309] bg-[#fef3c7] p-[2px_6px] rounded-[4px]">VIP TICKET</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[18px] text-[#0f172a]">AIRPORT</span>
                      <span className="text-[#94a3b8] text-[14px]">➔</span>
                      <span className="font-black text-[18px] text-[#0f172a]">ANYWHERE</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-[#64748b] uppercase font-bold">Chi phí vé</div>
                      <div className="text-[15px] font-extrabold text-[#0f172a]">{formatMoneyFull(50)} $</div>
                    </div>
                  </div>
                </div>

                <div className="w-full text-left">
                  <h4 className="text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-[0.8px]">📋 Quy định chuyến bay</h4>
                  <ul className="flex flex-col gap-1.5 p-0 m-0 list-none">
                    <li className="bg-white border border-[#e2e8f0] rounded-[10px] p-[6px_10px] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[1px]">
                      <span className="w-[28px] h-[28px] rounded-[6px] bg-[#f0f9ff] text-[#0369a1] flex items-center justify-center text-[14px] shrink-0">🗺️</span>
                      <span className="flex-1 text-[11.5px] text-[#334155] leading-[1.35]">Di chuyển đến <strong className="font-bold">bất kỳ ô vuông nào</strong> chưa bị đối thủ chiếm giữ.</span>
                    </li>
                    <li className="bg-white border border-[#e2e8f0] rounded-[10px] p-[6px_10px] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[1px]">
                      <span className="w-[28px] h-[28px] rounded-[6px] bg-[#f0f9ff] text-[#0369a1] flex items-center justify-center text-[14px] shrink-0">⏰</span>
                      <span className="flex-1 text-[11.5px] text-[#334155] leading-[1.35]">Chuyến bay sẽ được khởi hành ngay ở <strong className="font-bold">lượt tiếp theo</strong> của bạn.</span>
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

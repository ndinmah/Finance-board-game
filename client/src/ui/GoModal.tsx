import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const GoIllustration = () => (
  <img src="/images/go.webp" alt="Go" className="w-full h-full object-contain" />
);

export default function GoModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="relative w-full max-w-[580px] md:max-w-[820px] animate-card-modal-slide
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[24px] before:shadow-[0_4px_12px_rgba(0,0,0,0.1)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[24px] after:shadow-[0_4px_12px_rgba(0,0,0,0.1)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-[16px_24px] text-white flex justify-between items-start relative border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
            <h3 className="text-[22px] font-bold m-0 leading-[1.2] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">TRẠM KHỞI HÀNH</h3>
            <button className="absolute top-4 right-4 bg-[rgba(0,0,0,0.15)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)]" onClick={onClose}>✕</button>
          </div>

          <div className="p-[12px] md:p-[16px_20px]">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center w-full max-w-[650px] mx-auto">
              <div className="flex-none md:flex-[0_0_180px] flex flex-col items-center justify-center">
                <div className="w-[150px] md:w-full">
                  <GoIllustration />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="bg-[#fffbeb] border border-[#fde68a] border-l-[4px] border-l-[#f59e0b] p-[8px_12px] rounded-[10px] text-left shadow-[0_4px_12px_rgba(245,158,11,0.03)]">
                  <div className="font-extrabold text-[#78350f] mb-0.5 text-[13px] flex items-center gap-1.5">
                    <span>🚀</span> Điểm xuất phát của mọi hành trình!
                  </div>
                  <div className="text-[11.5px] text-[#92400e] leading-[1.35]">
                    Đây là vạch xuất phát. Mỗi lần bạn đi ngang qua hoặc dừng lại tại đây, ngân hàng sẽ thưởng cho bạn một khoản tiền tiêu vặt.
                  </div>
                </div>

                <div className="w-full text-left mt-1">
                  <h4 className="text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-[0.8px] flex items-center gap-1.5 m-0">📋 Quyền lợi</h4>
                  <ul className="flex flex-col gap-1.5 p-0 m-0 list-none">
                    <li className="bg-white border border-[#e2e8f0] rounded-[10px] p-[6px_10px] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(148,163,184,0.05)] shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
                      <div className="w-[28px] h-[28px] rounded-[6px] bg-[#f1f5f9] flex items-center justify-center text-[14px] shrink-0">💵</div>
                      <div className="flex-1">
                        <div className="font-bold text-[#1e293b] text-[12.5px]">Thưởng đi qua</div>
                        <div className="text-[10.5px] text-[#64748b] mt-[1px] leading-[1.25]">Nhận ngay lương khi đi ngang qua (hoặc dừng lại).</div>
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#15803d] bg-[#dcfce7] p-[2px_6px] rounded-[4px]">+{formatMoneyFull(300)} $</span>
                    </li>

                    <li className="bg-white border border-[#e2e8f0] rounded-[10px] p-[6px_10px] flex items-center gap-2.5 transition-all duration-200 hover:border-[#cbd5e1] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(148,163,184,0.05)] shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
                      <div className="w-[28px] h-[28px] rounded-[6px] bg-[#f1f5f9] flex items-center justify-center text-[14px] shrink-0">🎲</div>
                      <div className="flex-1">
                        <div className="font-bold text-[#1e293b] text-[12.5px]">Dừng trúng ô</div>
                        <div className="text-[10.5px] text-[#64748b] mt-[1px] leading-[1.25]">Nhận ngẫu nhiên: Thêm lượt đi hoặc Nâng cấp từ xa!</div>
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#0f766e] bg-[#ccfbf1] p-[2px_6px] rounded-[4px]">Đặc quyền</span>
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

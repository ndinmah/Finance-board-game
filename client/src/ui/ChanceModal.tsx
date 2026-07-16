interface Props {
  onClose: () => void;
}

const ChanceIllustration = () => (
  <img src="/images/chance.webp" alt="Cơ hội" className="w-full h-full object-contain" />
);

export default function ChanceModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="relative w-full max-w-[580px] md:max-w-[820px] animate-card-modal-slide
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[24px] before:shadow-[0_4px_12px_rgba(0,0,0,0.1)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[24px] after:shadow-[0_4px_12px_rgba(0,0,0,0.1)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-[16px_24px] text-white flex justify-between items-start relative border-b border-[rgba(0,0,0,0.08)] bg-[#8b5cf6]">
            <h3 className="text-[22px] font-bold m-0 leading-[1.2] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">CƠ HỘI</h3>
            <button className="absolute top-4 right-4 bg-[rgba(0,0,0,0.15)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)]" onClick={onClose}>✕</button>
          </div>

          <div className="p-[32px_32px_40px] md:p-[50px_40px_60px] flex flex-col items-center justify-center gap-[24px] text-center flex-1 overflow-y-auto bg-gradient-to-b from-[#ffffff] to-[#fdfaf5]">
            <div className="w-[240px] h-[240px] flex items-center justify-center rounded-[20px] bg-[rgba(0,0,0,0.02)] mb-2 md:w-full md:max-w-[520px] md:h-[300px]">
              <ChanceIllustration />
            </div>
            <div className="text-[16px] md:text-[18px] text-[#4b5563] leading-[1.6] m-0 max-w-[85%]">
              Thẻ cơ hội vừa có thể giúp bạn, vừa có thể cản trở bạn trên con đường chiến thắng.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

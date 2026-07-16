
import { useGameStore } from '../store/gameStore';
import { send, getCurrentRoom } from '../net/colyseusClient';


export default function WaitingRoom() {
  const { players, myPlayerId } = useGameStore();
  const me = players.get(myPlayerId);

  const handleReady = () => send('ready');

  const playerList = Array.from(players.values());
  const allReady = playerList.length >= 2 && playerList.every(p => p.isReady);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-3 md:p-6 bg-[radial-gradient(ellipse_at_center,_#1a2e5e_0%,_#0a1226_100%)]">
      <div className="bg-[linear-gradient(160deg,_#1e2d5a,_#162040)] border-[1.5px] border-[rgba(74,144,217,0.3)] rounded-2xl md:rounded-[24px] p-6 md:p-10 w-full max-w-[480px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-slide-up">
        <h2 className="font-nunito text-[22px] md:text-[28px] font-black text-center bg-[linear-gradient(135deg,_#7ec8e3,_#4a90d9)] bg-clip-text text-transparent mb-1">🎲 Phòng Chờ</h2>
        <p className="text-center text-[#8faad4] text-sm mb-6">Chờ người chơi khác... ({playerList.length}/6)</p>
        <p className="text-center text-[#8faad4] text-sm mt-4" id="debug-room-id">Mã phòng: {getCurrentRoom()?.id || 'Unknown'}</p>

        <div className="flex flex-col gap-2.5 mb-6">
          {playerList.map(p => (
            <div key={p.id} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 bg-[rgba(255,255,255,0.04)] rounded-xl border-[1.5px] transition-colors duration-200 ${p.id === myPlayerId ? 'border-[rgba(74,144,217,0.5)]' : 'border-[rgba(74,144,217,0.15)]'}`}>
              <span className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-extrabold text-[15px] md:text-lg text-white shrink-0" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 font-semibold">{p.name}{p.id === myPlayerId ? ' (bạn)' : ''}</span>
              <span className={`text-xs py-1 px-2.5 rounded-full font-semibold ${p.isReady ? 'bg-[rgba(46,204,113,0.2)] text-[#2ecc71]' : 'bg-[rgba(255,255,255,0.07)] text-[#8faad4]'}`}>
                {p.isReady ? '✅ Sẵn sàng' : '⏳ Chờ...'}
              </span>
            </div>
          ))}

          {Array.from({ length: Math.max(0, 2 - playerList.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 bg-[rgba(255,255,255,0.04)] rounded-xl border-[1.5px] border-[rgba(74,144,217,0.15)] opacity-40">
              <span className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-extrabold text-[15px] md:text-lg text-white shrink-0 bg-[rgba(255,255,255,0.1)]">?</span>
              <span className="flex-1 font-semibold">Đang chờ...</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {!me?.isReady && (
            <button id="btn-ready" className="btn-3d btn-3d-green" onClick={handleReady} style={{ width: '100%' }}>
              ✅ Sẵn Sàng!
            </button>
          )}
          {playerList.length < 6 && (
            <button className="btn-3d btn-3d-yellow" onClick={() => send('addBot')} style={{ width: '100%', marginTop: '10px' }}>
              Thêm Bot
            </button>
          )}
        </div>
        {me?.isReady && !allReady && (
          <p className="text-center text-[#8faad4] text-sm mt-4">Đang chờ người chơi khác sẵn sàng...</p>
        )}
        {allReady && (
          <p className="text-center text-sm mt-4 text-[#2ecc71] font-bold animate-pulse">🚀 Bắt đầu ngay...</p>
        )}
      </div>
    </div>
  );
}

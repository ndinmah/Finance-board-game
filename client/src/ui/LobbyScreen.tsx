import { useState } from 'react';
import { createRoom, joinRoom } from '../net/colyseusClient';
import { useGameStore } from '../store/gameStore';


export default function LobbyScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [loading, setLoading] = useState(false);
  const error = useGameStore(s => s.error);
  const setError = useGameStore(s => s.setError);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Nhập tên trước!'); return; }
    setLoading(true);
    try { await createRoom(name.trim()); }
    catch (e: any) { setError(e.message || 'Không thể tạo phòng'); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!name.trim())    { setError('Nhập tên trước!'); return; }
    if (!/^\d{6}$/.test(roomCode)) { setError('Mã phòng phải gồm đúng 6 chữ số!'); return; }
    setLoading(true);
    try { await joinRoom(roomCode, name.trim()); }
    catch (e: any) { setError(e.message || 'Không tìm thấy phòng'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-3 md:p-6 bg-[radial-gradient(ellipse_at_30%_40%,_#1e2d5a_0%,_#080e1e_100%)]">
      {/* Background neon grid glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1.5px,_transparent_1.5px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1.5px,_transparent_1.5px)] bg-[size:3rem_3rem] pointer-events-none opacity-50" />
      
      <div className="relative bg-gradient-to-br from-[#1e2d5a] to-[#0f172e] border-[1.5px] border-[rgba(74,144,217,0.35)] rounded-[2rem] p-8 md:p-10 w-full max-w-[29.3333rem] shadow-[0_2.5rem_5rem_rgba(0,0,0,0.65),_0_0_5rem_rgba(74,144,217,0.15),_inset_0_2px_4px_rgba(255,255,255,0.05)] animate-slide-up overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-[10rem] -left-[10rem] w-[20rem] h-[20rem] bg-[#0284c7] rounded-full blur-[8rem] opacity-25 pointer-events-none" />
        <div className="absolute -bottom-[10rem] -right-[10rem] w-[20rem] h-[20rem] bg-[#f5c518] rounded-full blur-[8rem] opacity-20 pointer-events-none" />
        
        {/* Logo */}
        <div className="text-center mb-8 relative z-10">
          <span className="text-[3.2rem] md:text-[4rem] block animate-bounce-alt drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">🎲</span>
          <h1 className="font-nunito text-[2rem] md:text-[2.6667rem] font-black bg-gradient-to-r from-[#7ec8e3] via-[#4a90d9] to-[#f5c518] bg-clip-text text-transparent mt-2 mb-1 drop-shadow-[0_4px_12px_rgba(74,144,217,0.4)]">
            Webopoly
          </h1>
          <p className="text-[#8faad4] text-[0.8667rem] font-bold tracking-[0.05em] uppercase">Board game thời đại mới</p>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-2 mb-5 relative z-10">
          <label className="font-bold text-[0.7667rem] text-[#8faad4] tracking-[0.08em] uppercase flex items-center gap-1.5">
            <span>👤</span> Tên hiển thị
          </label>
          <input
            id="player-name"
            className="w-full bg-[#0d152b] border-[1.5px] border-[rgba(74,144,217,0.3)] focus:border-[#4a90d9] focus:shadow-[0_0_12px_rgba(74,144,217,0.3)] rounded-[0.8rem] px-[1rem] py-[0.8rem] text-white text-[1rem] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 outline-none placeholder-[#58739d]"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(null); }}
            placeholder="Nhập tên của bạn..."
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        {mode === 'menu' && (
          <div className="flex flex-col gap-3 mt-2 relative z-10">
            <button id="btn-create" className="btn-3d btn-3d-lg w-full bg-gradient-to-r from-[#4a90d9] to-[#2176ae] text-white font-black tracking-[0.05em] shadow-[0_8px_0_#1a5d8c,0_12px_24px_rgba(74,144,217,0.3)] active:translate-y-[8px] active:shadow-none transition-all duration-100" onClick={handleCreate} disabled={loading}>
              {loading ? '⏳ ĐANG TẠO...' : '🏠 TẠO PHÒNG MỚI'}
            </button>
            <button id="btn-show-join" className="btn-secondary w-full border-[1.5px] border-[#4a90d9] text-[#7ec8e3] font-bold py-[0.8rem] rounded-[2rem] hover:bg-[rgba(74,144,217,0.08)] active:translate-y-[2px]" onClick={() => setMode('join')}>
              🔑 VÀO PHÒNG BẰNG MÃ
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex flex-col gap-2 mb-4">
              <label className="font-bold text-[0.7667rem] text-[#8faad4] tracking-[0.08em] uppercase flex items-center gap-1.5">
                <span>🔑</span> Mã phòng
              </label>
              <input
                id="room-code"
                className="w-full bg-[#0d152b] border-[1.5px] border-[rgba(74,144,217,0.3)] focus:border-[#4a90d9] focus:shadow-[0_0_12px_rgba(74,144,217,0.3)] rounded-[0.8rem] px-[1rem] py-[0.8rem] text-center text-white text-[1.2rem] font-black uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 outline-none placeholder-[#58739d]"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={roomCode}
                onChange={e => { setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                placeholder="000000"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="flex flex-col gap-3 mt-2">
              <button id="btn-join" className="btn-3d btn-3d-lg w-full bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-black tracking-[0.05em] shadow-[0_8px_0_#047857,0_12px_24px_rgba(16,185,129,0.3)] active:translate-y-[8px] active:shadow-none transition-all duration-100" onClick={handleJoin} disabled={loading}>
                {loading ? '⏳ ĐANG VÀO...' : '🚀 VÀO PHÒNG'}
              </button>
              <button id="btn-back" className="btn-ghost w-full text-[#8faad4] font-bold hover:text-white mt-1 active:scale-98" onClick={() => setMode('menu')}>
                ← QUAY LẠI
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] rounded-[0.8rem] py-3 px-4 text-[#ff8080] text-[0.8667rem] font-bold mt-4 animate-shake relative z-10 flex items-center gap-2" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="flex justify-center gap-2.5 mt-8 pt-5 border-t border-[rgba(74,144,217,0.12)] text-[#8faad4] text-[0.7333rem] font-extrabold relative z-10">
          <span className="bg-[rgba(74,144,217,0.1)] px-3 py-1.5 rounded-full border border-[rgba(74,144,217,0.15)] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">🎮 2–6 NGƯỜI CHƠI</span>
          <span className="bg-[rgba(74,144,217,0.1)] px-3 py-1.5 rounded-full border border-[rgba(74,144,217,0.15)] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">⚡ REALTIME</span>
          <span className="bg-[rgba(74,144,217,0.1)] px-3 py-1.5 rounded-full border border-[rgba(74,144,217,0.15)] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">🏙️ 32 Ô BẢN ĐỒ</span>
        </div>
      </div>
    </div>
  );
}

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
    if (!roomCode.trim()) { setError('Nhập mã phòng!'); return; }
    setLoading(true);
    try { await joinRoom(roomCode.trim(), name.trim()); }
    catch (e: any) { setError(e.message || 'Không tìm thấy phòng'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-3 md:p-6 bg-[radial-gradient(ellipse_at_30%_40%,_#1a2e5e_0%,_#0a1226_100%)]">
      <div className="bg-[linear-gradient(160deg,_#1e2d5a_0%,_#162040_100%)] border-[1.5px] border-[rgba(74,144,217,0.3)] rounded-2xl md:rounded-[24px] p-6 md:p-10 w-full max-w-[440px] shadow-[0_24px_64px_rgba(0,0,0,0.6),_0_0_0_1px_rgba(255,255,255,0.05)] animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-[44px] md:text-[56px] block animate-bounce-alt">🎲</span>
          <h1 className="font-nunito text-[28px] md:text-[36px] font-black bg-[linear-gradient(135deg,_#7ec8e3,_#4a90d9,_#f5c518)] bg-clip-text text-transparent mt-2 mb-1">Webopoly</h1>
          <p className="text-text2 text-sm">Board game thời đại mới</p>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="font-semibold text-[13px] text-text2 tracking-wide uppercase">Tên hiển thị</label>
          <input
            id="player-name"
            className="w-full"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(null); }}
            placeholder="Nhập tên của bạn..."
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        {mode === 'menu' && (
          <div className="flex flex-col gap-2.5 mt-2">
            <button id="btn-create" className="btn-primary w-full" onClick={handleCreate} disabled={loading}>
              {loading ? '⏳ Đang tạo...' : '🏠 Tạo phòng mới'}
            </button>
            <button id="btn-show-join" className="btn-secondary w-full" onClick={() => setMode('join')}>
              🔑 Vào phòng bằng mã
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="font-semibold text-[13px] text-text2 tracking-wide uppercase">Mã phòng</label>
              <input
                id="room-code"
                className="w-full"
                type="text"
                value={roomCode}
                onChange={e => { setRoomCode(e.target.value); setError(null); }}
                placeholder="XXXXXX"
                maxLength={12}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="flex flex-col gap-2.5 mt-2">
              <button id="btn-join" className="btn-primary w-full" onClick={handleJoin} disabled={loading}>
                {loading ? '⏳ Đang vào...' : '🚀 Vào phòng'}
              </button>
              <button id="btn-back" className="btn-ghost w-full" onClick={() => setMode('menu')}>
                ← Quay lại
              </button>
            </div>
          </div>
        )}

        {error && <div className="bg-[rgba(231,76,60,0.15)] border border-[rgba(231,76,60,0.4)] rounded-lg py-2.5 px-3.5 text-[#ff8080] text-[13px] mt-3" role="alert">⚠️ {error}</div>}

        <div className="flex justify-center gap-4 mt-6 pt-5 border-t border-[rgba(74,144,217,0.15)] text-text2 text-xs">
          <span>🎮 2–6 người chơi</span>
          <span>⚡ Realtime</span>
          <span>🏙️ 32 ô bản đồ</span>
        </div>
      </div>
    </div>
  );
}

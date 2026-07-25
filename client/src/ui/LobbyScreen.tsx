import { useState } from 'react';
import { createRoom, joinRoom } from '../net/colyseusClient';
import { useGameStore } from '../store/gameStore';
import './LobbyFlow.css';

function DiceLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="5" y="5" width="38" height="38" rx="12" />
      <circle cx="16" cy="16" r="3" />
      <circle cx="32" cy="16" r="3" />
      <circle cx="24" cy="24" r="3" />
      <circle cx="16" cy="32" r="3" />
      <circle cx="32" cy="32" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.8-4 3.2-6 7.5-6s6.7 2 7.5 6" />
    </svg>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h8M17 12v3M20 12v2" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}

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
    if (!name.trim()) { setError('Nhập tên trước!'); return; }
    if (!/^\d{6}$/.test(roomCode)) { setError('Mã phòng phải gồm đúng 6 chữ số!'); return; }
    setLoading(true);
    try { await joinRoom(roomCode, name.trim()); }
    catch (e: any) { setError(e.message || 'Không tìm thấy phòng'); }
    finally { setLoading(false); }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (mode === 'menu') void handleCreate();
    else void handleJoin();
  };

  return (
    <main className="lobby-flow-page">
      <div className="lobby-flow-shell lobby-flow-shell--entry">
        <section className="lobby-brand-panel" aria-labelledby="lobby-title">
          <div className="lobby-brand-lockup">
            <span className="lobby-logo"><DiceLogo /></span>
            <span className="lobby-kicker">Multiplayer board game</span>
          </div>

          <div className="lobby-brand-copy">
            <h1 id="lobby-title">Webopoly</h1>
            <p>Xây thành phố, làm chủ bản đồ và trở thành nhà tài phiệt cuối cùng.</p>
          </div>

          <div className="lobby-feature-grid" aria-label="Thông tin trò chơi">
            <div><strong>2–8</strong><span>Người chơi</span></div>
            <div><strong>32</strong><span>Ô bản đồ</span></div>
            <div><strong>Live</strong><span>Thời gian thực</span></div>
          </div>
        </section>

        <section className="lobby-action-panel" aria-labelledby="lobby-action-title">
          <div className="lobby-action-heading">
            <span className="lobby-step">01</span>
            <div>
              <h2 id="lobby-action-title">{mode === 'menu' ? 'Bắt đầu cuộc chơi' : 'Vào phòng bạn bè'}</h2>
              <p>{mode === 'menu' ? 'Tạo bàn mới hoặc tham gia bằng mã phòng.' : 'Nhập mã 6 số được chủ phòng chia sẻ.'}</p>
            </div>
          </div>

          <form className="lobby-form" onSubmit={handleSubmit}>
            <div className="lobby-avatar-name-row">
              <div className="lobby-avatar-preview" aria-hidden="true">
                <img
                  src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name || 'guest')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                  alt=""
                  width="56"
                  height="56"
                />
              </div>
              <label className="lobby-field" htmlFor="player-name" style={{ flex: 1 }}>
                <span><UserIcon /> Tên hiển thị</span>
                <input
                  id="player-name"
                  type="text"
                  value={name}
                  onChange={event => { setName(event.target.value); setError(null); }}
                  placeholder="Tên của bạn"
                  maxLength={20}
                  autoComplete="nickname"
                  autoFocus
                />
              </label>
            </div>

            {mode === 'join' ? (
              <label className="lobby-field" htmlFor="room-code">
                <span><KeyIcon /> Mã phòng</span>
                <input
                  id="room-code"
                  className="lobby-code-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={roomCode}
                  onChange={event => { setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </label>
            ) : null}

            {error ? <div className="lobby-inline-error" role="alert" aria-live="polite">{error}</div> : null}

            <div className="lobby-actions">
              <button className="lobby-primary-button" id={mode === 'menu' ? 'btn-create' : 'btn-join'} type="submit" disabled={loading}>
                {mode === 'menu' ? <PlusIcon /> : <KeyIcon />}
                <span>{loading ? 'Đang kết nối…' : mode === 'menu' ? 'Tạo phòng mới' : 'Vào phòng'}</span>
              </button>

              {mode === 'menu' ? (
                <button className="lobby-secondary-button" id="btn-show-join" type="button" onClick={() => { setMode('join'); setError(null); }}>
                  <KeyIcon /><span>Nhập mã phòng</span>
                </button>
              ) : (
                <button className="lobby-secondary-button" id="btn-back" type="button" onClick={() => { setMode('menu'); setError(null); }}>
                  <ArrowLeftIcon /><span>Quay lại</span>
                </button>
              )}
            </div>
          </form>

          <p className="lobby-security-note"><span aria-hidden="true" /> Không cần tài khoản · Kết nối trực tiếp</p>
        </section>
      </div>
    </main>
  );
}

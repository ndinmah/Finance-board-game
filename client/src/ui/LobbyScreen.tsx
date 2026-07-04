import React, { useState } from 'react';
import { createRoom, joinRoom } from '../net/colyseusClient';
import { useGameStore } from '../store/gameStore';
import './LobbyScreen.css';

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
    <div className="lobby-overlay">
      <div className="lobby-card">
        {/* Logo */}
        <div className="lobby-logo">
          <span className="logo-icon">🎲</span>
          <h1 className="logo-title">Webopoly</h1>
          <p className="logo-sub">Board game thời đại mới</p>
        </div>

        {/* Name input */}
        <div className="lobby-field">
          <label>Tên hiển thị</label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(null); }}
            placeholder="Nhập tên của bạn..."
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        {mode === 'menu' && (
          <div className="lobby-actions">
            <button id="btn-create" className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? '⏳ Đang tạo...' : '🏠 Tạo phòng mới'}
            </button>
            <button id="btn-show-join" className="btn-secondary" onClick={() => setMode('join')}>
              🔑 Vào phòng bằng mã
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="lobby-join-section">
            <div className="lobby-field">
              <label>Mã phòng</label>
              <input
                id="room-code"
                type="text"
                value={roomCode}
                onChange={e => { setRoomCode(e.target.value); setError(null); }}
                placeholder="XXXXXX"
                maxLength={12}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="lobby-actions">
              <button id="btn-join" className="btn-primary" onClick={handleJoin} disabled={loading}>
                {loading ? '⏳ Đang vào...' : '🚀 Vào phòng'}
              </button>
              <button id="btn-back" className="btn-ghost" onClick={() => setMode('menu')}>
                ← Quay lại
              </button>
            </div>
          </div>
        )}

        {error && <div className="lobby-error" role="alert">⚠️ {error}</div>}

        <div className="lobby-info">
          <span>🎮 2–6 người chơi</span>
          <span>⚡ Realtime</span>
          <span>🏙️ 32 ô bản đồ</span>
        </div>
      </div>
    </div>
  );
}

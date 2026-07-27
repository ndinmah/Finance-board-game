import { useState } from 'react';
import { createRoom, joinRoom } from '../net/colyseusClient';
import { useGameStore } from '../store/gameStore';
import PlayerAvatar from './PlayerAvatar';

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
    <main className="lobby-flow-page [--lobby-primary:var(--color-brand-primary)] [--lobby-primary-soft:var(--color-brand-primary-soft)] [--lobby-primary-deep:var(--color-brand-primary-deep)] [--lobby-surface:var(--color-surface-raised)] [--lobby-surface-strong:var(--color-surface-canvas)] [position:fixed] [inset:0] [z-index:0] [display:grid] [place-items:center] [overflow:auto] [overscroll-behavior:contain] [padding:max(1rem,_env(safe-area-inset-top))_max(1rem,_env(safe-area-inset-right))_max(1rem,_env(safe-area-inset-bottom))_max(1rem,_env(safe-area-inset-left))] [background:radial-gradient(circle_at_14%_20%,_rgba(75,_213,_255,_0.2),_transparent_28rem),_radial-gradient(circle_at_88%_82%,_rgba(75,_213,_255,_0.11),_transparent_26rem),_linear-gradient(145deg,_var(--color-surface-canvas)_0%,_#082b3c_52%,_#041720_100%)] [isolation:isolate] before:[position:absolute] before:[inset:0] before:[z-index:-2] before:[content:''] before:[opacity:0.22] before:[background-image:linear-gradient(rgba(255,_255,_255,_0.04)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,_255,_255,_0.04)_1px,_transparent_1px)] before:[background-size:3.2rem_3.2rem] before:[mask-image:linear-gradient(to_bottom,_black,_transparent_90%)] after:[position:absolute] after:[width:min(34rem,_70vw)] after:[aspect-ratio:1] after:[top:-24rem] after:[right:-8rem] after:[z-index:-1] after:[border:1px_solid_rgba(75,_213,_255,_0.24)] after:[border-radius:50%] after:[content:''] after:[box-shadow:0_0_0_4rem_rgba(75,_213,_255,_0.028),_0_0_0_8rem_rgba(75,_213,_255,_0.018)] max-[760px]:portrait:[display:block] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:max(0.65rem,_env(safe-area-inset-top))_max(1.25rem,_env(safe-area-inset-right))_max(0.65rem,_env(safe-area-inset-bottom))_max(1.25rem,_env(safe-area-inset-left))]">
      <div className="lobby-flow-shell [width:min(70rem,_100%)] [min-height:min(42rem,_calc(100dvh_-_2rem))] [display:grid] [overflow:hidden] [border:1px_solid_rgba(75,_213,_255,_0.2)] [border-radius:2rem] [background:rgba(4,_24,_35,_0.86)] [box-shadow:0_2rem_6rem_rgba(0,_0,_0,_0.52),_inset_0_1px_rgba(255,_255,_255,_0.05)] [backdrop-filter:blur(1.4rem)] animate-lobby-shell-enter max-[760px]:portrait:[min-height:100%] max-[760px]:portrait:[grid-template-columns:1fr] [@media(max-height:480px)_and_(orientation:landscape)]:[width:min(60rem,_100%)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:0] [@media(max-height:480px)_and_(orientation:landscape)]:[height:calc(100dvh_-_1.3rem)] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:1.35rem] motion-reduce:[animation:none] lobby-flow-shell--entry [grid-template-columns:minmax(0,_1.08fr)_minmax(24rem,_0.92fr)] [@media(max-height:480px)_and_(orientation:landscape)]:[grid-template-columns:minmax(0,_0.88fr)_minmax(26rem,_1.12fr)]">
        <section className="lobby-brand-panel [position:relative] [display:flex] [flex-direction:column] [justify-content:space-between] [min-width:0] [padding:clamp(2rem,_5vw,_4.5rem)] [overflow:hidden] [background:linear-gradient(135deg,_rgba(13,_126,_162,_0.94),_rgba(5,_51,_72,_0.97)),_#06344a] [&::after]:[position:absolute] [&::after]:[width:25rem] [&::after]:[aspect-ratio:1] [&::after]:[right:-8rem] [&::after]:[bottom:-13rem] [&::after]:[border:1px_solid_rgba(75,_213,_255,_0.34)] [&::after]:[border-radius:50%] [&::after]:[content:''] [&::after]:[box-shadow:0_0_0_4rem_rgba(75,_213,_255,_0.045)] max-[760px]:portrait:[gap:2rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:1.4rem_1.6rem] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.9rem]" aria-labelledby="lobby-title">
          <div className="lobby-brand-lockup [position:relative] [z-index:1] [display:flex] [align-items:center] [gap:0.9rem]">
            <span className="lobby-logo [width:3.4rem] [height:3.4rem] [display:grid] [flex:none] [place-items:center] [border:1px_solid_rgba(255,_255,_255,_0.36)] [border-radius:1.1rem] [color:#06344a] [background:linear-gradient(145deg,_#d8f7ff,_var(--lobby-primary))] [box-shadow:0_0.8rem_2rem_rgba(75,_213,_255,_0.24)] [&_svg]:[width:2.2rem] [&_svg]:[fill:currentColor] [&_svg_rect]:[fill:none] [&_svg_rect]:[stroke:currentColor] [&_svg_rect]:[stroke-width:2.5] [@media(max-height:480px)_and_(orientation:landscape)]:[width:2.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[height:2.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:0.85rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_svg]:[width:1.75rem]"><DiceLogo /></span>
            <span className="lobby-kicker [color:#d8f7ff] [font-size:0.72rem] [font-weight:800] [letter-spacing:0.15em] [text-transform:uppercase]">Multiplayer board game</span>
          </div>

          <div className="lobby-brand-copy [position:relative] [z-index:1] [max-width:33rem] [&_h1]:[margin-bottom:0.9rem] [&_h1]:[color:#ffffff] [&_h1]:[font-family:'Nunito',_sans-serif] [&_h1]:[font-size:clamp(3.3rem,_6vw,_5.8rem)] [&_h1]:[font-weight:900] [&_h1]:[letter-spacing:-0.065em] [&_h1]:[line-height:0.88] [&_h1::after]:[display:inline-block] [&_h1::after]:[width:0.58rem] [&_h1::after]:[height:0.58rem] [&_h1::after]:[margin-left:0.35rem] [&_h1::after]:[border-radius:50%] [&_h1::after]:[background:var(--lobby-primary)] [&_h1::after]:[content:''] [&_p]:[max-width:28rem] [&_p]:[color:#c4eaf4] [&_p]:[font-size:1.05rem] [&_p]:[line-height:1.65] max-[760px]:portrait:[&_h1]:[font-size:3.5rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_h1]:[margin-bottom:0.5rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_h1]:[font-size:3.75rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_p]:[font-size:0.82rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_p]:[line-height:1.45]">
            <h1 id="lobby-title">Webopoly</h1>
            <p>Xây thành phố, làm chủ bản đồ và trở thành nhà tài phiệt cuối cùng.</p>
          </div>

          <div className="lobby-feature-grid [position:relative] [z-index:1] [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.8rem] [&_>_div]:[min-width:0] [&_>_div]:[padding:1rem] [&_>_div]:[border:1px_solid_rgba(255,_255,_255,_0.11)] [&_>_div]:[border-radius:1rem] [&_>_div]:[background:rgba(255,_255,_255,_0.055)] [&_strong]:[display:block] [&_span]:[display:block] [&_strong]:[color:var(--lobby-primary-soft)] [&_strong]:[font-family:'Nunito',_sans-serif] [&_strong]:[font-size:1.25rem] [&_strong]:[font-weight:900] [&_span]:[margin-top:0.1rem] [&_span]:[overflow:hidden] [&_span]:[color:#a9d5e1] [&_span]:[font-size:0.67rem] [&_span]:[font-weight:700] [&_span]:[text-overflow:ellipsis] [&_span]:[white-space:nowrap] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.55rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_>_div]:[padding:0.65rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_>_div]:[border-radius:0.75rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_strong]:[font-size:1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_span]:[font-size:0.56rem]" aria-label="Thông tin trò chơi">
            <div><strong>2–8</strong><span>Người chơi</span></div>
            <div><strong>32</strong><span>Ô bản đồ</span></div>
            <div><strong>Live</strong><span>Thời gian thực</span></div>
          </div>
        </section>

        <section className="lobby-action-panel [min-width:0] [display:flex] [flex-direction:column] [justify-content:center] [padding:clamp(2rem,_5vw,_4rem)] [background:linear-gradient(rgba(255,_255,_255,_0.018),_transparent),_rgba(4,_20,_31,_0.88)] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:1.4rem_1.6rem]" aria-labelledby="lobby-action-title">
          <div className="lobby-action-heading [display:flex] [align-items:flex-start] [gap:1rem] [margin-bottom:1.8rem] [&_h2]:[color:#f7fffb] [&_h2]:[font-family:'Nunito',_sans-serif] [&_h2]:[font-size:1.72rem] [&_h2]:[font-weight:900] [&_h2]:[line-height:1.12] [&_p]:[margin-top:0.35rem] [&_p]:[color:#89b6c3] [&_p]:[font-size:0.83rem] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[&_h2]:[font-size:1.4rem]">
            <span className="lobby-step [display:grid] [width:2.2rem] [height:2.2rem] [flex:none] [place-items:center] [border:1px_solid_rgba(75,_213,_255,_0.4)] [border-radius:0.75rem] [color:var(--lobby-primary)] [background:rgba(75,_213,_255,_0.1)] [font-size:0.72rem] [font-weight:900]">01</span>
            <div>
              <h2 id="lobby-action-title">{mode === 'menu' ? 'Bắt đầu cuộc chơi' : 'Vào phòng bạn bè'}</h2>
              <p>{mode === 'menu' ? 'Tạo bàn mới hoặc tham gia bằng mã phòng.' : 'Nhập mã 6 số được chủ phòng chia sẻ.'}</p>
            </div>
          </div>

          <form className="lobby-form [display:flex] [flex-direction:column] [gap:1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.7rem]" onSubmit={handleSubmit}>
            <div className="lobby-avatar-name-row [display:flex] [align-items:flex-end] [gap:0.75rem]">
              <PlayerAvatar name={name || 'guest'} className="lobby-avatar-preview [flex:none] [width:3.5rem] [height:3.5rem] [overflow:hidden] [border:1px_solid_rgba(75,_213,_255,_0.3)] [border-radius:0.9rem] [background:var(--avatar-color,_var(--lobby-primary))] [display:grid] [place-items:center] [transition:border-color_180ms_ease] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[display:block]" loading="eager" />
              <label className="lobby-field [display:flex] [flex-direction:column] [gap:0.45rem] [&_>_span]:[display:flex] [&_>_span]:[align-items:center] [&_>_span]:[gap:0.45rem] [&_>_span]:[color:#b0d5df] [&_>_span]:[font-size:0.7rem] [&_>_span]:[font-weight:800] [&_>_span]:[letter-spacing:0.08em] [&_>_span]:[text-transform:uppercase] [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [&_input]:[width:100%] [&_input]:[min-height:max(3.25rem,_44px)] [&_input]:[border:1px_solid_rgba(75,_213,_255,_0.2)] [&_input]:[border-radius:0.9rem] [&_input]:[padding:0.75rem_1rem] [&_input]:[color:#f5fffb] [&_input]:[background:rgba(2,_16,_25,_0.76)] [&_input]:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.025)] [&_input]:[font-size:0.98rem] [&_input]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_input:hover]:[border-color:rgba(75,_213,_255,_0.42)] [&_input:focus]:[border-color:var(--lobby-primary)] [&_input:focus]:[background:rgba(3,_26,_39,_0.92)] [&_input:focus]:[box-shadow:0_0_0_3px_rgba(75,_213,_255,_0.17)] [&_input:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&_input:focus-visible]:[outline-offset:2px] [@media(max-height:480px)_and_(orientation:landscape)]:[&_input]:[min-height:max(2.95rem,_44px)]" htmlFor="player-name" style={{ flex: 1 }}>
                <span><UserIcon /> Tên hiển thị</span>
                <input
 className="font-inter bg-[rgba(255,255,255,0.05)] border-[1.5px_solid_var(--border)] rounded-[0.5333rem] text-[var(--text)] px-[0.9333rem] py-[0.6667rem] text-[1rem] outline-none [transition:border-color_0.15s] focus:[border-color:var(--accent)] placeholder:text-[var(--text2)]"                  id="player-name"
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
              <label className="lobby-field [display:flex] [flex-direction:column] [gap:0.45rem] [&_>_span]:[display:flex] [&_>_span]:[align-items:center] [&_>_span]:[gap:0.45rem] [&_>_span]:[color:#b0d5df] [&_>_span]:[font-size:0.7rem] [&_>_span]:[font-weight:800] [&_>_span]:[letter-spacing:0.08em] [&_>_span]:[text-transform:uppercase] [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [&_input]:[width:100%] [&_input]:[min-height:max(3.25rem,_44px)] [&_input]:[border:1px_solid_rgba(75,_213,_255,_0.2)] [&_input]:[border-radius:0.9rem] [&_input]:[padding:0.75rem_1rem] [&_input]:[color:#f5fffb] [&_input]:[background:rgba(2,_16,_25,_0.76)] [&_input]:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.025)] [&_input]:[font-size:0.98rem] [&_input]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_input:hover]:[border-color:rgba(75,_213,_255,_0.42)] [&_input:focus]:[border-color:var(--lobby-primary)] [&_input:focus]:[background:rgba(3,_26,_39,_0.92)] [&_input:focus]:[box-shadow:0_0_0_3px_rgba(75,_213,_255,_0.17)] [&_input:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&_input:focus-visible]:[outline-offset:2px] [@media(max-height:480px)_and_(orientation:landscape)]:[&_input]:[min-height:max(2.95rem,_44px)]" htmlFor="room-code">
                <span><KeyIcon /> Mã phòng</span>
                <input
                  id="room-code"
                  className="font-inter bg-[rgba(255,255,255,0.05)] border-[1.5px_solid_var(--border)] rounded-[0.5333rem] text-[var(--text)] px-[0.9333rem] py-[0.6667rem] text-[1rem] outline-none [transition:border-color_0.15s] focus:[border-color:var(--accent)] placeholder:text-[var(--text2)] lobby-code-input ![font-family:'Nunito',_sans-serif] ![font-size:1.25rem] [font-weight:900] [letter-spacing:0.32em] [text-align:center]"
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

            {error ? <div className="lobby-inline-error [padding:0.7rem_0.85rem] [border:1px_solid_rgba(248,_113,_113,_0.3)] [border-radius:0.75rem] [color:#fecaca] [background:rgba(127,_29,_29,_0.2)] [font-size:0.75rem] [font-weight:700]" role="alert" aria-live="polite">{error}</div> : null}

            <div className="lobby-actions [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:0.75rem]">
              <button className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-primary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [color:#052332] [background:linear-gradient(145deg,_var(--color-brand-primary-soft),_var(--lobby-primary))] [box-shadow:0_0.7rem_1.6rem_rgba(75,_213,_255,_0.2)] [&:hover:not(:disabled)]:[filter:brightness(1.06)] [&:hover:not(:disabled)]:[box-shadow:0_0.8rem_2rem_rgba(75,_213,_255,_0.3)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none]" id={mode === 'menu' ? 'btn-create' : 'btn-join'} type="submit" disabled={loading}>
                {mode === 'menu' ? <PlusIcon /> : <KeyIcon />}
                <span>{loading ? 'Đang kết nối…' : mode === 'menu' ? 'Tạo phòng mới' : 'Vào phòng'}</span>
              </button>

              {mode === 'menu' ? (
                <button className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-secondary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [border:1px_solid_rgba(75,_213,_255,_0.25)] [color:#d8f7ff] [background:rgba(255,_255,_255,_0.045)] [&:hover:not(:disabled)]:[border-color:rgba(75,_213,_255,_0.52)] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.075)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none]" id="btn-show-join" type="button" onClick={() => { setMode('join'); setError(null); }}>
                  <KeyIcon /><span>Nhập mã phòng</span>
                </button>
              ) : (
                <button className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed lobby-secondary-button [&_svg]:[width:1.2rem] [&_svg]:[height:1.2rem] [&_svg]:[fill:none] [&_svg]:[stroke:currentColor] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2] [min-height:max(3.25rem,_44px)] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.55rem] [border-radius:0.9rem] [padding:0.75rem_1rem] [font-size:0.78rem] [font-weight:900] [letter-spacing:0.025em] [text-transform:uppercase] [border:1px_solid_rgba(75,_213,_255,_0.25)] [color:#d8f7ff] [background:rgba(255,_255,_255,_0.045)] [&:hover:not(:disabled)]:[border-color:rgba(75,_213,_255,_0.52)] [&:hover:not(:disabled)]:[background:rgba(255,_255,_255,_0.075)] [&:focus-visible]:[outline:3px_solid_rgba(75,_213,_255,_0.48)] [&:focus-visible]:[outline-offset:2px] [&:active:not(:disabled)]:[transform:scale(0.98)] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:max(2.95rem,_44px)] motion-reduce:[transition:none]" id="btn-back" type="button" onClick={() => { setMode('menu'); setError(null); }}>
                  <ArrowLeftIcon /><span>Quay lại</span>
                </button>
              )}
            </div>
          </form>

          <p className="lobby-security-note [display:flex] [align-items:center] [justify-content:center] [gap:0.45rem] [margin-top:1.2rem] [color:#779faa] [font-size:0.68rem] [text-align:center] [&_>_span]:[width:0.42rem] [&_>_span]:[height:0.42rem] [&_>_span]:[border-radius:50%] [&_>_span]:[background:var(--lobby-primary)] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(75,_213,_255,_0.8)] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-top:0.75rem]"><span aria-hidden="true" /> Không cần tài khoản · Kết nối trực tiếp</p>
        </section>
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const EVENT_TONES: Record<string, string> = {
  bankrupt: 'is-danger',
  jail_enter: 'is-danger',
  buy: 'is-success',
  upgrade: 'is-success',
  rent: 'is-warning',
  game_over: 'is-highlight',
};
const SHORT_LANDSCAPE_QUERY = '(max-height: 480px) and (orientation: landscape)';

function EventGlyph({ type }: { type: string }) {
  const isMoney = ['rent', 'buy', 'go_salary', 'tax', 'penalty'].includes(type);
  const isAlert = ['bankrupt', 'jail_enter', 'disconnect'].includes(type);
  const isWin = type === 'game_over';
  return (
    <span className="event-log-glyph [width:1.8rem] [height:1.8rem] [flex:0_0_auto] [display:grid] [place-items:center] [border:1px_solid_rgba(75,_213,_255,_0.2)] [border-radius:0.58rem] [background:rgba(75,_213,_255,_0.12)] [color:var(--game-chrome-primary)] [&_svg]:[width:1rem] [&_svg]:[height:1rem]">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {isMoney ? <><circle cx="12" cy="12" r="8" /><path d="M15 9.5c-.6-.7-1.6-1-2.8-1-1.5 0-2.7.7-2.7 1.8 0 2.8 5.2 1.2 5.2 3.8 0 1.1-1.1 1.9-2.8 1.9-1.3 0-2.4-.4-3.1-1.2M12 6.5v11" /></> : null}
        {isAlert ? <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></> : null}
        {isWin ? <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v1a4 4 0 0 0 4 4m7-5h3v1a4 4 0 0 1-4 4m-3 1v4m-3 3h6" /></> : null}
        {!isMoney && !isAlert && !isWin ? <><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2m3-9v4h-4" /></> : null}
      </svg>
    </span>
  );
}

export default function EventLog() {
  const events = useGameStore(s => s.events);
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(SHORT_LANDSCAPE_QUERY).matches);
  const [announcement, setAnnouncement] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestEvent = events.at(-1);
  const latestEventKey = latestEvent
    ? `${latestEvent.timestamp}-${latestEvent.type}-${latestEvent.playerId}-${latestEvent.tileId}-${latestEvent.message}`
    : '';
  const announcedEventKeyRef = useRef(latestEventKey);

  useEffect(() => {
    const shortLandscape = window.matchMedia(SHORT_LANDSCAPE_QUERY);
    const collapseForLandscape = (event: MediaQueryListEvent) => {
      if (event.matches) setCollapsed(true);
    };
    shortLandscape.addEventListener('change', collapseForLandscape);
    return () => shortLandscape.removeEventListener('change', collapseForLandscape);
  }, []);

  useEffect(() => {
    if (collapsed) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [events, collapsed]);

  useEffect(() => {
    if (!latestEvent || announcedEventKeyRef.current === latestEventKey) return;
    announcedEventKeyRef.current = latestEventKey;
    setAnnouncement(latestEvent.message);
  }, [latestEvent, latestEventKey]);

  const recent = events.slice(-20);

  return (
    <aside className={`event-log [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:absolute] [top:20%] [right:max(0.65rem,_env(safe-area-inset-right))] [z-index:30] [width:min(18rem,_calc(100vw_-_1rem))] [max-height:min(22rem,_calc(100dvh_-_10rem))] [display:flex] [flex-direction:column] [overflow:hidden] [border:1px_solid_var(--game-chrome-border)] [border-radius:1rem] [background:radial-gradient(circle_at_100%_0,_rgba(75,_213,_255,_0.18),_transparent_45%),_linear-gradient(155deg,_rgba(5,_48,_66,_0.96),_var(--game-chrome-bg-strong))] [box-shadow:0_1rem_3rem_rgba(1,_15,_24,_0.4),_inset_0_1px_rgba(255,_255,_255,_0.07)] [color:var(--game-chrome-text)] [pointer-events:auto] [transform:none] [backdrop-filter:blur(20px)] [transition:max-height_200ms_ease,_width_200ms_ease] [&.is-collapsed]:[width:10.5rem] [&.is-collapsed]:[max-height:44px] [&.is-collapsed_.event-log-chevron]:[transform:rotate(-90deg)] max-[720px]:[width:min(17rem,_calc(100vw_-_1rem))] [@media(max-height:480px)_and_(orientation:landscape)]:[top:20%] [@media(max-height:480px)_and_(orientation:landscape)]:[max-height:calc(100dvh_-_10rem)] [@media(max-height:480px)_and_(orientation:landscape)]:[&.is-collapsed]:[max-height:44px] motion-reduce:[transition:none] ${collapsed ? 'is-collapsed' : 'is-expanded'}`} aria-label="Nhật ký trận đấu">
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
      <button type="button" onClick={() => setCollapsed(value => !value)} className="font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] rounded-[var(--radius)] event-log-toggle [width:100%] [min-height:44px] [flex:0_0_auto] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.75rem] [padding:0.42rem_0.65rem] [border:0] [border-bottom:1px_solid_rgba(167,_243,_208,_0.1)] [background:transparent] [color:inherit] [cursor:pointer] [text-align:left] [touch-action:manipulation] [transition:background-color_180ms_ease] [&:hover]:[background:rgba(255,_255,_255,_0.05)] [&:focus-visible]:[outline:2px_solid_var(--game-chrome-gold)] [&:focus-visible]:[outline-offset:-3px] motion-reduce:[transition:none]" aria-expanded={!collapsed}>
        <span className="event-log-heading [min-width:0] [display:flex] [align-items:center] [gap:0.55rem]">
          <span className="event-log-heading-icon [width:1.8rem] [height:1.8rem] [flex:0_0_auto] [display:grid] [place-items:center] [border:1px_solid_rgba(75,_213,_255,_0.2)] [border-radius:0.58rem] [background:rgba(75,_213,_255,_0.12)] [color:var(--game-chrome-primary)] [&_svg]:[width:1rem] [&_svg]:[height:1rem]">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h11M8 12h11M8 18h7" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
          </span>
          <span className="event-log-heading-copy [min-width:0] [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:white] [&_strong]:[font-size:0.66rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.14em] [&_strong]:[text-transform:uppercase] [&_small]:[margin-top:0.08rem] [&_small]:[color:var(--game-chrome-muted)] [&_small]:[font-size:0.55rem] [&_small]:[font-weight:700]">
            <strong>Diễn biến</strong>
            <small>{events.length} sự kiện</small>
          </span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="event-log-chevron [width:1rem] [height:1rem] [flex:0_0_auto] [color:var(--game-chrome-primary)] [transition:transform_180ms_ease] motion-reduce:[transition:none]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {!collapsed ? (
        <div className="event-log-scroll [min-height:0] [overflow-y:auto] [overscroll-behavior:contain] [padding:0.48rem] [scrollbar-color:rgba(145,_184,_169,_0.38)_transparent] [scrollbar-width:thin]">
          {recent.length === 0 ? (
            <div className="event-log-empty [min-height:5.8rem] [display:grid] [place-items:center] [padding:1rem] [color:var(--game-chrome-muted)] [font-size:0.7rem] [line-height:1.45] [text-align:center]">
              <p>Các giao dịch và sự kiện quan trọng sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="event-log-list [display:flex] [flex-direction:column] [gap:0.38rem]">
              {recent.map(event => (
                <article key={`${event.timestamp}-${event.type}-${event.playerId}-${event.tileId}-${event.message}`} className={`event-log-item [position:relative] [display:flex] [gap:0.5rem] [padding:0.48rem] [border:1px_solid_rgba(75,_213,_255,_0.12)] [border-radius:0.72rem] [background:rgba(255,_255,_255,_0.035)] [color:#d9f4fc] animate-game-event-enter [&_p]:[min-width:0] [&_p]:[flex:1] [&_p]:[padding-top:0.28rem] [&_p]:[font-size:0.68rem] [&_p]:[font-weight:600] [&_p]:[line-height:1.38] [&.is-danger]:[border-color:rgba(251,_113,_133,_0.22)] [&.is-danger]:[background:rgba(251,_113,_133,_0.09)] [&.is-danger]:[color:#ffe4e6] [&.is-success]:[border-color:rgba(85,_231,_162,_0.2)] [&.is-success]:[background:rgba(85,_231,_162,_0.08)] [&.is-success]:[color:#d1fae5] [&.is-warning]:[border-color:rgba(251,_146,_60,_0.22)] [&.is-warning]:[background:rgba(251,_146,_60,_0.09)] [&.is-warning]:[color:#ffedd5] [&.is-highlight]:[border-color:rgba(255,_220,_93,_0.3)] [&.is-highlight]:[background:rgba(255,_220,_93,_0.1)] [&.is-highlight]:[color:#fef3c7] motion-reduce:[animation:none] ${EVENT_TONES[event.type] || ''}`}>
                  <EventGlyph type={event.type} />
                  <p>{event.message}</p>
                </article>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      ) : null}
    </aside>
  );
}

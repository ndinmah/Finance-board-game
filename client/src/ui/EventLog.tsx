import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './GameChrome.css';

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
    <span className="event-log-glyph">
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
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const recent = events.slice(-20);

  return (
    <aside className={`event-log ${collapsed ? 'is-collapsed' : 'is-expanded'}`} aria-label="Nhật ký trận đấu">
      <button type="button" onClick={() => setCollapsed(value => !value)} className="event-log-toggle" aria-expanded={!collapsed}>
        <span className="event-log-heading">
          <span className="event-log-heading-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h11M8 12h11M8 18h7" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
          </span>
          <span className="event-log-heading-copy">
            <strong>Diễn biến</strong>
            <small>{events.length} sự kiện</small>
          </span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="event-log-chevron" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {!collapsed ? (
        <div className="event-log-scroll" aria-live="polite">
          {recent.length === 0 ? (
            <div className="event-log-empty">
              <p>Các giao dịch và sự kiện quan trọng sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="event-log-list">
              {recent.map(event => (
                <article key={`${event.timestamp}-${event.type}-${event.playerId}-${event.tileId}-${event.message}`} className={`event-log-item ${EVENT_TONES[event.type] || ''}`}>
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

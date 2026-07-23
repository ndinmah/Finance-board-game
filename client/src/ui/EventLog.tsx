import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const EVENT_TONES: Record<string, string> = {
  bankrupt: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
  jail_enter: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
  buy: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  upgrade: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  rent: 'border-orange-300/20 bg-orange-300/10 text-orange-100',
  game_over: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
};

function EventGlyph({ type }: { type: string }) {
  const isMoney = ['rent', 'buy', 'go_salary', 'tax', 'penalty'].includes(type);
  const isAlert = ['bankrupt', 'jail_enter', 'disconnect'].includes(type);
  const isWin = type === 'game_over';
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/15 text-sky-200">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (collapsed) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [events, collapsed]);

  const recent = events.slice(-20);

  return (
    <aside className={`pointer-events-auto absolute right-3 top-[4.75rem] hidden w-[19rem] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(9,23,48,0.94),rgba(15,38,65,0.9))] shadow-[0_18px_50px_rgba(2,8,23,0.38),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl lg:flex lg:flex-col ${collapsed ? 'max-h-12' : 'max-h-[24rem]'}`} aria-label="Nhật ký trận đấu">
      <button type="button" onClick={() => setCollapsed(value => !value)} className="flex min-h-12 w-full cursor-pointer items-center justify-between border-b border-white/8 bg-transparent px-3.5 text-left transition-colors duration-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300" aria-expanded={!collapsed}>
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-400/10 text-sky-200">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h11M8 12h11M8 18h7" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
          </span>
          <span>
            <span className="block text-[0.68rem] font-black uppercase tracking-[0.16em] text-white">Diễn biến</span>
            <span className="block text-[0.58rem] font-semibold text-slate-400">{events.length} sự kiện</span>
          </span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {!collapsed ? (
        <div className="overflow-y-auto p-2 [scrollbar-color:rgba(125,170,215,0.35)_transparent] [scrollbar-width:thin]" aria-live="polite">
          {recent.length === 0 ? (
            <div className="grid min-h-24 place-items-center px-5 text-center">
              <p className="text-xs leading-relaxed text-slate-400">Các giao dịch và sự kiện quan trọng sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-1.5 before:absolute before:bottom-3 before:left-[1.15rem] before:top-3 before:w-px before:bg-gradient-to-b before:from-sky-300/30 before:to-transparent">
              {recent.map(event => (
                <article key={`${event.timestamp}-${event.type}-${event.playerId}-${event.tileId}-${event.message}`} className={`relative flex gap-2 rounded-xl border px-2 py-2 text-[0.7rem] leading-[1.4] shadow-sm animate-fade-slide motion-reduce:animate-none ${EVENT_TONES[event.type] || 'border-white/8 bg-white/[0.035] text-slate-200'}`}>
                  <EventGlyph type={event.type} />
                  <p className="min-w-0 flex-1 pt-1 font-medium">{event.message}</p>
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

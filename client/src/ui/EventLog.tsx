import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function EventLog() {
  const { events } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      rent: '💸', buy: '🏡', upgrade: '🔨', mortgage: '🔒',
      bankrupt: '💔', jail_enter: '⛓️', jail_exit: '🔓', jail_bail: '💰',
      go_salary: '💵', festival: '🎉', festival_done: '⭐', airport: '✈️',
      airport_select: '✈️', start: '🎮', game_over: '🏆', reconnect: '📡',
      disconnect: '⚡', port: '🚢', own_land: '🏠', buy_offer: '🤔',
    };
    return icons[type] || '📢';
  };

  const recent = events.slice(-20);

  const getTextColorClass = (type: string) => {
    if (type === 'bankrupt') return 'text-[#ff8080]';
    if (type === 'buy' || type === 'upgrade') return 'text-[#2ecc71]';
    if (type === 'rent') return 'text-[#e67e22]';
    if (type === 'game_over') return 'text-gold font-bold';
    return 'text-[#c8d8f0]';
  };

  return (
    <div className="hidden md:flex absolute right-3 top-[60px] w-[260px] max-h-[340px] bg-[rgba(13,27,62,0.82)] backdrop-blur-md border-[1.5px] border-[rgba(74,144,217,0.2)] rounded-[14px] flex-col overflow-hidden">
      <div className="px-3.5 pt-2.5 pb-2 text-xs font-bold text-[#8faad4] uppercase tracking-wide border-b border-[rgba(74,144,217,0.15)] shrink-0">📋 Nhật ký</div>
      <div className="overflow-y-auto p-2 flex flex-col gap-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(74,144,217,0.3)] [&::-webkit-scrollbar-thumb]:rounded">
        {recent.map((ev, i) => (
          <div key={i} className="flex gap-1.5 px-2 py-1.5 rounded-lg text-xs leading-[1.4] bg-[rgba(255,255,255,0.03)] animate-fade-slide">
            <span className="shrink-0 text-sm">{getIcon(ev.type)}</span>
            <span className={getTextColorClass(ev.type)}>{ev.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

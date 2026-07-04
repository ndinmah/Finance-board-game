import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './EventLog.css';

const EVENT_ICONS: Record<string, string> = {
  rent: '💸', buy: '🏡', upgrade: '🔨', mortgage: '🔒',
  bankrupt: '💔', jail_enter: '⛓️', jail_exit: '🔓', jail_bail: '💰',
  go_salary: '💵', festival: '🎉', festival_done: '⭐', airport: '✈️',
  airport_select: '✈️', start: '🎮', game_over: '🏆', reconnect: '📡',
  disconnect: '⚡', port: '🚢', own_land: '🏠', buy_offer: '🤔',
};

export default function EventLog() {
  const { events } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);

  const getIcon = (type: string) => {
    return EVENT_ICONS[type] || '📢';
  };

  const recent = events.slice(-20);

  return (
    <div className="event-log">
      <div className="event-log-title">📋 Nhật ký</div>
      <div className="event-list">
        {recent.map((ev, i) => (
          <div key={i} className={`event-item event-${ev.type}`}>
            <span className="ev-icon">{getIcon(ev.type)}</span>
            <span className="ev-text">{ev.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

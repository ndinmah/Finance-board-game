import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../utils/format';

export default function GameHUD() {
  const players = useGameStore(s => s.players);
  const currentPlayerId = useGameStore(s => s.currentPlayerId);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const turnNumber = useGameStore(s => s.turnNumber);
  const turnOrder = useGameStore(s => s.turnOrder);

  const activePlayers = useMemo(
    () => turnOrder.map(id => players.get(id)).filter(Boolean),
    [turnOrder, players]
  );

  return (
    <div className="flex flex-row md:flex-row gap-2 md:gap-3 items-center md:items-start justify-between md:justify-start w-full md:w-auto pointer-events-none">
      {/* Turn indicator */}
      <div className="bg-[rgba(13,27,62,0.85)] backdrop-blur-md border-[0.1rem] border-[rgba(74,144,217,0.3)] rounded-lg md:rounded-xl p-1.5 px-2.5 md:p-2 md:px-4 flex flex-col min-w-0 md:min-w-[9.3333rem]">
        <span className="text-[0.6rem] md:text-[0.7333rem] text-[#8faad4] font-semibold uppercase tracking-wide">Lượt #{turnNumber + 1}</span>
        <span className="text-[0.7333rem] md:text-[1rem] font-bold text-gold whitespace-nowrap overflow-hidden text-ellipsis max-w-[4.6667rem] md:max-w-[10rem]">
          {players.get(currentPlayerId)?.name || '...'}
          {currentPlayerId === myPlayerId ? ' (bạn)' : ''}
        </span>
      </div>

      {/* Player scoreboard */}
      <div className="flex gap-1 md:gap-2 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible grow md:grow-0 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-mask-image:linear-gradient(to_right,black_90%,transparent_100%)] md:[-webkit-mask-image:none]">
        {activePlayers.map(p => {
          if (!p) return null;
          const isActive  = p.id === currentPlayerId;
          const isMe      = p.id === myPlayerId;
          return (
            <div key={p.id} className={`flex items-center gap-1 md:gap-2 bg-[rgba(13,27,62,0.8)] backdrop-blur-sm border-[0.1rem] rounded-lg md:rounded-[0.6667rem] p-1 px-1.5 md:p-1.5 md:px-2.5 min-w-0 md:min-w-[8.6667rem] transition-colors duration-200 ${isActive ? 'border-gold shadow-[0_0_0.8rem_rgba(245,197,24,0.3)]' : isMe ? 'border-[rgba(74,144,217,0.5)]' : 'border-[rgba(255,255,255,0.08)]'} ${p.isBankrupt ? 'opacity-40' : ''}`}>
              <div className="w-[1.4667rem] h-[1.4667rem] md:w-8 md:h-8 rounded-full flex items-center justify-center font-extrabold text-[0.7333rem] md:text-sm text-white shrink-0 relative" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
                {p.isInJail && <span className="absolute -bottom-[0.1333rem] -right-[0.1333rem] md:-bottom-1 md:-right-1 text-[0.5333rem] md:text-[0.6667rem]">⛓️</span>}
                {p.isBot && <span className="absolute -bottom-[0.1333rem] -right-[0.1333rem] md:-bottom-1 md:-right-1 text-[0.5333rem] md:text-[0.6667rem]">🤖</span>}
                {!p.isConnected && <span className="absolute -bottom-[0.1333rem] -right-[0.1333rem] md:-bottom-1 md:-right-1 text-[0.5333rem] md:text-[0.6667rem]">📡</span>}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="hidden md:block text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[6rem]">{p.name}{isMe ? ' ★' : ''}</span>
                <span className="text-[0.6667rem] md:text-[0.7333rem] text-gold font-semibold">💰 {formatMoney(p.money)}</span>
              </div>
              {isActive && <div className="w-[0.3333rem] h-[0.3333rem] md:w-2 md:h-2 rounded-full bg-gold shadow-[0_0_0.5333rem_#f5c518] animate-pulse shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../utils/format';

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M4 6.5h13.5A2.5 2.5 0 0 1 20 9v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 4.5 4H17v2H4.5a.5.5 0 0 0-.5.5Z" fill="currentColor" />
      <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Zm0 2a.5.5 0 1 0 0 1h4v-1h-4Z" fill="currentColor" />
    </svg>
  );
}

export default function GameHUD() {
  const players = useGameStore(s => s.players);
  const currentPlayerId = useGameStore(s => s.currentPlayerId);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const turnNumber = useGameStore(s => s.turnNumber);
  const turnOrder = useGameStore(s => s.turnOrder);

  const activePlayers = useMemo(
    () => turnOrder.map(id => players.get(id)).filter(p => p !== undefined),
    [turnOrder, players]
  );
  const currentPlayer = players.get(currentPlayerId);

  return (
    <header className="pointer-events-none flex w-full items-start gap-2 md:gap-3" aria-label="Thông tin ván đấu">
      <section className="min-w-[7.5rem] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(9,23,48,0.94),rgba(18,46,78,0.88))] shadow-[0_10px_30px_rgba(2,8,23,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:min-w-[10.5rem]">
        <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5">
          <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-sky-200/65 md:text-[0.68rem]">Lượt chơi</span>
          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[0.6rem] font-black tabular-nums text-amber-200 md:text-[0.68rem]">#{turnNumber + 1}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.78rem] font-black leading-tight text-white md:text-sm">{currentPlayer?.name || 'Đang đồng bộ...'}</p>
            <p className="mt-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-amber-300/90 md:text-[0.65rem]">
              {currentPlayerId === myPlayerId ? 'Đến lượt của bạn' : 'Đang thực hiện lượt'}
            </p>
          </div>
        </div>
      </section>

      <section className="pointer-events-auto flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2" aria-label="Danh sách người chơi">
        {activePlayers.map(player => {
          const isActive = player.id === currentPlayerId;
          const isMe = player.id === myPlayerId;
          return (
            <article
              key={player.id}
              className={`relative flex min-w-[7.25rem] items-center gap-2 overflow-hidden rounded-2xl border px-2.5 py-2 shadow-[0_8px_22px_rgba(2,8,23,0.28),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition-[border-color,opacity,transform] duration-200 md:min-w-[9rem] md:px-3 ${isActive ? 'border-amber-300/70 bg-[linear-gradient(145deg,rgba(45,38,19,0.92),rgba(15,34,58,0.92))]' : 'border-white/10 bg-[rgba(9,23,48,0.84)]'} ${player.isBankrupt ? 'opacity-45 grayscale' : ''}`}
            >
              {isActive ? <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" /> : null}
              <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/20 text-sm font-black text-white shadow-inner md:h-9 md:w-9" style={{ backgroundColor: player.color }}>
                {player.name.charAt(0).toUpperCase()}
                <span className={`absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-[#10233d] ${player.isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-label={player.isConnected ? 'Đang kết nối' : 'Mất kết nối'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[0.7rem] font-extrabold text-white md:text-xs">{player.name}</p>
                  {isMe ? <span className="rounded bg-sky-400/15 px-1 py-0.5 text-[0.48rem] font-black uppercase text-sky-200">Bạn</span> : null}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[0.65rem] font-bold tabular-nums text-amber-200 md:text-[0.72rem]">
                  <WalletIcon />
                  <span>{formatMoney(player.money)}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {player.isInJail ? <span className="rounded-md border border-rose-300/20 bg-rose-400/15 px-1.5 py-0.5 text-[0.5rem] font-black uppercase text-rose-200">Trong tù</span> : null}
                {player.isBot ? <span className="text-[0.5rem] font-black uppercase tracking-wider text-slate-400">Bot</span> : null}
              </div>
            </article>
          );
        })}
      </section>
    </header>
  );
}

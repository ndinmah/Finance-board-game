import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { formatMoney } from '../utils/format';

const IS_DEV_MODE = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');
const RESULT_DISPLAY_MS = 1000;
const ROLL_RESPONSE_TIMEOUT_MS = 10000;
const DIE_DOTS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const PRIMARY_BUTTON = 'min-h-11 cursor-pointer rounded-xl border border-amber-100/30 bg-[linear-gradient(180deg,#ffd95a,#f2a900)] px-5 py-2 text-sm font-black uppercase tracking-[0.08em] text-[#352400] shadow-[0_5px_0_#a96600,0_10px_24px_rgba(245,180,22,0.28)] transition-[transform,filter,box-shadow] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100 active:translate-y-1 active:shadow-[0_1px_0_#a96600] disabled:cursor-not-allowed disabled:opacity-50';
const SECONDARY_BUTTON = 'min-h-11 cursor-pointer rounded-xl border border-white/12 bg-white/[0.07] px-4 py-2 text-xs font-extrabold text-slate-100 transition-colors duration-200 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300';

function Die({ value, rolling, delay = false }: { value: number; rolling: boolean; delay?: boolean }) {
  const dots = DIE_DOTS[value] || DIE_DOTS[1];
  return (
    <div className={`grid h-14 w-14 grid-cols-3 grid-rows-3 gap-1 rounded-2xl border border-white/70 bg-[linear-gradient(145deg,#ffffff,#dbe8f5)] p-2.5 shadow-[0_7px_0_#90a9c0,0_12px_25px_rgba(2,8,23,0.35),inset_0_1px_0_#fff] md:h-16 md:w-16 md:p-3 ${rolling ? 'animate-die-spin motion-reduce:animate-none' : ''}`} style={delay ? { animationDelay: '50ms' } : undefined} role="img" aria-label={`Xúc xắc ${value} điểm`}>
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={`h-2 w-2 self-center justify-self-center rounded-full bg-[#142943] shadow-inner md:h-2.5 md:w-2.5 ${dots.includes(index) ? 'opacity-100' : 'opacity-0'}`} />
      ))}
    </div>
  );
}

function ActionIcon({ type }: { type: 'roll' | 'plane' | 'jail' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {type === 'roll' ? <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /></> : null}
      {type === 'plane' ? <><path d="m2 16 20-8-8 20-2-9-10-3Z" /><path d="m12 19 4-7" /></> : null}
      {type === 'jail' ? <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v18m6-18v18M4 9h16m-16 6h16" /></> : null}
    </svg>
  );
}

interface DiceRollerProps {
  boardReady?: boolean;
  onRollRevealed?: (rollCount: number) => void;
  onPresentationChange?: (active: boolean) => void;
}

export default function DiceRoller({ boardReady = true, onRollRevealed, onPresentationChange }: DiceRollerProps) {
  const isMyTurn = useGameStore(s => s.currentPlayerId === s.myPlayerId);
  const turnPhase = useGameStore(s => s.turnPhase);
  const dice = useGameStore(s => s.dice);
  const me = useGameStore(s => s.players.get(s.myPlayerId));
  const currentPlayerName = useGameStore(s => s.players.get(s.currentPlayerId)?.name);
  const buyoutTile = useGameStore(s => {
    const myPos = s.players.get(s.myPlayerId)?.position ?? 0;
    return s.board.get(myPos);
  });

  const [rolling, setRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [displayDice, setDisplayDice] = useState({ d1: 1, d2: 1 });
  const [devD1, setDevD1] = useState('');
  const [devD2, setDevD2] = useState('');
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollStartedAt = useRef(0);
  const observedRollCount = useRef(dice.rollCount);

  const startVisualRoll = useCallback(() => {
    if (rollTimer.current) clearInterval(rollTimer.current);
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (resultTimer.current) clearTimeout(resultTimer.current);

    rollStartedAt.current = performance.now();
    setShowResult(false);
    setRolling(true);
    setDisplayDice({ d1: Math.ceil(Math.random() * 6), d2: Math.ceil(Math.random() * 6) });
    rollTimer.current = setInterval(() => {
      setDisplayDice({ d1: Math.ceil(Math.random() * 6), d2: Math.ceil(Math.random() * 6) });
    }, 70);

    // Nếu kết nối gặp sự cố, trả quyền thao tác lại thay vì để UI xoay vô hạn.
    finishTimer.current = setTimeout(() => {
      if (rollTimer.current) clearInterval(rollTimer.current);
      rollTimer.current = null;
      setRolling(false);
    }, ROLL_RESPONSE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (dice.rollCount === observedRollCount.current) return;
    observedRollCount.current = dice.rollCount;
    if (dice.rollCount === 0) return;
    if (!rollTimer.current) startVisualRoll();

    if (finishTimer.current) clearTimeout(finishTimer.current);
    const elapsed = performance.now() - rollStartedAt.current;
    finishTimer.current = setTimeout(() => {
      if (rollTimer.current) clearInterval(rollTimer.current);
      rollTimer.current = null;
      setDisplayDice({ d1: dice.die1, d2: dice.die2 });
      setRolling(false);
      setShowResult(true);
      onRollRevealed?.(dice.rollCount);
      resultTimer.current = setTimeout(() => setShowResult(false), RESULT_DISPLAY_MS);
    }, Math.max(0, 850 - elapsed));
  }, [dice.rollCount, dice.die1, dice.die2, onRollRevealed, startVisualRoll]);

  useEffect(() => () => {
    if (rollTimer.current) clearInterval(rollTimer.current);
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (resultTimer.current) clearTimeout(resultTimer.current);
  }, []);

  useEffect(() => {
    onPresentationChange?.(rolling || showResult);
  }, [onPresentationChange, rolling, showResult]);

  const isWaitingForBoard = isMyTurn && !boardReady && (turnPhase === 'wait_roll' || turnPhase === 'airport_select');
  const canRoll = boardReady && isMyTurn && (turnPhase === 'wait_roll' || turnPhase === 'airport_select');
  const canAirport = isMyTurn && turnPhase === 'airport_select';
  const canFestival = isMyTurn && turnPhase === 'festival_select';
  const isPayingDebt = isMyTurn && turnPhase === 'pay_debt';
  const canPayBail = isMyTurn && turnPhase === 'wait_roll' && me?.isInJail && me.money >= 200;
  const canUseJailCard = isMyTurn && turnPhase === 'wait_roll' && me?.isInJail && me.hasJailCard;
  const canStartAirport = isMyTurn && turnPhase === 'wait_roll' && me?.position === 24 && me.money >= 50;
  const isBuyout = isMyTurn && turnPhase === 'buyout_decision';
  const isRemoteUpgrade = isMyTurn && turnPhase === 'go_remote_upgrade';
  const isChanceTileSelection = isMyTurn && (
    turnPhase === 'chance_shield_select' ||
    turnPhase === 'chance_attack_select' ||
    turnPhase === 'chance_give_city_select' ||
    turnPhase === 'chance_festival_city_select'
  );
  const isChancePlayerSelection = isMyTurn && turnPhase === 'chance_give_city_target';
  const isActionPanel = canRoll || rolling || showResult || canAirport || canFestival || isPayingDebt || canPayBail || canUseJailCard || canStartAirport || isBuyout || isRemoteUpgrade || isChanceTileSelection || isChancePlayerSelection;

  const handleRoll = () => {
    if (!canRoll || rolling) return;
    startVisualRoll();
    if (IS_DEV_MODE) send('rollDice', { d1: parseInt(devD1) || 1, d2: parseInt(devD2) || 1 });
    else send('rollDice');
  };

  const buyoutPrice = buyoutTile ? (buyoutTile.price + buyoutTile.houseCount * buyoutTile.buildCost) * 2 : 0;

  if (turnPhase === 'game_over') return null;

  if (isWaitingForBoard) {
    return (
      <div className="pointer-events-auto fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#091730]/85 px-4 py-2 text-xs font-bold text-slate-200 shadow-[0_10px_30px_rgba(2,8,23,0.35)] backdrop-blur-xl">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300 motion-reduce:animate-none" />
          Đang chuẩn bị bàn cờ...
        </div>
      </div>
    );
  }

  if (!isActionPanel) {
    return (
      <div className="pointer-events-auto fixed bottom-3 left-1/2 z-[500] -translate-x-1/2 md:bottom-5">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#091730]/85 px-4 py-2 text-xs font-bold text-slate-300 shadow-[0_10px_30px_rgba(2,8,23,0.35)] backdrop-blur-xl">
          <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] motion-reduce:animate-none" />
          Đang chờ {currentPlayerName || 'người chơi'}
        </div>
      </div>
    );
  }

  if (rolling) {
    return (
      <section className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center" aria-live="polite" aria-label="Xúc xắc đang xoay">
        <div className="relative flex flex-col items-center gap-5">
          <span className="absolute -inset-16 -z-10 rounded-full bg-sky-300/20 blur-3xl" aria-hidden="true" />
          <div className="flex gap-4 rounded-[2rem] border border-white/15 bg-[#07172d]/75 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
            <Die value={displayDice.d1} rolling />
            <Die value={displayDice.d2} rolling delay />
          </div>
          <p className="rounded-full border border-white/10 bg-[#07172d]/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-100 shadow-lg backdrop-blur-lg">
            Xúc xắc đang xoay
          </p>
        </div>
      </section>
    );
  }

  if (showResult) {
    const total = displayDice.d1 + displayDice.d2;
    return (
      <section className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center" aria-live="polite" aria-label={`Kết quả xúc xắc là ${total}`}>
        <div className="relative flex flex-col items-center gap-4">
          <span className="absolute -inset-16 -z-10 rounded-full bg-amber-300/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex gap-4 rounded-[2rem] border border-amber-100/25 bg-[#07172d]/85 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
            <Die value={displayDice.d1} rolling={false} />
            <Die value={displayDice.d2} rolling={false} />
            {dice.isDouble ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest text-amber-950 shadow-lg">Đổ đôi</span> : null}
          </div>
          <div className="rounded-2xl border border-amber-100/25 bg-[linear-gradient(180deg,#ffd95a,#f2a900)] px-6 py-2 text-center text-[#352400] shadow-[0_8px_30px_rgba(245,180,22,0.35)]">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-70">Tổng xúc xắc</p>
            <p className="text-3xl font-black leading-none">{total}</p>
          </div>
        </div>
      </section>
    );
  }

  if (canRoll) {
    return (
      <section className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center" aria-label="Điều khiển tung xúc xắc">
        <div className="pointer-events-auto flex w-[min(90vw,22rem)] flex-col items-center gap-3">
          {IS_DEV_MODE ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300/15 bg-[#07172d]/85 p-2 shadow-lg backdrop-blur-xl">
              <span className="px-1 text-[0.58rem] font-black uppercase tracking-wider text-rose-200">Mock</span>
              <label className="sr-only" htmlFor="dev-die-1">Xúc xắc thứ nhất</label>
              <input id="dev-die-1" type="number" min="1" max="6" placeholder="D1" value={devD1} onChange={event => setDevD1(event.target.value)} className="h-9 w-14 rounded-lg border border-white/10 bg-black/20 text-center text-xs font-bold text-white outline-none focus:border-rose-300/60" />
              <label className="sr-only" htmlFor="dev-die-2">Xúc xắc thứ hai</label>
              <input id="dev-die-2" type="number" min="1" max="6" placeholder="D2" value={devD2} onChange={event => setDevD2(event.target.value)} className="h-9 w-14 rounded-lg border border-white/10 bg-black/20 text-center text-xs font-bold text-white outline-none focus:border-rose-300/60" />
            </div>
          ) : null}

          <button id="btn-roll" type="button" className={`${PRIMARY_BUTTON} flex min-h-16 min-w-48 items-center justify-center gap-3 rounded-2xl px-8 text-base shadow-[0_7px_0_#a96600,0_18px_45px_rgba(245,180,22,0.4)]`} onClick={handleRoll}>
            <ActionIcon type="roll" /> Tung xúc xắc
          </button>

          {canAirport ? <p className="rounded-full border border-sky-300/15 bg-[#07172d]/80 px-4 py-2 text-center text-xs font-semibold text-sky-100 backdrop-blur-xl">Chọn một ô đất hoặc cảng hợp lệ trên bàn cờ.</p> : null}
          {canStartAirport || canPayBail || canUseJailCard ? (
            <div className="flex flex-wrap justify-center gap-2">
              {canStartAirport ? <button type="button" className={`${SECONDARY_BUTTON} flex items-center justify-center gap-2 bg-[#07172d]/85 backdrop-blur-xl`} onClick={() => send('startAirportSelect')}><ActionIcon type="plane" /> Mua vé 50K</button> : null}
              {canPayBail ? <button id="btn-bail" type="button" className={`${SECONDARY_BUTTON} flex items-center justify-center gap-2 border-rose-300/20 bg-[#07172d]/85 text-rose-100 backdrop-blur-xl`} onClick={() => send('payBail')}><ActionIcon type="jail" /> Nộp 200K</button> : null}
              {canUseJailCard ? <button type="button" className={`${SECONDARY_BUTTON} bg-[#07172d]/85 backdrop-blur-xl`} onClick={() => send('useJailCard')}>Dùng thẻ ra tù</button> : null}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="pointer-events-auto fixed bottom-3 left-1/2 z-[1000] w-[min(94vw,30rem)] -translate-x-1/2 rounded-[1.4rem] border border-white/12 bg-[linear-gradient(155deg,rgba(8,22,45,0.96),rgba(18,44,73,0.93))] p-3 shadow-[0_18px_60px_rgba(2,8,23,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl md:bottom-5 md:p-4" aria-label="Bảng điều khiển lượt chơi">
      <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/60 to-transparent" />

      <div className="flex items-center gap-3 md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-sky-200/60">Điều khiển lượt</p>
            <p className="mt-0.5 truncate text-sm font-extrabold text-white">
              Chọn hành động tiếp theo
            </p>
          </div>

        </div>
      </div>

      {canAirport ? <div className="mt-3 flex items-center justify-between rounded-xl border border-sky-300/15 bg-sky-400/[0.07] px-3 py-2"><p className="text-xs font-semibold text-sky-100">Chọn một ô đất hoặc cảng hợp lệ trên bàn cờ.</p></div> : null}
      {canFestival ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-fuchsia-300/15 bg-fuchsia-400/[0.07] px-3 py-2"><p className="text-xs font-semibold text-fuchsia-100">Chọn đất của bạn để tổ chức lễ hội với phí 50K.</p><button type="button" className={SECONDARY_BUTTON} onClick={() => send('skipFestival')}>Bỏ qua</button></div> : null}
      {isPayingDebt ? <div className="mt-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2"><p className="text-xs font-black uppercase tracking-wider text-rose-200">Cần thanh toán {formatMoney(me?.debtAmount || 0)}</p><p className="mt-1 text-[0.68rem] text-rose-100/75">Chọn tài sản trên bàn cờ để bán và trả nợ.</p></div> : null}
      {isRemoteUpgrade ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.07] px-3 py-2"><p className="text-xs font-semibold text-emerald-100">Chọn một thành phố của bạn để nâng cấp từ xa.</p><button type="button" className={SECONDARY_BUTTON} onClick={() => send('skipRemoteUpgrade')}>Bỏ qua</button></div> : null}
      {isChanceTileSelection ? <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/[0.07] px-3 py-2"><p className="text-xs font-semibold text-amber-100">Chọn một ô đang phát sáng trên bàn cờ để dùng thẻ Cơ Hội.</p></div> : null}
      {isChancePlayerSelection ? <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/[0.07] px-3 py-2"><p className="text-xs font-semibold text-amber-100">Chọn người chơi nhận thành phố trong bảng lựa chọn.</p></div> : null}
      {isBuyout && buyoutTile ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-orange-300/20 bg-orange-300/[0.08] px-3 py-2"><div><p className="text-xs font-black text-orange-100">Mua lại {buyoutTile.name}?</p><p className="mt-0.5 text-[0.65rem] font-semibold text-orange-200/75">Chi phí {formatMoney(buyoutPrice)}</p></div><div className="flex gap-2"><button type="button" className={`${SECONDARY_BUTTON} border-orange-300/20 bg-orange-300/10 text-orange-100`} onClick={() => send('acceptBuyout')}>Mua lại</button><button type="button" className={SECONDARY_BUTTON} onClick={() => send('skipBuyout')}>Bỏ qua</button></div></div> : null}
    </section>
  );
}

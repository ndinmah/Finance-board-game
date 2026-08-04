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
const PRIMARY_BUTTON = 'dice-primary-button [min-height:44px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.48rem] [border-radius:0.72rem] [cursor:pointer] [font-weight:900] [touch-action:manipulation] [transition:transform_150ms_ease,_filter_150ms_ease,_background-color_150ms_ease,_border-color_150ms_ease] [padding:0.58rem_1.2rem] [border:1px_solid_rgba(255,_244,_189,_0.4)] [background:linear-gradient(180deg,_#ffe879,_#f7b916)] [box-shadow:0_0.28rem_0_#b87900,_0_0.8rem_2rem_rgba(216,_154,_8,_0.34)] [color:#3e2a00] [font-size:0.78rem] [letter-spacing:0.07em] [text-transform:uppercase] [&:hover]:[filter:brightness(1.08)] [&:active]:[transform:translateY(2px)_scale(0.98)] [&:focus-visible]:[outline:2px_solid_var(--game-chrome-gold)] [&:focus-visible]:[outline-offset:3px] motion-reduce:[transition:none]';
const SECONDARY_BUTTON = 'dice-secondary-button [min-height:44px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:0.48rem] [border-radius:0.72rem] [cursor:pointer] [font-weight:900] [touch-action:manipulation] [transition:transform_150ms_ease,_filter_150ms_ease,_background-color_150ms_ease,_border-color_150ms_ease] [padding:0.48rem_0.8rem] [border:1px_solid_var(--game-chrome-border)] [background:rgba(255,_255,_255,_0.055)] [color:#e6f4ee] [font-size:0.68rem] [&.is-danger]:[border-color:rgba(251,_113,_133,_0.25)] [&.is-danger]:[color:#ffe4e6] [&.is-warning]:[border-color:rgba(255,_220,_93,_0.25)] [&.is-warning]:[background:rgba(255,_220,_93,_0.1)] [&.is-warning]:[color:#fef3c7] [&:hover]:[filter:brightness(1.08)] [&:active]:[transform:translateY(2px)_scale(0.98)] [&:focus-visible]:[outline:2px_solid_var(--game-chrome-gold)] [&:focus-visible]:[outline-offset:3px] motion-reduce:[transition:none]';
const JAIL_ACTION_BUTTON = '[min-width:8.75rem] [min-height:3.35rem] [display:grid] [grid-template-columns:2.25rem_1fr] [align-items:center] [gap:0.55rem] [padding:0.48rem_0.7rem] [border:1px_solid_rgba(255,_255,_255,_0.2)] [border-radius:0.9rem] [box-shadow:0_0.55rem_1.4rem_rgba(1,_12,_11,_0.32),_inset_0_1px_rgba(255,_255,_255,_0.14)] [color:white] [text-align:left] [transition:transform_150ms_ease,_filter_150ms_ease,_box-shadow_150ms_ease] [&_.dice-action-icon]:[width:1.15rem] [&_.dice-action-icon]:[height:1.15rem] [&_.jail-action-icon]:[width:2.25rem] [&_.jail-action-icon]:[height:2.25rem] [&_.jail-action-icon]:[display:flex] [&_.jail-action-icon]:[align-items:center] [&_.jail-action-icon]:[justify-content:center] [&_.jail-action-icon]:[border-radius:0.68rem] [&_.jail-action-icon]:[background:rgba(255,_255,_255,_0.14)] [&_.jail-action-copy]:[display:flex] [&_.jail-action-copy]:[flex-direction:column] [&_.jail-action-copy]:[gap:0.08rem] [&_.jail-action-copy_small]:[font-size:0.5rem] [&_.jail-action-copy_small]:[font-weight:800] [&_.jail-action-copy_small]:[letter-spacing:0.09em] [&_.jail-action-copy_small]:[opacity:0.76] [&_.jail-action-copy_small]:[text-transform:uppercase] [&_.jail-action-copy_strong]:[font-size:0.72rem] [&_.jail-action-copy_strong]:[font-weight:950] [&_.jail-action-copy_strong]:[line-height:1.15] [&:hover]:[filter:brightness(1.08)] [&:active]:[transform:translateY(2px)_scale(0.98)] [&:focus-visible]:[outline:2px_solid_#ffffff] [&:focus-visible]:[outline-offset:3px]';

function Die({ value, rolling, delay = false }: { value: number; rolling: boolean; delay?: boolean }) {
  const dots = DIE_DOTS[value] || DIE_DOTS[1];
  return (
    <div className={`dice-die [width:4.1rem] [height:4.1rem] [display:grid] [grid-template-columns:repeat(3,_1fr)] [grid-template-rows:repeat(3,_1fr)] [gap:0.28rem] [padding:0.72rem] [border:1px_solid_rgba(255,_255,_255,_0.8)] [border-radius:1rem] [background:linear-gradient(145deg,_#ffffff,_#dcebe5)] [box-shadow:0_0.34rem_0_#9db7ad,_0_0.8rem_1.8rem_rgba(1,_12,_11,_0.38),_inset_0_1px_white] [&.is-rolling]:animate-game-die-spin [&_>_span]:[width:0.58rem] [&_>_span]:[height:0.58rem] [&_>_span]:[align-self:center] [&_>_span]:[justify-self:center] [&_>_span]:[border-radius:999px] [&_>_span]:[background:#103b32] [&_>_span]:[box-shadow:inset_0_1px_2px_rgba(0,_0,_0,_0.35)] [&_>_span]:[opacity:0] [&_>_span.is-visible]:[opacity:1] [@media(max-height:480px)_and_(orientation:landscape)]:[width:3.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[height:3.7rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem] motion-reduce:[&.is-rolling]:[animation:none] ${rolling ? 'is-rolling' : ''}`} style={delay ? { animationDelay: '50ms' } : undefined} role="img" aria-label={`Xúc xắc ${value} điểm`}>
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={dots.includes(index) ? 'is-visible' : ''} />
      ))}
    </div>
  );
}

function ActionIcon({ type }: { type: 'roll' | 'plane' | 'jail' | 'card' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dice-action-icon [width:1rem] [height:1rem]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {type === 'roll' ? <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /></> : null}
      {type === 'plane' ? <><path d="m2 16 20-8-8 20-2-9-10-3Z" /><path d="m12 19 4-7" /></> : null}
      {type === 'jail' ? <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v18m6-18v18M4 9h16m-16 6h16" /></> : null}
      {type === 'card' ? <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M7 9h10M7 13h6" /><path d="m16 15 1.4 1.4L21 12.8" /></> : null}
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
    setDisplayDice({ d1: Math.floor(Math.random() * 6) + 1, d2: Math.floor(Math.random() * 6) + 1 });
    rollTimer.current = setInterval(() => {
      setDisplayDice({ d1: Math.floor(Math.random() * 6) + 1, d2: Math.floor(Math.random() * 6) + 1 });
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
      <div className="dice-center-status [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [top:0] [left:0] [width:100vw] [height:100vh] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [padding:max(0.75rem,_env(safe-area-inset-top))_max(0.75rem,_env(safe-area-inset-right))_max(0.75rem,_env(safe-area-inset-bottom))_max(0.75rem,_env(safe-area-inset-left))] [pointer-events:none]">
        <div className="dice-status-pill [display:flex] [align-items:center] [gap:0.5rem] [padding:0.55rem_0.85rem] [border:1px_solid_var(--game-chrome-border)] [border-radius:999px] [background:var(--game-chrome-bg)] [box-shadow:0_0.7rem_2rem_rgba(1,_12,_11,_0.35)] [color:#cde2da] [font-size:0.7rem] [font-weight:800] [white-space:nowrap] [backdrop-filter:blur(18px)] [&_>_span]:[width:0.48rem] [&_>_span]:[height:0.48rem] [&_>_span]:[flex:0_0_auto] [&_>_span]:[border-radius:999px] [&_>_span]:[background:var(--color-status-success)] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(85,_231,_162,_0.85)] [&_>_span]:animate-game-status-pulse [&.is-loading_>_span]:[background:var(--game-chrome-gold)] [&.is-loading_>_span]:[box-shadow:0_0_0.65rem_rgba(255,_220,_93,_0.85)] motion-reduce:[&_>_span]:[animation:none] is-loading">
          <span aria-hidden="true" />
          Đang chuẩn bị bàn cờ...
        </div>
      </div>
    );
  }

  if (!isActionPanel) {
    return (
      <div className="dice-wait-status [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [top:50%] [left:50%] [z-index:25] [transform:translate(-50%,_-50%)] [pointer-events:none]">
        <div className="dice-status-pill [display:flex] [align-items:center] [gap:0.5rem] [padding:0.55rem_0.85rem] [border:1px_solid_var(--game-chrome-border)] [border-radius:999px] [background:var(--game-chrome-bg)] [box-shadow:0_0.7rem_2rem_rgba(1,_12,_11,_0.35)] [color:#cde2da] [font-size:0.7rem] [font-weight:800] [white-space:nowrap] [backdrop-filter:blur(18px)] [&_>_span]:[width:0.48rem] [&_>_span]:[height:0.48rem] [&_>_span]:[flex:0_0_auto] [&_>_span]:[border-radius:999px] [&_>_span]:[background:var(--color-status-success)] [&_>_span]:[box-shadow:0_0_0.65rem_rgba(85,_231,_162,_0.85)] [&_>_span]:animate-game-status-pulse [&.is-loading_>_span]:[background:var(--game-chrome-gold)] [&.is-loading_>_span]:[box-shadow:0_0_0.65rem_rgba(255,_220,_93,_0.85)] motion-reduce:[&_>_span]:[animation:none]">
          <span aria-hidden="true" />
          Đang chờ {currentPlayerName || 'người chơi'}
        </div>
      </div>
    );
  }

  if (rolling) {
    return (
      <section className="dice-stage [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [top:0] [left:0] [width:100vw] [height:100vh] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [padding:max(0.75rem,_env(safe-area-inset-top))_max(0.75rem,_env(safe-area-inset-right))_max(0.75rem,_env(safe-area-inset-bottom))_max(0.75rem,_env(safe-area-inset-left))] [pointer-events:none]" aria-live="polite" aria-label="Xúc xắc đang xoay">
        <div className="dice-presentation [position:relative] [display:flex] [flex-direction:column] [align-items:center] [gap:0.8rem] animate-game-dice-arrive [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.65rem] motion-reduce:[animation:none] is-rolling">
          <span className="dice-aura [position:absolute] [inset:-3rem] [z-index:-1] [border-radius:999px] [background:rgba(75,_213,_255,_0.18)] [filter:blur(2.5rem)]" aria-hidden="true" />
          <div className="dice-pair [position:relative] [display:flex] [gap:0.8rem] [padding:1rem] [border:1px_solid_rgba(75,_213,_255,_0.24)] [border-radius:1.55rem] [background:radial-gradient(circle_at_50%_0,_rgba(75,_213,_255,_0.14),_transparent_55%),_rgba(3,_22,_33,_0.88)] [box-shadow:0_1.2rem_4rem_rgba(1,_15,_24,_0.54),_inset_0_1px_rgba(255,_255,_255,_0.1)] [backdrop-filter:blur(20px)] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.68rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.78rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:1.25rem]">
            <Die value={displayDice.d1} rolling />
            <Die value={displayDice.d2} rolling delay />
          </div>
          <p className="dice-presentation-label [padding:0.48rem_0.78rem] [border:1px_solid_var(--game-chrome-border)] [border-radius:999px] [background:var(--game-chrome-bg)] [box-shadow:0_0.5rem_1.5rem_rgba(1,_12,_11,_0.28)] [color:#d8eee5] [font-size:0.63rem] [font-weight:900] [letter-spacing:0.14em] [text-align:center] [text-transform:uppercase] [backdrop-filter:blur(16px)]">
            Xúc xắc đang xoay
          </p>
        </div>
      </section>
    );
  }

  if (showResult) {
    const total = displayDice.d1 + displayDice.d2;
    return (
      <section className="dice-stage [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [top:0] [left:0] [width:100vw] [height:100vh] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [padding:max(0.75rem,_env(safe-area-inset-top))_max(0.75rem,_env(safe-area-inset-right))_max(0.75rem,_env(safe-area-inset-bottom))_max(0.75rem,_env(safe-area-inset-left))] [pointer-events:none]" aria-live="polite" aria-label={`Kết quả xúc xắc là ${total}`}>
        <div className="dice-presentation [position:relative] [display:flex] [flex-direction:column] [align-items:center] [gap:0.8rem] animate-game-dice-arrive [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.65rem] motion-reduce:[animation:none] is-result">
          <span className="dice-aura [position:absolute] [inset:-3rem] [z-index:-1] [border-radius:999px] [background:rgba(255,_220,_93,_0.2)] [filter:blur(2.5rem)]" aria-hidden="true" />
          <div className="dice-pair [position:relative] [display:flex] [gap:0.8rem] [padding:1rem] [border:1px_solid_rgba(255,_220,_93,_0.28)] [border-radius:1.55rem] [background:radial-gradient(circle_at_50%_0,_rgba(75,_213,_255,_0.14),_transparent_55%),_rgba(3,_22,_33,_0.88)] [box-shadow:0_1.2rem_4rem_rgba(1,_15,_24,_0.54),_inset_0_1px_rgba(255,_255,_255,_0.1)] [backdrop-filter:blur(20px)] [@media(max-height:480px)_and_(orientation:landscape)]:[gap:0.68rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.78rem] [@media(max-height:480px)_and_(orientation:landscape)]:[border-radius:1.25rem]">
            <Die value={displayDice.d1} rolling={false} />
            <Die value={displayDice.d2} rolling={false} />
            {dice.isDouble ? <span className="dice-double-badge [position:absolute] [top:-0.65rem] [left:50%] [padding:0.24rem_0.65rem] [border-radius:999px] [background:var(--game-chrome-gold)] [box-shadow:0_0.45rem_1.2rem_rgba(216,_154,_8,_0.35)] [color:#3e2a00] [font-size:0.52rem] [font-weight:950] [letter-spacing:0.12em] [text-transform:uppercase] [transform:translateX(-50%)]">Đổ đôi</span> : null}
          </div>
          <div className="dice-total [min-width:7.2rem] [padding:0.42rem_1.15rem_0.52rem] [border:1px_solid_rgba(255,_244,_189,_0.32)] [border-radius:0.85rem] [background:linear-gradient(180deg,_#ffe879,_#f7b916)] [box-shadow:0_0.6rem_1.8rem_rgba(216,_154,_8,_0.32)] [color:#3e2a00] [text-align:center] [&_p]:[font-size:0.5rem] [&_p]:[font-weight:900] [&_p]:[letter-spacing:0.16em] [&_p]:[opacity:0.72] [&_p]:[text-transform:uppercase] [&_strong]:[display:block] [&_strong]:[margin-top:0.08rem] [&_strong]:[font-size:1.85rem] [&_strong]:[font-weight:950] [&_strong]:[line-height:1]">
            <p>Tổng xúc xắc</p>
            <strong>{total}</strong>
          </div>
        </div>
      </section>
    );
  }

  if (canRoll) {
    return (
      <section className="dice-stage [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [top:0] [left:0] [width:100vw] [height:100vh] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [padding:max(0.75rem,_env(safe-area-inset-top))_max(0.75rem,_env(safe-area-inset-right))_max(0.75rem,_env(safe-area-inset-bottom))_max(0.75rem,_env(safe-area-inset-left))] [pointer-events:none]" aria-label="Điều khiển tung xúc xắc">
        <div className="dice-roll-controls [width:min(22rem,_92vw)] [display:flex] [flex-direction:column] [align-items:center] [gap:0.7rem] [pointer-events:auto]">
          {IS_DEV_MODE ? (
            <div className="dice-mock-controls [display:flex] [align-items:center] [gap:0.5rem] [padding:0.38rem] [border:1px_solid_rgba(251,_113,_133,_0.18)] [border-radius:0.8rem] [background:var(--game-chrome-bg)] [box-shadow:0_0.5rem_1.5rem_rgba(1,_12,_11,_0.28)] [backdrop-filter:blur(16px)] [&_>_span]:[padding:0_0.28rem] [&_>_span]:[color:#fecdd3] [&_>_span]:[font-size:0.54rem] [&_>_span]:[font-weight:900] [&_>_span]:[letter-spacing:0.1em] [&_>_span]:[text-transform:uppercase] [&_input]:[width:3.15rem] [&_input]:[min-height:44px] [&_input]:[border:1px_solid_rgba(167,_243,_208,_0.14)] [&_input]:[border-radius:0.58rem] [&_input]:[background:rgba(0,_0,_0,_0.2)] [&_input]:[color:white] [&_input]:[font-size:0.72rem] [&_input]:[font-weight:800] [&_input]:[text-align:center] [&_input]:[outline:none] [&_input:focus-visible]:[border-color:var(--game-chrome-gold)] [&_input:focus-visible]:[box-shadow:0_0_0_2px_rgba(255,_220,_93,_0.2)]">
              <span>Mock</span>
              <label className="sr-only" htmlFor="dev-die-1">Xúc xắc thứ nhất</label>
              <input className="font-inter bg-[rgba(255,255,255,0.05)] border-[1.5px_solid_var(--border)] rounded-[0.5333rem] text-[var(--text)] px-[0.9333rem] py-[0.6667rem] text-[1rem] outline-none [transition:border-color_0.15s] focus:[border-color:var(--accent)] placeholder:text-[var(--text2)]" id="dev-die-1" type="number" min="1" max="6" inputMode="numeric" placeholder="D1" value={devD1} onChange={event => setDevD1(event.target.value)} />
              <label className="sr-only" htmlFor="dev-die-2">Xúc xắc thứ hai</label>
              <input className="font-inter bg-[rgba(255,255,255,0.05)] border-[1.5px_solid_var(--border)] rounded-[0.5333rem] text-[var(--text)] px-[0.9333rem] py-[0.6667rem] text-[1rem] outline-none [transition:border-color_0.15s] focus:[border-color:var(--accent)] placeholder:text-[var(--text2)]" id="dev-die-2" type="number" min="1" max="6" inputMode="numeric" placeholder="D2" value={devD2} onChange={event => setDevD2(event.target.value)} />
            </div>
          ) : null}

          <button id="btn-roll" type="button" className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [transition:all_0.15s_ease] ${PRIMARY_BUTTON} dice-roll-button [min-width:13.2rem] [min-height:3.75rem] [border-radius:1rem] [font-size:0.92rem] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:3.4rem]`} onClick={handleRoll}>
            <ActionIcon type="roll" /> Tung xúc xắc
          </button>

          {canAirport ? <p className="dice-instruction [padding:0.48rem_0.78rem] [border:1px_solid_var(--game-chrome-border)] [border-radius:999px] [background:var(--game-chrome-bg)] [box-shadow:0_0.5rem_1.5rem_rgba(1,_12,_11,_0.28)] [color:#d8eee5] [font-size:0.63rem] [font-weight:900] [letter-spacing:0.14em] [text-align:center] [text-transform:uppercase] [backdrop-filter:blur(16px)] [max-width:100%] [letter-spacing:0] [text-transform:none]">Chọn một ô đất hoặc cảng hợp lệ trên bàn cờ.</p> : null}
          {canStartAirport || canPayBail || canUseJailCard ? (
            <div className="dice-secondary-actions [display:flex] [flex-wrap:wrap] [justify-content:center] [gap:0.5rem]">
              {canStartAirport ? <button type="button" className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] rounded-[var(--radius)] [transition:all_0.15s_ease] ${SECONDARY_BUTTON}`} onClick={() => send('startAirportSelect')}><ActionIcon type="plane" /> Mua vé 50K</button> : null}
              {canPayBail ? (
                <button id="btn-bail" type="button" className={`font-inter cursor-pointer touch-manipulation ${JAIL_ACTION_BUTTON} [background:linear-gradient(145deg,_#9f1239,_#e11d48)]`} onClick={() => send('payBail')}>
                  <span className="jail-action-icon"><ActionIcon type="jail" /></span>
                  <span className="jail-action-copy"><small>Thanh toán bảo lãnh</small><strong>Nộp 200K</strong></span>
                </button>
              ) : null}
              {canUseJailCard ? (
                <button type="button" className={`font-inter cursor-pointer touch-manipulation ${JAIL_ACTION_BUTTON} [background:linear-gradient(145deg,_#047857,_#10b981)]`} onClick={() => send('useJailCard')}>
                  <span className="jail-action-icon"><ActionIcon type="card" /></span>
                  <span className="jail-action-copy"><small>Không tốn tiền</small><strong>Dùng thẻ ra tù</strong></span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="dice-action-panel [--game-chrome-primary:var(--color-brand-primary)] [--game-chrome-bg:color-mix(in_srgb,_var(--color-surface-raised)_92%,_transparent)] [--game-chrome-bg-strong:color-mix(in_srgb,_var(--color-surface-canvas)_97%,_transparent)] [--game-chrome-panel:rgba(19,_105,_132,_0.78)] [--game-chrome-border:var(--color-border-subtle)] [--game-chrome-gold:var(--color-status-warning)] [--game-chrome-gold-deep:#d89a08] [--game-chrome-text:var(--color-text-primary)] [--game-chrome-muted:var(--color-text-secondary)] [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_sans-serif] [position:fixed] [top:50%] [left:50%] [z-index:50] [width:min(18rem,_calc(100vw_-_2rem))] [overflow:hidden] [padding:0] [border:1px_solid_rgba(255,_255,_255,_0.16)] [border-radius:1.15rem] [background:radial-gradient(circle_at_50%_0,_rgba(75,_213,_255,_0.16),_transparent_55%),_linear-gradient(155deg,_rgba(8,_38,_54,_0.96),_rgba(4,_21,_32,_0.98))] [box-shadow:0_1.2rem_3.5rem_rgba(1,_15,_24,_0.6),_inset_0_1px_rgba(255,_255,_255,_0.12)] [color:var(--game-chrome-text)] [pointer-events:auto] [transform:translate(-50%,_-50%)] [backdrop-filter:blur(24px)] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0]" aria-label="Bảng điều khiển lượt chơi">
      {canAirport ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-info"><p>Chọn một ô đất hoặc cảng hợp lệ trên bàn cờ.</p></div> : null}
      {canFestival ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-festival"><p>Chọn đất của bạn để tổ chức lễ hội với phí 50K.</p><button type="button" className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] rounded-[var(--radius)] [transition:all_0.15s_ease] ${SECONDARY_BUTTON}`} onClick={() => send('skipFestival')}>Bỏ qua</button></div> : null}
      {isPayingDebt ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-danger"><div><strong>Cần thanh toán {formatMoney(me?.debtAmount || 0)}</strong><p>Chọn tài sản trên bàn cờ để bán và trả nợ.</p></div></div> : null}
      {isRemoteUpgrade ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-success"><p>Chọn một thành phố của bạn để nâng cấp từ xa.</p><button type="button" className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] rounded-[var(--radius)] [transition:all_0.15s_ease] ${SECONDARY_BUTTON}`} onClick={() => send('skipRemoteUpgrade')}>Bỏ qua</button></div> : null}
      {isChanceTileSelection ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-warning"><p>Chọn một ô đang phát sáng trên bàn cờ để dùng thẻ Cơ Hội.</p></div> : null}
      {isChancePlayerSelection ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-warning"><p>Chọn người chơi nhận thành phố trong bảng lựa chọn.</p></div> : null}
      {isBuyout && buyoutTile ? <div className="dice-action-message [min-height:3.6rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:0.85rem] [padding:0.85rem_1rem] [border:none] [border-radius:1.15rem] [background:transparent] [&_p]:[font-size:0.82rem] [&_p]:[line-height:1.4] [&_strong]:[font-size:0.82rem] [&_strong]:[line-height:1.4] [&_p]:[color:#e2f2eb] [&_p]:[font-weight:600] [&_strong]:[display:block] [&_strong]:[color:#ffffff] [&_strong]:[font-size:0.94rem] [&_strong]:[font-weight:900] [&_strong]:[letter-spacing:0.01em] [&_strong_+_p]:[margin-top:0.2rem] [&_strong_+_p]:[color:#c4ded2] [&_strong_+_p]:[font-size:0.76rem] [&.is-info]:[background:radial-gradient(circle_at_50%_0,_rgba(96,_165,_250,_0.22),_transparent_75%)] [&.is-info]:[border-top:2px_solid_#60a5fa] [&.is-festival]:[background:radial-gradient(circle_at_50%_0,_rgba(232,_121,_249,_0.22),_transparent_75%)] [&.is-festival]:[border-top:2px_solid_#e879f9] [&.is-danger]:[background:radial-gradient(circle_at_50%_0,_rgba(251,_113,_133,_0.22),_transparent_75%)] [&.is-danger]:[border-top:2px_solid_#fb7185] [&.is-success]:[background:radial-gradient(circle_at_50%_0,_rgba(85,_231,_162,_0.22),_transparent_75%)] [&.is-success]:[border-top:2px_solid_#55e7a2] [&.is-warning]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-warning]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[background:radial-gradient(circle_at_50%_0,_rgba(255,_220,_93,_0.22),_transparent_75%)] [&.is-buyout]:[border-top:2px_solid_#ffdc5d] [&.is-buyout]:[flex-direction:column] [&.is-buyout]:[align-items:stretch] [&.is-buyout]:[text-align:center] [&.is-buyout]:[gap:0.8rem] [&.is-buyout_>_div:first-child]:[text-align:center] [@media(max-height:480px)_and_(orientation:landscape)]:[min-height:2.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.65rem_0.8rem] is-buyout"><div><strong>Mua lại {buyoutTile.name}?</strong><p>Chi phí {formatMoney(buyoutPrice)}</p></div><div className="dice-action-buttons [display:flex] [flex-wrap:wrap] [justify-content:center] [gap:0.5rem]"><button type="button" className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] rounded-[var(--radius)] [transition:all_0.15s_ease] ${SECONDARY_BUTTON} is-warning`} onClick={() => send('acceptBuyout')}>Mua lại</button><button type="button" className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] rounded-[var(--radius)] [transition:all_0.15s_ease] ${SECONDARY_BUTTON}`} onClick={() => send('skipBuyout')}>Bỏ qua</button></div></div> : null}
    </section>
  );
}

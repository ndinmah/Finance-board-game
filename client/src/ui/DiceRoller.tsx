import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { formatMoney } from '../utils/format';
import './GameChrome.css';

const IS_DEV_MODE = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');
const RESULT_DISPLAY_MS = 1000;
const ROLL_RESPONSE_TIMEOUT_MS = 10000;
const DIE_DOTS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const PRIMARY_BUTTON = 'dice-primary-button';
const SECONDARY_BUTTON = 'dice-secondary-button';

function Die({ value, rolling, delay = false }: { value: number; rolling: boolean; delay?: boolean }) {
  const dots = DIE_DOTS[value] || DIE_DOTS[1];
  return (
    <div className={`dice-die ${rolling ? 'is-rolling' : ''}`} style={delay ? { animationDelay: '50ms' } : undefined} role="img" aria-label={`Xúc xắc ${value} điểm`}>
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={dots.includes(index) ? 'is-visible' : ''} />
      ))}
    </div>
  );
}

function ActionIcon({ type }: { type: 'roll' | 'plane' | 'jail' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dice-action-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="dice-center-status">
        <div className="dice-status-pill is-loading">
          <span aria-hidden="true" />
          Đang chuẩn bị bàn cờ...
        </div>
      </div>
    );
  }

  if (!isActionPanel) {
    return (
      <div className="dice-wait-status">
        <div className="dice-status-pill">
          <span aria-hidden="true" />
          Đang chờ {currentPlayerName || 'người chơi'}
        </div>
      </div>
    );
  }

  if (rolling) {
    return (
      <section className="dice-stage" aria-live="polite" aria-label="Xúc xắc đang xoay">
        <div className="dice-presentation is-rolling">
          <span className="dice-aura" aria-hidden="true" />
          <div className="dice-pair">
            <Die value={displayDice.d1} rolling />
            <Die value={displayDice.d2} rolling delay />
          </div>
          <p className="dice-presentation-label">
            Xúc xắc đang xoay
          </p>
        </div>
      </section>
    );
  }

  if (showResult) {
    const total = displayDice.d1 + displayDice.d2;
    return (
      <section className="dice-stage" aria-live="polite" aria-label={`Kết quả xúc xắc là ${total}`}>
        <div className="dice-presentation is-result">
          <span className="dice-aura" aria-hidden="true" />
          <div className="dice-pair">
            <Die value={displayDice.d1} rolling={false} />
            <Die value={displayDice.d2} rolling={false} />
            {dice.isDouble ? <span className="dice-double-badge">Đổ đôi</span> : null}
          </div>
          <div className="dice-total">
            <p>Tổng xúc xắc</p>
            <strong>{total}</strong>
          </div>
        </div>
      </section>
    );
  }

  if (canRoll) {
    return (
      <section className="dice-stage" aria-label="Điều khiển tung xúc xắc">
        <div className="dice-roll-controls">
          {IS_DEV_MODE ? (
            <div className="dice-mock-controls">
              <span>Mock</span>
              <label className="sr-only" htmlFor="dev-die-1">Xúc xắc thứ nhất</label>
              <input id="dev-die-1" type="number" min="1" max="6" inputMode="numeric" placeholder="D1" value={devD1} onChange={event => setDevD1(event.target.value)} />
              <label className="sr-only" htmlFor="dev-die-2">Xúc xắc thứ hai</label>
              <input id="dev-die-2" type="number" min="1" max="6" inputMode="numeric" placeholder="D2" value={devD2} onChange={event => setDevD2(event.target.value)} />
            </div>
          ) : null}

          <button id="btn-roll" type="button" className={`${PRIMARY_BUTTON} dice-roll-button`} onClick={handleRoll}>
            <ActionIcon type="roll" /> Tung xúc xắc
          </button>

          {canAirport ? <p className="dice-instruction">Chọn một ô đất hoặc cảng hợp lệ trên bàn cờ.</p> : null}
          {canStartAirport || canPayBail || canUseJailCard ? (
            <div className="dice-secondary-actions">
              {canStartAirport ? <button type="button" className={SECONDARY_BUTTON} onClick={() => send('startAirportSelect')}><ActionIcon type="plane" /> Mua vé 50K</button> : null}
              {canPayBail ? <button id="btn-bail" type="button" className={`${SECONDARY_BUTTON} is-danger`} onClick={() => send('payBail')}><ActionIcon type="jail" /> Nộp 200K</button> : null}
              {canUseJailCard ? <button type="button" className={SECONDARY_BUTTON} onClick={() => send('useJailCard')}>Dùng thẻ ra tù</button> : null}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="dice-action-panel" aria-label="Bảng điều khiển lượt chơi">
      {canAirport ? <div className="dice-action-message is-info"><p>Chọn một ô đất hoặc cảng hợp lệ trên bàn cờ.</p></div> : null}
      {canFestival ? <div className="dice-action-message is-festival"><p>Chọn đất của bạn để tổ chức lễ hội với phí 50K.</p><button type="button" className={SECONDARY_BUTTON} onClick={() => send('skipFestival')}>Bỏ qua</button></div> : null}
      {isPayingDebt ? <div className="dice-action-message is-danger"><div><strong>Cần thanh toán {formatMoney(me?.debtAmount || 0)}</strong><p>Chọn tài sản trên bàn cờ để bán và trả nợ.</p></div></div> : null}
      {isRemoteUpgrade ? <div className="dice-action-message is-success"><p>Chọn một thành phố của bạn để nâng cấp từ xa.</p><button type="button" className={SECONDARY_BUTTON} onClick={() => send('skipRemoteUpgrade')}>Bỏ qua</button></div> : null}
      {isChanceTileSelection ? <div className="dice-action-message is-warning"><p>Chọn một ô đang phát sáng trên bàn cờ để dùng thẻ Cơ Hội.</p></div> : null}
      {isChancePlayerSelection ? <div className="dice-action-message is-warning"><p>Chọn người chơi nhận thành phố trong bảng lựa chọn.</p></div> : null}
      {isBuyout && buyoutTile ? <div className="dice-action-message is-buyout"><div><strong>Mua lại {buyoutTile.name}?</strong><p>Chi phí {formatMoney(buyoutPrice)}</p></div><div className="dice-action-buttons"><button type="button" className={`${SECONDARY_BUTTON} is-warning`} onClick={() => send('acceptBuyout')}>Mua lại</button><button type="button" className={SECONDARY_BUTTON} onClick={() => send('skipBuyout')}>Bỏ qua</button></div></div> : null}
    </section>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import './DiceRoller.css';

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRoller() {
  const { currentPlayerId, myPlayerId, turnPhase, dice, players } = useGameStore();
  const [rolling, setRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState({ d1: 1, d2: 1 });
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMyTurn   = currentPlayerId === myPlayerId;
  const canRoll    = isMyTurn && turnPhase === 'wait_roll';
  const canBuy     = isMyTurn && turnPhase === 'buy_decision';
  const canAirport = isMyTurn && turnPhase === 'airport_select';
  const canFestival = isMyTurn && turnPhase === 'festival_select';
  const me = players.get(myPlayerId);

  // When server updates dice, animate then settle
  useEffect(() => {
    if (dice.die1 === 1 && dice.die2 === 1) return;
    setRolling(true);
    let frames = 0;
    rollTimer.current = setInterval(() => {
      setDisplayDice({
        d1: Math.ceil(Math.random() * 6),
        d2: Math.ceil(Math.random() * 6),
      });
      frames++;
      if (frames > 12) {
        clearInterval(rollTimer.current!);
        setDisplayDice({ d1: dice.die1, d2: dice.die2 });
        setRolling(false);
      }
    }, 60);
    return () => { if (rollTimer.current) clearInterval(rollTimer.current); };
  }, [dice.die1, dice.die2]);

  const handleRoll = () => { if (!canRoll || rolling) return; send('rollDice'); };
  const handleBuy  = () => send('buyProperty');
  const handleSkip = () => send('skipBuy');

  // Jail options
  const canPayBail = isMyTurn && me?.isInJail && turnPhase === 'wait_roll';

  return (
    <div className="dice-panel">
      {/* Dice display */}
      <div className={`dice-display ${rolling ? 'rolling' : ''} ${dice.isDouble && !rolling ? 'double' : ''}`}>
        <span className={`die die-1 ${rolling ? 'spin' : ''}`}>
          {DIE_FACES[(displayDice.d1 - 1)]}
        </span>
        <span className={`die die-2 ${rolling ? 'spin' : ''}`} style={{ animationDelay: '0.05s' }}>
          {DIE_FACES[(displayDice.d2 - 1)]}
        </span>
        {dice.isDouble && !rolling && <span className="double-badge">DOUBLE!</span>}
      </div>

      {/* Actions */}
      <div className="dice-actions">
        {canRoll && (
          <button id="btn-roll" className="btn-roll" onClick={handleRoll}>
            🎲 Tung Xúc Xắc
          </button>
        )}
        {canPayBail && (
          <button id="btn-bail" className="btn-bail" onClick={() => send('payBail')}>
            💸 Nộp tiền thoát tù (1,000đ)
          </button>
        )}
        {canBuy && (
          <div className="buy-decision">
            <p className="buy-prompt">Mua đất này?</p>
            <button id="btn-buy"  className="btn-buy"  onClick={handleBuy}>✅ Mua</button>
            <button id="btn-skip" className="btn-skip" onClick={handleSkip}>❌ Bỏ qua</button>
          </div>
        )}
        {canAirport && (
          <p className="action-hint">✈️ Click vào ô trên bản đồ để chọn điểm đến</p>
        )}
        {canFestival && (
          <p className="action-hint">🎉 Click vào đất của bạn để nhân đôi tô</p>
        )}
        {!isMyTurn && turnPhase !== 'game_over' && (
          <p className="waiting-turn">
            ⏳ Lượt của {players.get(currentPlayerId)?.name || '...'}
          </p>
        )}
      </div>
    </div>
  );
}

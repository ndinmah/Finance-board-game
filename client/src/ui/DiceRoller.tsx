import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { formatMoney } from '../utils/format';

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Computed once at module load — never changes during session
const IS_DEV_MODE = window.location.search.includes('dev=1') || window.location.pathname.startsWith('/dev');

export default function DiceRoller() {
  // Narrow selectors: component only re-renders when these specific fields change
  const isMyTurn = useGameStore(s => s.currentPlayerId === s.myPlayerId);
  const turnPhase = useGameStore(s => s.turnPhase);
  const dice = useGameStore(s => s.dice);
  const me = useGameStore(s => s.players.get(s.myPlayerId));
  const currentPlayerName = useGameStore(s => s.players.get(s.currentPlayerId)?.name);
  // Only subscribe to the tile at my current position (for buyout_decision)
  const buyoutTile = useGameStore(s => {
    const myPos = s.players.get(s.myPlayerId)?.position ?? 0;
    return s.board.get(myPos);
  });

  const [rolling, setRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState({ d1: 1, d2: 1 });
  const [devD1, setDevD1] = useState('');
  const [devD2, setDevD2] = useState('');
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const canRoll    = isMyTurn && (turnPhase === 'wait_roll' || turnPhase === 'airport_select');
  const canAirport = isMyTurn && turnPhase === 'airport_select';
  const canFestival = isMyTurn && turnPhase === 'festival_select';
  const isPayingDebt = isMyTurn && turnPhase === 'pay_debt';

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

  const handleRoll = () => { 
    if (!canRoll || rolling) return; 
    if (IS_DEV_MODE) {
      send('rollDice', { d1: parseInt(devD1) || 1, d2: parseInt(devD2) || 1 });
    } else {
      send('rollDice'); 
    }
  };

  // Jail options
  const canPayBail = isMyTurn && turnPhase === 'wait_roll' && me?.isInJail;
  const canStartAirport = isMyTurn && turnPhase === 'wait_roll' && me?.position === 24;


  const hasAction = canRoll || canStartAirport || canPayBail || (isMyTurn && turnPhase === 'buyout_decision');
  const isInteractive = canAirport || canFestival || isPayingDebt || (isMyTurn && turnPhase === 'go_remote_upgrade');
  
  let stateClass = 'hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 bg-[rgba(13,27,62,0.75)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-[2rem] px-5 py-2 shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.3)] z-[500]';
  let isWaiting = true;
  if (canRoll || rolling) {
    stateClass = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent p-0 z-[1000] animate-float-bounce md:p-[2.1333rem_2.6667rem] border-none min-w-auto';
    isWaiting = false;
  } else if (hasAction) {
    stateClass = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent p-0 z-[1000] animate-float-bounce md:p-[2.1333rem_2.6667rem] border-none min-w-auto';
    isWaiting = false;
  } else if (isInteractive) {
    stateClass = 'fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-6 md:top-auto bg-[rgba(13,27,62,0.92)] backdrop-blur-md border-[0.1rem] border-[rgba(74,144,217,0.35)] rounded-[1.3333rem] px-6 py-4 min-w-[20rem] max-w-[90%] shadow-[0_0.8rem_2.4rem_rgba(0,0,0,0.5)] z-[900] animate-slide-up-center md:border-none md:min-w-auto md:p-0';
    isWaiting = false;
  }

  const showRollButton = canRoll && !rolling;
  const showDiceDisplay = rolling || (!canRoll && turnPhase !== 'wait_roll' && (dice.die1 > 1 || dice.die2 > 1));

  return (
    <div className={`flex flex-col items-center gap-4 transition-all duration-300 font-inter ${stateClass} ${isMyTurn ? 'my-turn' : 'other-turn'}`}>
      {/* Dice display */}
      {showDiceDisplay && !isWaiting && (
        <div className={`flex gap-5 items-center relative ${rolling ? 'rolling' : ''} ${dice.isDouble && !rolling ? 'double' : ''}`}>
          <span className={`text-[3.2rem] md:text-[3.7333rem] leading-none select-none drop-shadow-[0_0.2667rem_0.8rem_rgba(0,0,0,0.5)] transition-transform duration-150 text-white ${rolling ? 'animate-die-spin' : ''} ${dice.isDouble && !rolling ? 'animate-double-glow' : ''}`}>
            {DIE_FACES[(displayDice.d1 - 1)]}
          </span>
          <span className={`text-[3.2rem] md:text-[3.7333rem] leading-none select-none drop-shadow-[0_0.2667rem_0.8rem_rgba(0,0,0,0.5)] transition-transform duration-150 text-white ${rolling ? 'animate-die-spin' : ''} ${dice.isDouble && !rolling ? 'animate-double-glow' : ''}`} style={{ animationDelay: '0.05s' }}>
            {DIE_FACES[(displayDice.d2 - 1)]}
          </span>
          {dice.isDouble && !rolling && <span className="absolute -top-[1.4667rem] left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#f5c518] to-[#e67e22] text-[#1a1a00] text-[0.7333rem] font-black px-2.5 py-[0.2rem] rounded-[1.3333rem] whitespace-nowrap shadow-[0_0.2667rem_0.6667rem_rgba(245,197,24,0.4)] tracking-wide">DOUBLE!</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full items-center">
        {showRollButton && (
          <>
            {IS_DEV_MODE && (
              <div className="dev-dice-inputs" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px dashed #ef4444' }}>
                <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 'bold' }}>Mock 🎲:</span>
                <input type="number" min="1" max="6" placeholder="d1" value={devD1} onChange={e => setDevD1(e.target.value)} style={{ width: '45px', textAlign: 'center', background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: '#fff', padding: '2px 0' }} />
                <input type="number" min="1" max="6" placeholder="d2" value={devD2} onChange={e => setDevD2(e.target.value)} style={{ width: '45px', textAlign: 'center', background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: '#fff', padding: '2px 0' }} />
              </div>
            )}
            <button id="btn-roll" className="btn-3d btn-3d-yellow animate-btn-pulse" onClick={handleRoll}>
              {me?.isInJail ? '🎲 Đổ xúc xắc đôi thoát tù' : '🎲 Tung Xúc Xắc'}
            </button>
          </>
        )}
        {canStartAirport && (
          <button className="btn-3d btn-3d-green" onClick={() => send('startAirportSelect')} style={{ width: '100%', marginTop: '10px' }}>
            ✈️ Mua vé bay (50K)
          </button>
        )}
        {canPayBail && (
          <>
            <button id="btn-bail" className="btn-3d btn-3d-red" onClick={() => send('payBail')} style={{ width: '100%' }}>
              💸 Trả nóng 200K
            </button>
            {me?.hasJailCard ? (
              <button className="btn-3d btn-3d-green" onClick={() => send('useJailCard')} style={{ width: '100%' }}>
                🎟 Dùng thẻ ra tù
              </button>
            ) : (
              <button className="btn-3d" disabled style={{ width: '100%' }}>
                🎟 Dùng thẻ ra tù (Chưa có)
              </button>
            )}
          </>
        )}

        {isMyTurn && turnPhase === 'buyout_decision' && (
          <div className="flex flex-col items-center gap-2.5 w-full">
            {(() => {
              const tile = buyoutTile;
              if (!tile || !me) return null;
              const totalValue = tile.price + (tile.houseCount * tile.buildCost);
              const buyoutPrice = totalValue * 2;
              return (
                <>
                  <p className="text-base font-extrabold text-gold text-center">Cướp {tile.name}?</p>
                  <p className="text-[0.8rem] my-1 text-gold text-center">Giá: {formatMoney(buyoutPrice)} (x2 gốc)</p>
                  <div className="flex gap-1.5 w-full">
                    <button className="btn-3d btn-3d-red flex-1" onClick={() => send('acceptBuyout')}>⚔️ Cướp Đất</button>
                    <button className="btn-3d btn-secondary flex-1" onClick={() => send('skipBuyout')}>❌ Bỏ qua</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        {canAirport && (
          <p className="text-[0.8667rem] text-accent2 italic text-center leading-[1.4]">✈️ Click vào ô trên bản đồ để chọn điểm đến</p>
        )}
        {canFestival && (
          <div className="flex flex-col items-center gap-2.5 w-full">
            <p className="text-[0.8667rem] text-accent2 italic text-center leading-[1.4]">🎉 Click vào đất của bạn để tổ chức sự kiện (phí: 50K)</p>
            <div className="flex justify-center mt-2.5 w-full">
              <button className="btn-3d btn-secondary w-full" onClick={() => send('skipFestival')}>❌ Bỏ qua</button>
            </div>
          </div>
        )}
        {isPayingDebt && (
          <div className="flex flex-col items-center gap-2.5 w-full">
            <p className="text-base font-extrabold text-red-500 text-center">CẢNH BÁO NỢ NẦN</p>
            <p className="text-[0.9333rem] my-1 text-center text-white">Bạn đang nợ <strong>{formatMoney(me?.debtAmount || 0)}</strong></p>
            <p className="text-[0.8667rem] text-accent2 italic text-center leading-[1.4]">⚠️ Click vào đất của bạn để bán trả nợ (giá 50%)</p>
          </div>
        )}
        {isMyTurn && turnPhase === 'go_remote_upgrade' && (
          <div className="flex flex-col items-center gap-2.5 w-full">
            <p className="text-[0.8667rem] text-[#0ea5e9] italic text-center leading-[1.4]">✨ Click vào một ô đất của bạn trên bàn cờ để nâng cấp từ xa!</p>
            <div className="flex justify-center mt-2.5 w-full">
              <button className="btn-3d btn-secondary w-full" onClick={() => send('skipRemoteUpgrade')}>❌ Bỏ qua</button>
            </div>
          </div>
        )}
        {!isMyTurn && turnPhase !== 'game_over' && (
          <p className="text-sm text-text2 font-medium flex items-center gap-1.5">
            ⏳ Lượt của {currentPlayerName || '...'}
          </p>
        )}
      </div>
    </div>
  );
}

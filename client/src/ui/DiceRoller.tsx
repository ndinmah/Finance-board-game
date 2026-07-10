import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import './DiceRoller.css';

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRoller() {
  const { currentPlayerId, myPlayerId, turnPhase, dice, players, board } = useGameStore();
  const [rolling, setRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState({ d1: 1, d2: 1 });
  const [devMode] = useState(() => window.location.search.includes('dev=1'));
  const [devD1, setDevD1] = useState('');
  const [devD2, setDevD2] = useState('');
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMyTurn   = currentPlayerId === myPlayerId;
  const canRoll    = isMyTurn && (turnPhase === 'wait_roll' || turnPhase === 'airport_select');
  const canBuy     = isMyTurn && turnPhase === 'buy_decision';
  const canAirport = isMyTurn && turnPhase === 'airport_select';
  const canFestival = isMyTurn && turnPhase === 'festival_select';
  const isPayingDebt = isMyTurn && turnPhase === 'pay_debt';
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

  const handleRoll = () => { 
    if (!canRoll || rolling) return; 
    if (devMode) {
      send('rollDice', { d1: parseInt(devD1) || 1, d2: parseInt(devD2) || 1 });
    } else {
      send('rollDice'); 
    }
  };
  const handleSkip = () => send('skipBuy');

  // Jail options
  const canPayBail = isMyTurn && turnPhase === 'wait_roll' && me?.isInJail;
  const canStartAirport = isMyTurn && turnPhase === 'wait_roll' && me?.position === 24;

  const getMaxHouses = (passCount: number, currentHouses: number) => {
    if (passCount === 0) return 2;
    if (currentHouses < 3) return 3;
    return 4;
  };
  console.log('[DiceRoller] isMyTurn:', isMyTurn, 'turnPhase:', turnPhase, 'position:', me?.position, 'canStartAirport:', canStartAirport);

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
          <>
            {devMode && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="text" placeholder="d1" value={devD1} onChange={e => setDevD1(e.target.value)} style={{ width: '40px', textAlign: 'center' }} />
                <input type="text" placeholder="d2" value={devD2} onChange={e => setDevD2(e.target.value)} style={{ width: '40px', textAlign: 'center' }} />
              </div>
            )}
            <button id="btn-roll" className="btn-roll" onClick={handleRoll}>
              {me?.isInJail ? '🎲 Đổ xúc xắc đôi thoát tù' : '🎲 Tung Xúc Xắc'}
            </button>
          </>
        )}
        {canStartAirport && (
          <button className="btn-bail" onClick={() => send('startAirportSelect')} style={{ background: '#4CAF50' }}>
            ✈️ Mua vé bay (50đ)
          </button>
        )}
        {canPayBail && (
          <>
            <button id="btn-bail" className="btn-bail" onClick={() => send('payBail')}>
              💸 Trả nóng 200đ
            </button>
            <button className="btn-bail" disabled style={{ background: '#ccc', cursor: 'not-allowed', opacity: 0.7 }}>
              🎟 Dùng thẻ ra tù (Chưa có)
            </button>
          </>
        )}
        {canBuy && (
          <div className="buy-decision">
            <p className="buy-prompt">Mua {board.get(me?.position || 0)?.name}?</p>
            {(() => {
              const tile = board.get(me?.position || 0);
              if (!tile || !me) return null;
              if (tile.tileType === 'port') {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    {me.money >= tile.price && (
                      <button className="btn-buy" onClick={() => send('buyProperty', { houses: 0 })}>✅ Mua Cảng ({tile.price.toLocaleString()}đ)</button>
                    )}
                    <button className="btn-skip" onClick={handleSkip}>❌ Bỏ qua</button>
                  </div>
                );
              }
              const maxHouses = getMaxHouses(me.passCount || 0, 0);
              const options = [];
              for (let h = 0; h <= maxHouses; h++) {
                const cost = tile.price + h * tile.buildCost;
                if (me.money >= cost) {
                  const label = h === 0 ? 'Chỉ mua đất' : `Đất + ${h} nhà`;
                  options.push(
                    <button key={h} className="btn-buy" onClick={() => send('buyProperty', { houses: h })}>
                      ✅ {label} ({cost.toLocaleString()}đ)
                    </button>
                  );
                }
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  {options}
                  <button className="btn-skip" onClick={handleSkip}>❌ Bỏ qua</button>
                </div>
              );
            })()}
          </div>
        )}
        {isMyTurn && turnPhase === 'upgrade_decision' && (
          <div className="buy-decision">
            <p className="buy-prompt">Nâng cấp {board.get(me?.position || 0)?.name}?</p>
            {(() => {
              const tile = board.get(me?.position || 0);
              if (!tile || !me) return null;
              
              const maxHouses = getMaxHouses(me.passCount || 0, tile.houseCount);
              const options = [];
              for (let target = tile.houseCount + 1; target <= maxHouses; target++) {
                let cost = 0;
                for (let i = tile.houseCount + 1; i <= target; i++) {
                  cost += (i === 4 ? tile.hotelCost : tile.buildCost);
                }
                if (me.money >= cost) {
                  const label = target === 4 ? 'Khách sạn' : `Nhà ${target}`;
                  options.push(
                    <button key={target} className="btn-buy" style={{ background: '#FF9800' }} onClick={() => send('upgradeProperty', { targetHouses: target })}>
                      🔨 Lên {label} ({cost.toLocaleString()}đ)
                    </button>
                  );
                }
              }
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  {options}
                  <button className="btn-skip" onClick={() => send('skipUpgrade')}>❌ Bỏ qua</button>
                </div>
              );
            })()}
          </div>
        )}
        {isMyTurn && turnPhase === 'buyout_decision' && (
          <div className="buy-decision buyout-decision">
            {(() => {
              const tile = board.get(me?.position || 0);
              if (!tile || !me) return null;
              const totalValue = tile.price + (tile.houseCount * tile.buildCost);
              const buyoutPrice = totalValue * 2;
              return (
                <>
                  <p className="buy-prompt">Cướp {tile.name}?</p>
                  <p style={{fontSize: '12px', margin: '4px 0', color: '#ffc107', textAlign: 'center'}}>Giá: {buyoutPrice.toLocaleString()}đ (x2 gốc)</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-buy" style={{background: '#e11d48'}} onClick={() => send('acceptBuyout')}>⚔️ Cướp Đất</button>
                    <button className="btn-skip" onClick={() => send('skipBuyout')}>❌ Bỏ qua</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        {canAirport && (
          <p className="action-hint">✈️ Click vào ô trên bản đồ để chọn điểm đến</p>
        )}
        {canFestival && (
          <p className="action-hint">🎉 Click vào đất của bạn để nhân đôi tô</p>
        )}
        {isPayingDebt && (
          <div className="buy-decision">
            <p className="buy-prompt" style={{color: '#ef4444'}}>CẢNH BÁO NỢ NẦN</p>
            <p style={{fontSize: '14px', margin: '4px 0', textAlign: 'center'}}>Bạn đang nợ <strong>{me?.debtAmount?.toLocaleString()}đ</strong></p>
            <p className="action-hint">⚠️ Click vào đất của bạn để bán trả nợ (giá 50%)</p>
          </div>
        )}
        {isMyTurn && turnPhase === 'go_remote_upgrade' && (
          <div className="buy-decision">
            <p className="action-hint" style={{ color: '#0ea5e9' }}>✨ Click vào một ô đất của bạn trên bàn cờ để nâng cấp từ xa!</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button className="btn-skip" onClick={() => send('skipRemoteUpgrade')}>❌ Bỏ qua</button>
            </div>
          </div>
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

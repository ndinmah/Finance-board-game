import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { MAP_TILE_COLORS } from '../game/tileConstants';
import { formatMoneyFull } from '../utils/format';
import './CardModal.css';
import './BuyUpgradeModal.css';
export default function BuyUpgradeModal() {
  const { currentPlayerId, myPlayerId, turnPhase, board, players } = useGameStore();
  const isMyTurn = currentPlayerId === myPlayerId;
  const isBuy = isMyTurn && turnPhase === 'buy_decision';
  const isUpgrade = isMyTurn && turnPhase === 'upgrade_decision';
  const isActive = isBuy || isUpgrade;
  const me = players.get(myPlayerId);
  const tile = board.get(me?.position || 0);
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const getMaxHouses = (passCount: number, currentHouses: number) => {
    if (passCount === 0) return 2;
    if (currentHouses < 3) return 3;
    return 4;
  };
  useEffect(() => {
    if (isActive && tile && me) {
      const maxAllowed = getMaxHouses(me.passCount || 0, tile.houseCount);
      // Default select the max level they can afford and are allowed to buy
      let bestLevel = tile.houseCount;
      for (let h = tile.houseCount + (isBuy ? 0 : 1); h <= maxAllowed; h++) {
        let cost = isBuy ? tile.price : 0;
        if (isBuy) {
           cost += h * tile.buildCost;
        } else {
           for (let i = tile.houseCount + 1; i <= h; i++) {
             cost += (i === 4 ? tile.hotelCost : tile.buildCost);
           }
        }
        if (me.money >= cost) {
          bestLevel = h;
        }
      }
      // if buying, and can't afford anything, default to 0. if upgrade, default to current + 1.
      if (bestLevel === tile.houseCount && isUpgrade) {
          bestLevel = tile.houseCount + 1; // might not afford, but just to show selection
      }
      if (isBuy && bestLevel === tile.houseCount) {
          // Can afford at least land?
          bestLevel = 0;
      }
      setSelectedLevel(Math.min(bestLevel, maxAllowed));
    }
  }, [isActive, tile?.id, me?.money, me?.passCount, turnPhase]);
  if (!isActive || !tile || !me) return null;

  const handleSkip = () => {
    if (isBuy) send('skipBuy');
    else send('skipUpgrade');
  };

  const headerColor = me.color ? (me.color.startsWith('#') ? me.color : `#${me.color}`) : '#9e9e9e';

  if (tile.tileType === 'port') {
    const ownedPorts = Array.from(board.values()).filter(t => t.tileType === 'port' && t.ownerId === myPlayerId).length;
    const nextPortCount = Math.min(4, ownedPorts + 1);
    const portPrice = tile.price || 200;
    const canAfford = me.money >= portPrice;
    const rentMap: Record<number, number> = { 1: 25, 2: 50, 3: 100, 4: 0 };
    const expectedRent = rentMap[nextPortCount] || 0;

    return (
      <div className="card-modal-backdrop" style={{ zIndex: 1000 }}>
        <div className="card-modal-wrapper">
          <div className="card-modal">
            <div className="card-header" style={{ backgroundColor: headerColor }}>
              <h3>{tile.name}</h3>
              <button className="card-modal-close" onClick={handleSkip}>✕</button>
            </div>
            <div className="card-body" style={{ padding: '20px' }}>
            <div className="port-layout-columns">
              <div className="port-column-left">
                <div className="port-image-box">
                  <img src="/images/port.webp" alt="Resort" className="card-illustration-img" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px' }} />
                </div>
              </div>
              <div className="port-column-right">
                <p className="port-description">
                  Tiền thuê phải trả phụ thuộc vào số lượng các cảng khác mà người chơi sở hữu
                </p>
                <table className="port-rent-table">
                  <tbody>
                    <tr className={nextPortCount === 1 ? 'highlighted' : ''}>
                      <td className="rent-label">1 cảng</td>
                      <td className="rent-value">{formatMoneyFull(25)} <span className="coin-icon">$</span></td>
                    </tr>
                    <tr className={nextPortCount === 2 ? 'highlighted' : ''}>
                      <td className="rent-label">2 cảng</td>
                      <td className="rent-value">{formatMoneyFull(50)} <span className="coin-icon">$</span></td>
                    </tr>
                    <tr className={nextPortCount === 3 ? 'highlighted' : ''}>
                      <td className="rent-label">3 cảng</td>
                      <td className="rent-value">{formatMoneyFull(100)} <span className="coin-icon">$</span></td>
                    </tr>
                    <tr className={nextPortCount === 4 ? 'highlighted' : ''}>
                      <td className="rent-label">4 cảng</td>
                      <td className="rent-value">THẮNG LẬP TỨC! 🏆</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="port-action-section">
              <div className="port-rent-preview">
                Giá thuê: <strong>{formatMoneyFull(expectedRent)}</strong> <span className="money-icon">$</span>
              </div>
              <button
                className={`port-buy-button ${!canAfford ? 'disabled' : ''}`}
                onClick={() => {
                  if (canAfford) send('buyProperty', { houses: 0 });
                }}
                disabled={!canAfford}
              >
                MUA VỚI GIÁ {formatMoneyFull(portPrice)} <span className="money-icon">$</span>
              </button>
              <div className="port-footer-note">
                Các cảng không thể bị mua lại (cướp đất)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  const maxAllowed = getMaxHouses(me.passCount || 0, tile.houseCount);
  const accentColor = tile.colorGroup ? `#${(MAP_TILE_COLORS[tile.colorGroup] || 0x888888).toString(16).padStart(6, '0')}` : '#e91e63'; // fallback pink
  // Calculate costs and rent for the selected level
  let totalCost = 0;
  if (isBuy) {
    totalCost = tile.price + selectedLevel * tile.buildCost;
    if (selectedLevel === 4) totalCost = tile.price + 3 * tile.buildCost + tile.hotelCost; // edge case if they can buy hotel directly
  } else {
    for (let i = tile.houseCount + 1; i <= selectedLevel; i++) {
      totalCost += (i === 4 ? tile.hotelCost : tile.buildCost);
    }
  }
  let rentAtLevel = tile.baseRent;
  if (selectedLevel === 1) rentAtLevel = tile.rent1;
  else if (selectedLevel === 2) rentAtLevel = tile.rent2;
  else if (selectedLevel === 3) rentAtLevel = tile.rent3;
  else if (selectedLevel === 4) rentAtLevel = tile.rentHotel;
  if (tile.hasMonopoly && selectedLevel === 0) rentAtLevel *= 2;
  if (tile.isTouristSpot) rentAtLevel *= 2;
  const totalValueAtLevel = tile.price + (selectedLevel === 4 ? 3 * tile.buildCost + tile.hotelCost : selectedLevel * tile.buildCost);
  const buyoutPrice = totalValueAtLevel * 2;
  const canAfford = me.money >= totalCost;
  const handleConfirm = () => {
    if (!canAfford) return;
    if (isBuy) {
      send('buyProperty', { houses: selectedLevel });
    } else {
      send('upgradeProperty', { targetHouses: selectedLevel });
    }
  };
  const cards = [
    { level: 0, label: 'Đất', icon: '🚩', maxAllowed: 0 },
    { level: 1, label: 'Nhà 1', icon: '🏠', maxAllowed: 1 },
    { level: 2, label: 'Nhà 2', icon: '🏘️', maxAllowed: 2 },
    { level: 3, label: 'Nhà 3', icon: '🏢', maxAllowed: 3 },
  ];
  return (
    <div className="card-modal-backdrop" style={{ zIndex: 1000 }}>
      <div className="card-modal-wrapper">
        <div className="card-modal">
          <div className="card-header" style={{ backgroundColor: headerColor }}>
            <h3>{tile.name.toUpperCase()}</h3>
            <button className="card-modal-close" onClick={handleSkip}>✕</button>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
          <div className="bu-cards-container">
            {cards.map((card) => {
              const isBuilt = card.level <= tile.houseCount && !isBuy;
              const isAllowed = card.level <= maxAllowed;
              const isSelected = selectedLevel >= card.level;
              const isDisabled = isBuilt || !isAllowed;
              return (
                <div
                  key={card.level}
                  className={`bu-card ${isDisabled ? 'disabled' : ''} ${selectedLevel === card.level ? 'active' : ''}`}
                  onClick={() => {
                    if (!isDisabled) setSelectedLevel(card.level);
                  }}
                >
                  <div className="bu-card-iso">
                     <div className="bu-card-tile"></div>
                     <span className="bu-card-icon">{card.icon}</span>
                  </div>
                  <div className="bu-card-label">{card.label}</div>

                  {/* Checkbox */}
                  <div className={`bu-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && '✔'}
                  </div>
                  {!isAllowed && (
                     <div className="bu-card-badge">
                       Không thực hiện được ở vòng đầu tiên
                     </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="bu-info-section">
            <div className="bu-rent-info">
              Giá thuê: <strong>{formatMoneyFull(rentAtLevel)}</strong> <span className="money-icon">$</span>
            </div>
            <button
              className={`bu-buy-btn ${!canAfford ? 'disabled' : ''}`}
              onClick={handleConfirm}
              disabled={!canAfford}
            >
              {isBuy ? 'MUA VỚI GIÁ' : 'NÂNG CẤP VỚI GIÁ'} {formatMoneyFull(totalCost)} <span className="money-icon">$</span>
            </button>
            <div className="bu-buyout-info">
              Những người chơi khác có thể sẽ mua lại bằng: <strong>{formatMoneyFull(buyoutPrice)}</strong> <span className="money-icon">$</span>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

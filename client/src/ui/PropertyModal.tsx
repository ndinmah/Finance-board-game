
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { MAP_TILE_COLORS } from '../game/tileConstants';
import './PropertyModal.css';

interface Props { tileId: number; onClose: () => void; }

export default function PropertyModal({ tileId, onClose }: Props) {
  const { board, players, myPlayerId, turnPhase, currentPlayerId } = useGameStore();
  const tile = board.get(tileId);
  if (!tile || (tile.tileType !== 'property' && tile.tileType !== 'port')) { onClose(); return null; }

  const owner   = tile.ownerId ? players.get(tile.ownerId) : null;
  const me      = players.get(myPlayerId);
  const isOwner = tile.ownerId === myPlayerId;
  const isMyTurn = currentPlayerId === myPlayerId;
  const accentColor = tile.colorGroup ? `#${(MAP_TILE_COLORS[tile.colorGroup] || 0x888888).toString(16).padStart(6, '0')}` : '#666';

  const getMaxHouses = (passCount: number, currentHouses: number) => {
    if (passCount === 0) return 2;
    if (currentHouses < 3) return 3;
    return 4;
  };

  const houseLabel  = tile.tileType === 'port' ? 'Cảng' : (tile.houseCount === 4 ? 'Khách sạn' : tile.houseCount > 0 ? `${tile.houseCount} nhà` : 'Đất trống');

  const handleAirportSelect = () => { send('selectAirport', { tileId }); onClose(); };
  const handleFestivalSelect = () => { send('selectFestival', { tileId }); onClose(); };
  const handleSellForDebt = () => { send('sellForDebt', { tileId }); onClose(); };

  let sellValue = tile.price;
  if (tile.tileType !== 'port' && tile.houseCount > 0) {
    if (tile.houseCount === 4) {
      sellValue += (tile.buildCost * 3 + tile.hotelCost);
    } else {
      sellValue += tile.houseCount * tile.buildCost;
    }
  }
  sellValue = Math.floor(sellValue * 0.5);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="property-modal" onClick={e => e.stopPropagation()} style={{ '--accent': accentColor } as any}>
        {/* Color header */}
        <div className="property-header" style={{ background: accentColor }}>
          <span className="property-icon">{tile.tileType === 'port' ? '⚓' : '🏢'}</span>
          <h3>{tile.name}</h3>
          {tile.colorGroup && <span className="group-badge">{tile.colorGroup.toUpperCase()}</span>}
          {tile.tileType === 'port' && <span className="group-badge" style={{background: '#0284c7'}}>PORT</span>}
          {tile.isTouristSpot && <span className="group-badge" style={{background: '#f59e0b', fontSize: '10px'}}>🏖️ DU LỊCH (x2)</span>}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="property-body">
          {/* Status */}
          <div className="property-status">
            <span className={`status-chip ${tile.ownerId ? 'owned' : 'free'}`}>
              {tile.ownerId ? `👤 ${owner?.name || 'Có chủ'}` : '🟢 Đất trống'}
            </span>
            <span className="house-label">{houseLabel}</span>
          </div>

          {/* Price table */}
          {tile.tileType === 'property' ? (
            <table className="rent-table">
              <thead><tr><th>Trạng thái</th><th>Tô</th></tr></thead>
              <tbody>
                {[
                  ['Đất trống', tile.baseRent],
                  ['1 nhà',     tile.rent1],
                  ['2 nhà',     tile.rent2],
                  ['3 nhà',     tile.rent3],
                  ['Khách sạn', tile.rentHotel],
                ].map(([label, val], i) => {
                  let actualVal = val as number;
                  let displayLabel = label as string;
                  
                  if (tile.hasMonopoly) {
                    actualVal *= 2;
                    displayLabel += ' (Độc quyền x2)';
                  }
                  if (tile.isTouristSpot) {
                    actualVal *= 2;
                    displayLabel += ' (Du Lịch x2)';
                  }
                  
                  return (
                    <tr key={i} className={tile.currentRent === actualVal ? 'current-row' : ''}>
                      <td>{displayLabel}</td>
                      <td>{actualVal.toLocaleString()}đ</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', lineHeight: '1.4' }}>
              <p style={{ margin: '0 0 8px 0', color: '#38bdf8', fontWeight: 'bold' }}>Phí qua cảng:</p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>1 Cảng: 25đ</li>
                <li>2 Cảng: 50đ</li>
                <li>3 Cảng: 75đ</li>
                <li style={{ color: '#fbbf24' }}>4 Cảng: <strong>THẮNG NGAY LẬP TỨC!</strong></li>
              </ul>
            </div>
          )}

          <div className="property-meta">
            <span>💰 Giá mua: <strong>{tile.price.toLocaleString()}đ</strong></span>
            {tile.tileType === 'property' && <span>🔨 Xây nhà: <strong>{tile.buildCost.toLocaleString()}đ</strong></span>}
          </div>

          {/* Remote upgrade actions */}
          {isOwner && isMyTurn && turnPhase === 'go_remote_upgrade' && tile.tileType === 'property' && (
            <div className="property-actions">
              {(() => {
                const maxHouses = getMaxHouses(me?.passCount || 0, tile.houseCount);
                const options = [];
                for (let target = tile.houseCount + 1; target <= maxHouses; target++) {
                  let cost = 0;
                  for (let i = tile.houseCount + 1; i <= target; i++) {
                    cost += (i === 4 ? tile.hotelCost : tile.buildCost);
                  }
                  if ((me?.money || 0) >= cost) {
                    const label = target === 4 ? 'Khách sạn' : `Nhà ${target}`;
                    options.push(
                      <button key={target} className="btn-upgrade" style={{ background: '#0ea5e9' }}
                        onClick={() => { send('remoteUpgradeProperty', { tileId, targetHouses: target }); onClose(); }}>
                        ✨ Nâng cấp lên {label} ({cost.toLocaleString()}đ)
                      </button>
                    );
                  }
                }
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {options.length > 0 ? options : (
                      <p style={{fontSize: '12px', color: '#888', textAlign: 'center'}}>Không đủ điều kiện nâng cấp mảnh đất này.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Airport selection */}
          {turnPhase === 'airport_select' && currentPlayerId === myPlayerId && (
            <button className="btn-airport-select" onClick={handleAirportSelect}>
              ✈️ Bay đến đây!
            </button>
          )}

          {/* Festival selection */}
          {turnPhase === 'festival_select' && currentPlayerId === myPlayerId && isOwner && (
            <button className="btn-festival-select" onClick={handleFestivalSelect}>
              🎉 Tổ chức Lễ Hội (50đ)
            </button>
          )}

          {/* Sell for Debt */}
          {turnPhase === 'pay_debt' && currentPlayerId === myPlayerId && isOwner && (
            <button className="btn-mortgage" style={{background: '#ef4444', marginTop: '12px'}} onClick={handleSellForDebt}>
              ⚠️ Bán trả nợ (nhận {sellValue.toLocaleString()}đ)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

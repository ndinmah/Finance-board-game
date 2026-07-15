
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { MAP_TILE_COLORS } from '../game/tileConstants';
import { formatMoneyFull } from '../utils/format';
import './CardModal.css';
import './PropertyModal.css';

interface Props { tileId: number; onClose: () => void; }

// Map colorGroup to illustration image
const GROUP_IMAGE: Record<string, string> = {
  red:    '/images/red.webp',
  orange: '/images/orange.webp',
  yellow: '/images/yellow.webp',
  green:  '/images/green.webp',
  blue:   '/images/blue.webp',
  purple: '/images/purple.webp',
  pink:   '/images/pink.webp',
  cyan:   '/images/cyan.webp',
};

export default function PropertyModal({ tileId, onClose }: Props) {
  const { board, players, myPlayerId, turnPhase, currentPlayerId } = useGameStore();
  const tile = board.get(tileId);
  if (!tile || (tile.tileType !== 'property' && tile.tileType !== 'port')) { onClose(); return null; }

  const owner    = tile.ownerId ? players.get(tile.ownerId) : null;
  const me       = players.get(myPlayerId);
  const isOwner  = tile.ownerId === myPlayerId;
  const isMyTurn = currentPlayerId === myPlayerId;

  // Header band color: owner color if owned, neutral gray if not
  const ownerColor = owner?.color
    ? (owner.color.startsWith('#') ? owner.color : `#${owner.color}`)
    : null;
  const headerColor = ownerColor ?? '#9e9e9e';

  // Tile group accent (still used for pill)
  const accentColor = tile.colorGroup
    ? `#${(MAP_TILE_COLORS[tile.colorGroup] || 0x888888).toString(16).padStart(6, '0')}`
    : '#888';

  // Upgrade rows for property
  const upgradeRows = tile.tileType === 'property' ? [
    { label: 'Đất',       level: 0, cost: tile.price,        rent: tile.baseRent  },
    { label: 'Nhà 1',     level: 1, cost: tile.buildCost,    rent: tile.rent1     },
    { label: 'Nhà 2',     level: 2, cost: tile.buildCost,    rent: tile.rent2     },
    { label: 'Nhà 3',     level: 3, cost: tile.buildCost,    rent: tile.rent3     },
    { label: 'Khách sạn', level: 4, cost: tile.hotelCost,    rent: tile.rentHotel },
  ] : [];

  // Determine row state
  const getRowState = (level: number) => {
    if (!tile.ownerId) return 'upcoming';
    if (level < tile.houseCount) return 'done';
    if (level === tile.houseCount) return 'current';
    return 'upcoming';
  };

  const getMaxHouses = (passCount: number, currentHouses: number) => {
    if (passCount === 0) return 2;
    if (currentHouses < 3) return 3;
    return 4;
  };

  let totalValue = tile.price;
  if (tile.tileType !== 'port' && tile.houseCount > 0) {
    if (tile.houseCount === 4) {
      totalValue += (tile.buildCost * 3 + tile.hotelCost);
    } else {
      totalValue += tile.houseCount * tile.buildCost;
    }
  }
  const mortgageValue = Math.floor(totalValue * 0.5);
  const buyoutValue = totalValue * 2;

  const displayRent = tile.ownerId ? tile.currentRent : 0;

  const handleAirportSelect  = () => { send('selectAirport',  { tileId }); onClose(); };
  const handleFestivalSelect = () => { send('selectFestival', { tileId }); onClose(); };
  const handleSellForDebt    = () => { send('sellForDebt',    { tileId }); onClose(); };

  // Illustration image based on tileType / colorGroup
  const illustrationSrc = tile.tileType === 'port'
    ? '/images/port.webp'
    : GROUP_IMAGE[tile.colorGroup ?? ''] ?? '/images/red.webp';

  return (
    <div className="card-modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="card-modal-wrapper" style={{ maxWidth: '520px' }}>
        <div
          className="card-modal"
          onClick={e => e.stopPropagation()}
          style={{ '--accent': accentColor } as any}
        >
          {/* ── Header band ── */}
        <div className="card-header" style={{ background: headerColor, padding: '16px 24px' }}>
          <h3 style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{tile.name}</h3>
          <button className="card-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="property-body">
          <div className="property-content-row">

            {/* Left: property illustration */}
            <div className="property-image-col">
              <img
                src={illustrationSrc}
                alt={tile.name}
                className="property-image"
              />
            </div>

            {/* Right: upgrade table or port info */}
            <div className="property-table-col">
              {tile.tileType === 'property' ? (
                <table className="upgrade-table">
                  <thead>
                    <tr>
                      <th>Xây dựng</th>
                      <th>Giá nâng cấp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgradeRows.map(({ label, level, cost }) => {
                      const state = getRowState(level);
                      const isCurrent = state === 'current';
                      const isDone    = state === 'done';
                      return (
                        <tr key={level} className={
                          isCurrent ? 'row-current' :
                          isDone    ? 'row-done'    : ''
                        }>
                          <td>
                            {isDone ? (
                              <span className="row-check">✓</span>
                            ) : isCurrent ? (
                              <span className="row-check current">✓</span>
                            ) : (
                              <span className="row-check empty" style={{ width: 16, height: 16, display: 'inline-block' }} />
                            )}
                            {label}
                          </td>
                          <td>
                            {formatMoneyFull(cost)} <span className="coin-icon">$</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="upgrade-table">
                  <thead>
                    <tr>
                      <th>Sở hữu</th>
                      <th>Phí qua cảng</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1 Cảng</td>
                      <td>{formatMoneyFull(25)} <span className="coin-icon">$</span></td>
                    </tr>
                    <tr>
                      <td>2 Cảng</td>
                      <td>{formatMoneyFull(50)} <span className="coin-icon">$</span></td>
                    </tr>
                    <tr>
                      <td>3 Cảng</td>
                      <td>{formatMoneyFull(100)} <span className="coin-icon">$</span></td>
                    </tr>
                    <tr>
                      <td>4 Cảng</td>
                      <td style={{ color: '#e67e22', fontWeight: 900 }}>THẮNG NGAY! 🏆</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Footer: price info ── */}
          <div className="property-footer">
            {tile.ownerId && tile.tileType === 'property' && (
              <div className="footer-line">
                Giá mua lại <strong>{formatMoneyFull(buyoutValue)}</strong>
                <span className="coin-icon">$</span>
              </div>
            )}
            <div className="footer-line">
              Giá thuê hiện tại{' '}
              <strong>{formatMoneyFull(displayRent)}</strong>
              <span className="coin-icon">$</span>
            </div>
          </div>

          {/* ── Remote upgrade actions ── */}
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
                      <button key={target} className="btn-upgrade"
                        onClick={() => { send('remoteUpgradeProperty', { tileId, targetHouses: target }); onClose(); }}>
                        ✨ Nâng cấp lên {label} ({formatMoneyFull(cost)})
                      </button>
                    );
                  }
                }
                return options.length > 0 ? options : (
                  <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', margin: 0 }}>
                    Không đủ điều kiện nâng cấp mảnh đất này.
                  </p>
                );
              })()}
            </div>
          )}

          {/* ── Airport / Festival / Sell actions ── */}
          {turnPhase === 'airport_select' && currentPlayerId === myPlayerId && (
            <div className="property-actions">
              <button className="btn-airport-select" onClick={handleAirportSelect}>
                ✈️ Bay đến đây!
              </button>
            </div>
          )}

          {turnPhase === 'festival_select' && currentPlayerId === myPlayerId && isOwner && (
            <div className="property-actions">
              <button className="btn-festival-select" onClick={handleFestivalSelect}>
                🎉 Tổ chức Lễ Hội (50K)
              </button>
            </div>
          )}

          {turnPhase === 'pay_debt' && currentPlayerId === myPlayerId && isOwner && (
            <div className="property-actions">
              <button className="btn-mortgage" onClick={handleSellForDebt}>
                ⚠️ Bán trả nợ (nhận {formatMoneyFull(mortgageValue)})
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

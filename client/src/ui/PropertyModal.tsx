
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { MAP_TILE_COLORS } from '../game/tileConstants';
import './PropertyModal.css';

interface Props { tileId: number; onClose: () => void; }

export default function PropertyModal({ tileId, onClose }: Props) {
  const { board, players, myPlayerId, turnPhase, currentPlayerId } = useGameStore();
  const tile = board.get(tileId);
  if (!tile || tile.tileType !== 'property') { onClose(); return null; }

  const owner   = tile.ownerId ? players.get(tile.ownerId) : null;
  const me      = players.get(myPlayerId);
  const isOwner = tile.ownerId === myPlayerId;
  const isMyTurn = currentPlayerId === myPlayerId;
  const accentColor = tile.colorGroup ? `#${(MAP_TILE_COLORS[tile.colorGroup] || 0x888888).toString(16).padStart(6, '0')}` : '#666';

  const houseLabel  = tile.houseCount === 4 ? 'Khách sạn' : tile.houseCount > 0 ? `${tile.houseCount} nhà` : 'Đất trống';

  const canUpgrade = isOwner && !tile.isMortgaged && tile.houseCount < 4 && (me?.money || 0) >= tile.buildCost;
  const canMortgage = isOwner && !tile.isMortgaged;

  const handleAirportSelect = () => { send('selectAirport', { tileId }); onClose(); };
  const handleFestivalSelect = () => { send('selectFestival', { tileId }); onClose(); };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="property-modal" onClick={e => e.stopPropagation()} style={{ '--accent': accentColor } as any}>
        {/* Color header */}
        <div className="property-header" style={{ background: accentColor }}>
          <span className="property-icon">🏢</span>
          <h3>{tile.name}</h3>
          {tile.colorGroup && <span className="group-badge">{tile.colorGroup.toUpperCase()}</span>}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="property-body">
          {/* Status */}
          <div className="property-status">
            <span className={`status-chip ${tile.isMortgaged ? 'mortgaged' : tile.ownerId ? 'owned' : 'free'}`}>
              {tile.isMortgaged ? '🔒 Cầm cố' : tile.ownerId ? `👤 ${owner?.name || 'Có chủ'}` : '🟢 Đất trống'}
            </span>
            <span className="house-label">{houseLabel}</span>
          </div>

          {/* Price table */}
          <table className="rent-table">
            <thead><tr><th>Trạng thái</th><th>Tô</th></tr></thead>
            <tbody>
              {[
                ['Đất trống', tile.baseRent],
                ['1 nhà',     tile.rent1],
                ['2 nhà',     tile.rent2],
                ['3 nhà',     tile.rent3],
                ['Khách sạn', tile.rentHotel],
              ].map(([label, val], i) => (
                <tr key={i} className={tile.houseCount === i ? 'current-row' : ''}>
                  <td>{label}</td>
                  <td>{(val as number).toLocaleString()}đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="property-meta">
            <span>💰 Giá mua: <strong>{tile.price.toLocaleString()}đ</strong></span>
            {!tile.isMortgaged && <span>🔨 Xây nhà: <strong>{tile.buildCost.toLocaleString()}đ</strong></span>}
            {tile.isMortgaged && <span>🔓 Cầm cố: <strong>{tile.mortgageValue.toLocaleString()}đ</strong></span>}
          </div>

          {/* Owner actions */}
          {isOwner && isMyTurn && (
            <div className="property-actions">
              {canUpgrade && (
                <button id={`btn-upgrade-${tileId}`} className="btn-upgrade"
                  onClick={() => { send('upgradeProperty', { tileId }); onClose(); }}>
                  🔨 Xây {tile.houseCount < 3 ? `Nhà cấp ${tile.houseCount + 1}` : 'Khách sạn'} ({tile.buildCost.toLocaleString()}đ)
                </button>
              )}
              {canMortgage && (
                <button id={`btn-mortgage-${tileId}`} className="btn-mortgage"
                  onClick={() => { if (confirm(`Cầm cố ${tile.name} lấy ${tile.mortgageValue.toLocaleString()}đ?`)) { send('mortgageProperty', { tileId }); onClose(); } }}>
                  🔒 Cầm cố ({tile.mortgageValue.toLocaleString()}đ)
                </button>
              )}
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
              🎉 Nhân đôi tô ô này!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

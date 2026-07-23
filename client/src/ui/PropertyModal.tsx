
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { formatMoneyFull } from '../utils/format';
import { TILE_IMAGE } from '../game/tileImages';

interface Props { tileId: number; onClose: () => void; }

export default function PropertyModal({ tileId, onClose }: Props) {
  const { board, players, myPlayerId, turnPhase, currentPlayerId, pendingChanceEffect } = useGameStore();
  const tile = board.get(tileId);
  if (!tile || (tile.tileType !== 'property' && tile.tileType !== 'port')) return null;

  const owner    = tile.ownerId ? players.get(tile.ownerId) : null;
  const isOwner  = tile.ownerId === myPlayerId;
  const isMyTurn = currentPlayerId === myPlayerId;
  const isValidAirportDestination = !tile.ownerId || isOwner;

  // Header band color: owner color if owned, neutral gray if not
  const ownerColor = owner?.color
    ? (owner.color.startsWith('#') ? owner.color : `#${owner.color}`)
    : null;
  const headerColor = ownerColor ?? '#9e9e9e';



  // Upgrade rows for property
  const upgradeRows = tile.tileType === 'property' ? [
    { label: 'Đất',       level: 0, cost: tile.price,                                               rent: tile.baseRent  },
    { label: 'Nhà 1',     level: 1, cost: tile.price + tile.buildCost,                              rent: tile.rent1     },
    { label: 'Nhà 2',     level: 2, cost: tile.price + tile.buildCost * 2,                          rent: tile.rent2     },
    { label: 'Nhà 3',     level: 3, cost: tile.price + tile.buildCost * 3,                          rent: tile.rent3     },
    { label: 'Khách sạn', level: 4, cost: tile.price + tile.buildCost * 3 + tile.hotelCost,         rent: tile.rentHotel },
  ] : [];

  // Determine row state
  const getRowState = (level: number) => {
    if (!tile.ownerId) return 'upcoming';
    if (level < tile.houseCount) return 'done';
    if (level === tile.houseCount) return 'current';
    return 'upcoming';
  };

  let totalValue = tile.price;
  if (tile.tileType !== 'port' && tile.houseCount > 0) {
    if (tile.houseCount === 4) {
      totalValue += (tile.buildCost * 3 + tile.hotelCost);
    } else {
      totalValue += tile.houseCount * tile.buildCost;
    }
  }

  const handleAirportSelect  = () => { send('selectAirport',  { tileId }); onClose(); };
  const handleFestivalSelect = () => { send('selectFestival', { tileId }); onClose(); };
  const handleSellForDebt    = () => { send('sellForDebt',    { tileId }); onClose(); };

  // Illustration image based on tileId
  const illustrationSrc = TILE_IMAGE[tileId] ?? '/images/go.webp';

  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[0.8rem] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="relative w-full max-w-[42rem] h-auto max-h-[95vh] animate-card-modal-slide flex flex-col
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[1.2rem] before:shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.15)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[1.2rem] after:shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.15)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div
          className="bg-white rounded-[1.2rem] overflow-hidden shadow-[0_1.6rem_3.6rem_rgba(0,0,0,0.3),0_0_0_0.0667rem_rgba(0,0,0,0.08),inset_0_0.1333rem_0.2667rem_rgba(255,255,255,0.9)] relative z-10 flex flex-col h-full max-h-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-[0.8rem_1.2rem] text-white flex justify-center items-center relative shrink-0 shadow-[0_0.1333rem_0.6667rem_rgba(0,0,0,0.15)]" style={{ background: headerColor }}>
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.15)] to-transparent pointer-events-none"></div>
            <h3 className="text-[1.3rem] font-extrabold m-0 leading-[1.2] drop-shadow-[0_0.1333rem_0.2667rem_rgba(0,0,0,0.4)] flex items-center justify-center gap-2 text-center uppercase tracking-[0.03rem]">
              {tile.name}
              {tile.isShielded && <span title="Đang có Khiên bảo vệ" className="text-[1.1rem] drop-shadow-[0_0.1333rem_0.2667rem_rgba(0,0,0,0.5)]">🛡️</span>}
              {!tile.isActive && <span title="Đang bị Cúp Điện" className="text-[1.1rem] drop-shadow-[0_0.1333rem_0.2667rem_rgba(0,0,0,0.5)]">⚡</span>}
            </h3>
            <button className="absolute right-[0.8rem] bg-[rgba(0,0,0,0.2)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[0.9rem] cursor-pointer transition-all duration-200 hover:bg-[rgba(0,0,0,0.4)] hover:scale-110 shrink-0 shadow-inner" onClick={onClose}>✕</button>
          </div>

          {/* ── Body ── */}
          <div className="p-[1rem_1.2rem] flex flex-col gap-0 bg-gradient-to-b from-[#f9f6f0] to-[#f0eadd] overflow-y-auto flex-1">
            <div className="flex flex-row gap-5 items-stretch">
              {/* Left: property illustration */}
              <div className="flex-[0_0_20rem] flex items-center justify-center bg-[#eae4d8] rounded-[0.8rem] min-h-[10rem] overflow-hidden border border-[rgba(0,0,0,0.04)] p-1.5 shrink-0 shadow-[inset_0_0.1333rem_0.4rem_rgba(0,0,0,0.05)]">
                <img
                  src={illustrationSrc}
                  alt={tile.name}
                  className="w-full h-full object-cover rounded-[0.6rem] block contrast-[1.05] saturate-[1.1] shadow-[0_0.2667rem_0.8rem_rgba(0,0,0,0.15)]"
                />
              </div>

              {/* Right: upgrade table or port info */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                {tile.tileType === 'property' ? (
                  <table className="w-full border-collapse font-medium text-[0.9333rem] text-[#2d3748]">
                    <thead>
                      <tr>
                        <th className="text-left text-[0.8rem] uppercase tracking-[0.05rem] pb-2 border-b-2 border-[rgba(0,0,0,0.08)] border-r border-gray-300 pr-3 font-extrabold text-[#718096]">Xây dựng</th>
                        <th className="text-right text-[0.8rem] uppercase tracking-[0.05rem] pb-2 border-b-2 border-[rgba(0,0,0,0.08)] pl-3 font-extrabold text-[#718096]">Tổng Giá Trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upgradeRows.map(({ label, level, cost }) => {
                        const state = getRowState(level);
                        const isCurrent = state === 'current';
                        const isDone    = state === 'done';
                        return (
                          <tr key={level} className={`odd:bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.7)] transition-colors duration-150 rounded-lg ${
                            isCurrent ? 'bg-white shadow-[0_0.1333rem_0.5333rem_rgba(0,0,0,0.08),inset_0.2667rem_0_0_#4a90d9] font-bold text-[#1a202c] transform scale-[1.02] relative z-10' :
                            isDone    ? 'text-[#a0aec0] opacity-80' : 'text-[#4a5568]'
                          }`}>
                            <td className="py-2 px-2 border-b border-[rgba(0,0,0,0.04)] border-r border-gray-200 pr-3 text-left flex items-center gap-2 first:rounded-l-lg">
                              {isDone ? (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#cbd5e0] text-white text-[0.7rem] shrink-0">✓</span>
                              ) : isCurrent ? (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4a90d9] text-white text-[0.7rem] shadow-[0_0.1333rem_0.4rem_rgba(74,144,217,0.4)] shrink-0">✓</span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(0,0,0,0.05)] border border-[rgba(0,0,0,0.15)] text-transparent text-[0.7rem] shrink-0" />
                              )}
                              <span className={`truncate max-w-none ${isDone ? 'line-through decoration-[#cbd5e0] decoration-2' : ''}`}>{label}</span>
                            </td>
                            <td className="py-2 px-2 border-b border-[rgba(0,0,0,0.04)] text-right whitespace-nowrap pl-3 last:rounded-r-lg">
                              {formatMoneyFull(cost)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full border-collapse font-medium text-[0.9333rem] text-[#2d3748]">
                    <thead>
                      <tr>
                        <th className="text-left text-[0.8rem] uppercase tracking-[0.05rem] pb-2 border-b-2 border-[rgba(0,0,0,0.08)] border-r border-gray-300 pr-3 font-extrabold text-[#718096]">Sở hữu</th>
                        <th className="text-right text-[0.8rem] uppercase tracking-[0.05rem] pb-2 border-b-2 border-[rgba(0,0,0,0.08)] pl-3 font-extrabold text-[#718096]">Phí qua cảng</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="odd:bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.7)] transition-colors duration-150">
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] border-r border-gray-200 pr-3 text-left">1 Cảng</td>
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] text-right whitespace-nowrap pl-3 font-bold text-[#4a5568]">{formatMoneyFull(25)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                      </tr>
                      <tr className="odd:bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.7)] transition-colors duration-150">
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] border-r border-gray-200 pr-3 text-left">2 Cảng</td>
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] text-right whitespace-nowrap pl-3 font-bold text-[#4a5568]">{formatMoneyFull(50)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                      </tr>
                      <tr className="odd:bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.7)] transition-colors duration-150">
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] border-r border-gray-200 pr-3 text-left">3 Cảng</td>
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] text-right whitespace-nowrap pl-3 font-bold text-[#4a5568]">{formatMoneyFull(100)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                      </tr>
                      <tr className="odd:bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.7)] transition-colors duration-150">
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] border-r border-gray-200 pr-3 text-left">4 Cảng</td>
                        <td className="py-2.5 px-2 border-b border-[rgba(0,0,0,0.04)] text-right whitespace-nowrap pl-3 text-[1.05rem]" style={{ color: '#e67e22', fontWeight: 900 }}>THẮNG NGAY! 🏆</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* ── Current Rent Footer ── */}
            <div className="mt-3 text-right text-[0.8667rem] font-bold text-[#d35400] relative z-20 pr-2">
              Giá thuê hiện tại: <span className="font-black text-[1rem] ml-1">{formatMoneyFull(tile.ownerId ? tile.currentRent : 0)}</span> <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span>
            </div>

          </div>

          {/* ── Actions ── */}
          {(
            (isMyTurn && isOwner && turnPhase === 'pay_debt') ||
            (isMyTurn && isValidAirportDestination && turnPhase === 'airport_select') ||
            (isMyTurn && isOwner && turnPhase === 'festival_select') ||
            (isMyTurn && isOwner && turnPhase === 'chance_shield_select') ||
            (isMyTurn && isOwner && turnPhase === 'chance_give_city_select') ||
            (isMyTurn && isOwner && turnPhase === 'chance_festival_city_select' && (tile.tileType === 'property' || tile.tileType === 'port')) ||
            (isMyTurn && !isOwner && tile.ownerId !== '' && turnPhase === 'chance_attack_select' && tile.houseCount < 4 && !(pendingChanceEffect === 'SABOTAGE' && tile.tileType === 'port'))
          ) && (
            <div className="p-[0_1.6rem_1rem] bg-[#f0eadd] border-t border-[rgba(0,0,0,0.06)] flex flex-col items-center gap-3 shrink-0">
              {isMyTurn && isOwner && turnPhase === 'pay_debt' && (
                <button className="btn-3d btn-3d-red text-[0.9333rem] px-8 py-2" onClick={handleSellForDebt}>
                  Bán để trả nợ ({formatMoneyFull(Math.floor(totalValue * 0.5))}$)
                </button>
              )}
              {turnPhase === 'airport_select' && isMyTurn && isValidAirportDestination && (
                <button className="btn-3d btn-primary text-[0.9333rem] px-8 py-2" onClick={handleAirportSelect}>
                  ✈️ Bay đến đây!
                </button>
              )}
              {turnPhase === 'festival_select' && isMyTurn && isOwner && (
                <button className="btn-3d btn-3d-purple text-[0.9333rem] px-8 py-2" onClick={handleFestivalSelect}>
                  🎉 Tổ chức Lễ Hội (50K)
                </button>
              )}

              {/* --- CHANCE CARD ACTIONS --- */}
              {turnPhase === 'chance_shield_select' && isMyTurn && isOwner && (
                <button className="btn-3d btn-3d-green text-[0.9333rem] px-8 py-2" onClick={() => { send('chanceShieldSelect', { tileId }); onClose(); }}>
                  🛡️ Gắn Khiên lên đây
                </button>
              )}

              {turnPhase === 'chance_give_city_select' && isMyTurn && isOwner && (
                <button className="btn-3d btn-3d-yellow text-[0.9333rem] px-8 py-2" onClick={() => { send('chanceGiveCitySelect', { tileId }); onClose(); }}>
                  🎁 Chọn tặng đất này
                </button>
              )}

              {turnPhase === 'chance_festival_city_select' && isMyTurn && isOwner && (tile.tileType === 'property' || tile.tileType === 'port') && (
                <button className="btn-3d btn-3d-purple text-[0.9333rem] px-8 py-2" onClick={() => { send('chanceFestivalSelect', { tileId }); onClose(); }}>
                  🎉 Tổ chức Lễ Hội miễn phí
                </button>
              )}

              {turnPhase === 'chance_attack_select' && isMyTurn && !isOwner && tile.ownerId !== '' && tile.houseCount < 4 && !(pendingChanceEffect === 'SABOTAGE' && tile.tileType === 'port') && (
                <button className="btn-3d btn-3d-red text-[0.9333rem] px-8 py-2" onClick={() => { send('chanceAttackSelect', { tileId }); onClose(); }}>
                  ⚔️ Tấn công ô này
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

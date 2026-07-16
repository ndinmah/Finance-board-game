
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { formatMoneyFull } from '../utils/format';
import { TILE_IMAGE } from '../game/tileImages';

interface Props { tileId: number; onClose: () => void; }

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

  // Illustration image based on tileId
  const illustrationSrc = TILE_IMAGE[tileId] ?? '/images/go.webp';

  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="relative w-full max-w-[520px] md:max-w-[780px] animate-card-modal-slide
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[24px] before:shadow-[0_4px_12px_rgba(0,0,0,0.1)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[24px] after:shadow-[0_4px_12px_rgba(0,0,0,0.1)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div
          className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header band ── */}
        <div className="p-[16px_24px] text-white flex justify-between items-start relative border-b border-[rgba(0,0,0,0.08)]" style={{ background: headerColor }}>
          <h3 className="text-[22px] font-bold m-0 leading-[1.2] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">{tile.name}</h3>
          <button className="absolute top-4 right-4 bg-[rgba(0,0,0,0.15)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)]" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="p-[18px_16px_20px] flex flex-col gap-0 bg-[#f5f0e8]">
          <div className="flex gap-3 items-stretch">

            {/* Left: property illustration */}
            <div className="flex-[0_0_220px] md:flex-[0_0_300px] flex items-center justify-center bg-[#f0ece4] rounded-[10px] min-h-[150px] overflow-hidden border border-[rgba(0,0,0,0.06)] p-1">
              <img
                src={illustrationSrc}
                alt={tile.name}
                className="w-full h-full md:h-[220px] object-cover rounded-[10px] block contrast-105 saturate-[1.2] drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
              />
            </div>

            {/* Right: upgrade table or port info */}
            <div className="flex-1 flex flex-col justify-center">
              {tile.tileType === 'property' ? (
                <table className="w-full border-collapse font-medium text-[#4a5568] text-[13px] md:text-[15px]">
                  <thead>
                    <tr>
                      <th className="text-left text-[11px] md:text-[13px] uppercase tracking-[0.5px] text-[#718096] pb-2 border-b border-[rgba(0,0,0,0.06)] font-bold">Xây dựng</th>
                      <th className="text-right text-[11px] md:text-[13px] uppercase tracking-[0.5px] text-[#718096] pb-2 border-b border-[rgba(0,0,0,0.06)] font-bold">Giá nâng cấp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgradeRows.map(({ label, level, cost }) => {
                      const state = getRowState(level);
                      const isCurrent = state === 'current';
                      const isDone    = state === 'done';
                      return (
                        <tr key={level} className={
                          isCurrent ? 'bg-[rgba(74,144,217,0.1)] text-[#2c3e50] font-bold shadow-[inset_2px_0_0_#4a90d9]' :
                          isDone    ? 'text-[#a0aec0] line-through' : ''
                        }>
                          <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-left flex items-center gap-1.5 md:py-2 md:px-2.5">
                            {isDone ? (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#cbd5e0] text-white text-[10px]">✓</span>
                            ) : isCurrent ? (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4a90d9] text-white text-[10px] shadow-[0_2px_6px_rgba(74,144,217,0.4)]">✓</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.1)] text-transparent text-[10px]" />
                            )}
                            {label}
                          </td>
                          <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-right md:py-2 md:px-2.5">
                            {formatMoneyFull(cost)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse font-medium text-[#4a5568] text-[13px] md:text-[15px]">
                  <thead>
                    <tr>
                      <th className="text-left text-[11px] md:text-[13px] uppercase tracking-[0.5px] text-[#718096] pb-2 border-b border-[rgba(0,0,0,0.06)] font-bold">Sở hữu</th>
                      <th className="text-right text-[11px] md:text-[13px] uppercase tracking-[0.5px] text-[#718096] pb-2 border-b border-[rgba(0,0,0,0.06)] font-bold">Phí qua cảng</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-left md:py-2 md:px-2.5">1 Cảng</td>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-right md:py-2 md:px-2.5">{formatMoneyFull(25)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-left md:py-2 md:px-2.5">2 Cảng</td>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-right md:py-2 md:px-2.5">{formatMoneyFull(50)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-left md:py-2 md:px-2.5">3 Cảng</td>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-right md:py-2 md:px-2.5">{formatMoneyFull(100)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-left md:py-2 md:px-2.5">4 Cảng</td>
                      <td className="py-2 px-1 border-b border-[rgba(0,0,0,0.04)] text-right md:py-2 md:px-2.5" style={{ color: '#e67e22', fontWeight: 900 }}>THẮNG NGAY! 🏆</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Footer: price info ── */}
          <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)] flex justify-between items-center bg-[#fdfbf7] p-[10px_16px] rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] md:mt-5 md:pt-4">
            {tile.ownerId && tile.tileType === 'property' && (
              <div className="text-[13px] text-[#4a5568] md:text-[15px]">
                Giá mua lại <strong className="text-[#2c3e50] font-black md:text-[17px]">{formatMoneyFull(buyoutValue)}</strong>
                <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span>
              </div>
            )}
            <div className="text-[13px] text-[#4a5568] md:text-[15px]">
              Giá cầm cố <strong className="text-[#2c3e50] font-black md:text-[17px]">{formatMoneyFull(mortgageValue)}</strong>
              <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span>
            </div>
            <div className="text-[13px] text-[#e67e22] font-semibold bg-[rgba(230,126,34,0.1)] px-2 py-1 rounded-[6px] md:text-[15px]">
              Đang thu tô <strong className="text-[#d35400] font-black md:text-[17px]">{formatMoneyFull(displayRent)}</strong>
              <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        {owner && (
          <div className="p-[16px_24px_24px] bg-[#fdfaf5] border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-3 rounded-b-[24px]">
            <div className="text-center text-[13px] font-bold text-[#718096] bg-[rgba(0,0,0,0.03)] inline-block mx-auto px-3 py-1 rounded-full">
              Sở hữu: <span style={{ color: owner.color }}>{owner.name}</span>
            </div>
            {isOwner && isMyTurn && turnPhase === 'go_remote_upgrade' && tile.tileType === 'property' && (
              <div className="flex flex-col gap-2 w-full">
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
                        <button key={target} className="btn-3d btn-3d-blue w-full"
                          onClick={() => { send('remoteUpgradeProperty', { tileId, targetHouses: target }); onClose(); }}>
                          ✨ Nâng cấp lên {label} ({formatMoneyFull(cost)})
                        </button>
                      );
                    }
                  }
                  return options.length > 0 ? options : (
                    <p className="text-[12px] text-[#888] text-center m-0">
                      Không đủ điều kiện nâng cấp mảnh đất này.
                    </p>
                  );
                })()}
              </div>
            )}
            {isMyTurn && isOwner && turnPhase === 'pay_debt' && (
              <div className="flex gap-2 flex-wrap justify-center">
                <button className="btn-3d btn-3d-red flex-1 min-w-[140px]" onClick={handleSellForDebt}>
                  Bán để trả nợ ({formatMoneyFull(mortgageValue)}$)
                </button>
              </div>
            )}
            {turnPhase === 'airport_select' && currentPlayerId === myPlayerId && (
              <button className="btn-3d btn-primary" onClick={handleAirportSelect}>
                ✈️ Bay đến đây!
              </button>
            )}
            {turnPhase === 'festival_select' && currentPlayerId === myPlayerId && isOwner && (
              <button className="btn-3d btn-3d-purple" onClick={handleFestivalSelect}>
                🎉 Tổ chức Lễ Hội (50K)
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

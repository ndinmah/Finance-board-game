import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { TILE_IMAGE } from '../game/tileImages';
import { formatMoneyFull } from '../utils/format';

const getMaxHouses = (passCount: number, currentHouses: number) => {
  if (passCount === 0) return 2;
  if (currentHouses < 3) return 3;
  return 4;
};

const getBestLevel = (
  tile: any,
  me: any,
  isBuy: boolean,
  isUpgrade: boolean
) => {
  if (!tile || !me) return 0;
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
  return Math.min(bestLevel, maxAllowed);
};

export default function BuyUpgradeModal() {
  const isMyTurn = useGameStore(s => s.currentPlayerId === s.myPlayerId);
  const turnPhase = useGameStore(s => s.turnPhase);
  const board = useGameStore(s => s.board);
  const myPlayerId = useGameStore(s => s.myPlayerId);
  const me = useGameStore(s => s.players.get(s.myPlayerId));
  const tile = useGameStore(s => {
    const myPos = s.players.get(s.myPlayerId)?.position ?? 0;
    return s.board.get(myPos);
  });

  const isBuy = isMyTurn && turnPhase === 'buy_decision';
  const isUpgrade = isMyTurn && turnPhase === 'upgrade_decision';
  const isActive = isBuy || isUpgrade;
  
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [prevInputs, setPrevInputs] = useState<{ tileId: number; money: number; passCount: number; isBuy: boolean } | null>(null);

  // Sync state during render when key inputs change (avoiding useEffect and flickering)
  if (isActive && tile && me) {
    const currentInputs = {
      tileId: tile.id,
      money: me.money,
      passCount: me.passCount || 0,
      isBuy,
    };

    if (
      !prevInputs ||
      prevInputs.tileId !== currentInputs.tileId ||
      prevInputs.money !== currentInputs.money ||
      prevInputs.passCount !== currentInputs.passCount ||
      prevInputs.isBuy !== currentInputs.isBuy
    ) {
      setPrevInputs(currentInputs);
      setSelectedLevel(getBestLevel(tile, me, isBuy, isUpgrade));
    }
  }
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
      <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={handleSkip}>
        <div className="relative w-full max-w-[580px] md:max-w-[820px] animate-card-modal-slide" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col">
            <div className="p-[16px_24px] text-white flex justify-between items-start relative border-b border-[rgba(0,0,0,0.08)]" style={{ backgroundColor: headerColor }}>
              <h3 className="text-[22px] font-bold m-0 leading-[1.2] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">{tile.name}</h3>
              <button className="absolute top-4 right-4 bg-[rgba(0,0,0,0.15)] text-white border-none w-8 h-8 rounded-full flex items-center justify-center text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.3)]" onClick={handleSkip}>✕</button>
            </div>
            <div className="p-5">
            <div className="flex flex-col md:flex-row gap-5 items-stretch mb-5">
              <div className="flex-[0_0_160px] flex items-center bg-[#f0ece4] p-2.5 rounded-[16px] border border-[rgba(0,0,0,0.06)]">
                <div className="w-full">
                  <img src="/images/port.webp" alt="Resort" className="w-full h-[140px] object-cover rounded-[12px] shadow-sm" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[15px] text-[#4a5568] leading-[1.5] m-[0_0_15px_0] border-b border-[rgba(0,0,0,0.05)] pb-3">
                  Tiền thuê phải trả phụ thuộc vào số lượng các cảng khác mà người chơi sở hữu
                </p>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className={nextPortCount === 1 ? 'bg-[rgba(74,144,217,0.1)] text-[#2c3e50] font-bold shadow-[inset_3px_0_0_#4a90d9]' : ''}>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px]">1 cảng</td>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px] text-right font-medium">{formatMoneyFull(25)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr className={nextPortCount === 2 ? 'bg-[rgba(74,144,217,0.1)] text-[#2c3e50] font-bold shadow-[inset_3px_0_0_#4a90d9]' : ''}>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px]">2 cảng</td>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px] text-right font-medium">{formatMoneyFull(50)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr className={nextPortCount === 3 ? 'bg-[rgba(74,144,217,0.1)] text-[#2c3e50] font-bold shadow-[inset_3px_0_0_#4a90d9]' : ''}>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px]">3 cảng</td>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px] text-right font-medium">{formatMoneyFull(100)} <span className="text-[#f5c518] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr className={nextPortCount === 4 ? 'bg-[rgba(74,144,217,0.1)] text-[#2c3e50] font-bold shadow-[inset_3px_0_0_#4a90d9]' : ''}>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px]">4 cảng</td>
                      <td className="p-[8px_12px] border-b border-[rgba(0,0,0,0.04)] text-[14px] text-right font-bold text-[#e67e22]">THẮNG LẬP TỨC! 🏆</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col items-center pt-4 border-t border-[rgba(0,0,0,0.08)] w-full">
              <div className="text-[18px] text-[#2c3e50] mb-3">
                Giá thuê: <strong className="text-[22px]">{formatMoneyFull(expectedRent)}</strong> <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
              </div>
              <button
                className={`btn-3d w-[90%] max-w-[400px] p-[15px_30px] text-[16px] font-bold tracking-[1px] shadow-[0_12px_30px_rgba(74,144,217,0.4)] ${!canAfford ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'btn-3d-blue'}`}
                onClick={() => {
                  if (canAfford) send('buyProperty', { houses: 0 });
                }}
                disabled={!canAfford}
              >
                MUA VỚI GIÁ {formatMoneyFull(portPrice)} <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
              </button>
              <div className="mt-3 text-[13px] text-[#718096] font-medium bg-[rgba(0,0,0,0.03)] p-[6px_12px] rounded-[6px]">
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
    { level: 0, label: 'Đất', image: '/images/house-0.png', maxAllowed: 0 },
    { level: 1, label: 'Nhà 1', image: '/images/house-1.png', maxAllowed: 1 },
    { level: 2, label: 'Nhà 2', image: '/images/house-2.png', maxAllowed: 2 },
    { level: 3, label: 'Nhà 3', image: '/images/house-3.png', maxAllowed: 3 },
  ];
  return (
    <div className="fixed inset-0 bg-[rgba(15,15,20,0.65)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-4" onClick={handleSkip}>
      <div className="relative w-full max-w-[580px] md:max-w-[820px] animate-card-modal-slide" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative z-10 max-h-[92vh] flex flex-col">
          {/* ── Ticket Photo: covers full header + photo zone ── */}
          <div className="relative w-full h-[160px] shrink-0 rounded-t-[24px] overflow-hidden" style={{ borderTop: `5px solid ${headerColor}` }}>
            <img src={TILE_IMAGE[tile.id] ?? '/images/go.webp'} alt={tile.name} className="w-full h-full object-cover block brightness-105 contrast-110 saturate-[1.2]" />
            {/* Header overlaid on top of image */}
            <div className="absolute top-0 left-0 right-0 p-[16px_20px] flex justify-center items-center bg-gradient-to-b from-[rgba(0,0,0,0.55)] to-transparent z-10">
              <h3 className="text-white font-extrabold text-[18px] tracking-[2px] drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)] text-center m-0">{tile.name.toUpperCase()}</h3>
              <button className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-[rgba(255,255,255,0.2)] border-[1.5px] border-[rgba(255,255,255,0.5)] text-white w-[36px] h-[36px] rounded-full cursor-pointer text-[16px] flex items-center justify-center backdrop-blur-[4px] transition-all duration-200 hover:bg-[rgba(255,255,255,0.38)] active:scale-90 z-[100] pointer-events-auto" onClick={(e) => { e.stopPropagation(); handleSkip(); }}>✕</button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-b from-transparent to-white pointer-events-none" />
          </div>

          {/* Wrapper for the cards that overlaps the image, outside of card-body */}
          <div className="relative z-10 px-[20px] overflow-visible">
            {tile.houseCount === 3 ? (
              <div className="flex items-center bg-white rounded-[12px] p-[16px_20px] mt-[-44px] mb-[20px] shadow-[0_6px_16px_rgba(0,0,0,0.15)] gap-4 border-[2px] border-[#fbbf24]">
                <img src="/images/house-4.png" alt="Khách sạn" className="w-[64px] h-[64px] object-contain drop-shadow-[2px_2px_2px_rgba(0,0,0,0.3)] shrink-0" />
                <div className="flex-1">
                  <h4 className="m-[0_0_6px_0] text-[18px] text-[#b45309]">Nâng cấp lên Khách Sạn!</h4>
                  <p className="m-0 text-[14px] text-[#4b5563] leading-[1.4]">Bạn có muốn dùng <strong>{formatMoneyFull(tile.hotelCost)}</strong> <span className="text-[#2e7d32] font-black text-[1.1em]">$</span> để xây khách sạn không?</p>
                </div>
              </div>
            ) : (
            <div className="flex justify-between gap-3 w-full mt-[-44px] mb-3 relative z-10">
              {cards.map((card) => {
                const isBuilt = card.level <= tile.houseCount && !isBuy;
                const isAllowed = card.level <= maxAllowed;
                const isSelected = selectedLevel >= card.level;
                const isDisabled = isBuilt || !isAllowed;
                return (
                  <div
                    key={card.level}
                    className={`flex-1 bg-[rgba(255,255,255,0.92)] border-[2px] ${isSelected ? 'border-[#84cc16] bg-[rgba(247,254,231,0.95)] shadow-[0_8px_28px_rgba(132,204,22,0.3),0_2px_4px_rgba(0,0,0,0.08)]' : isDisabled ? 'border-[rgba(163,230,53,0.4)] opacity-60 cursor-not-allowed bg-[rgba(241,241,241,0.9)]' : 'border-[rgba(163,230,53,0.4)] cursor-pointer hover:border-[#a3e635] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.12)] shadow-[0_8px_24px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.08)]'} rounded-[14px] p-[14px_8px] flex flex-col items-center relative transition-all duration-200 backdrop-blur-[4px]`}
                    onClick={() => {
                      if (!isDisabled) setSelectedLevel(card.level);
                    }}
                  >
                    <div className="w-[80px] h-[60px] relative mb-[15px] flex justify-center items-center">
                       <div className="w-[60px] h-[60px] bg-[#a3e635] absolute top-[10px] [transform:rotateX(60deg)_rotateZ(-45deg)] shadow-[-2px_2px_0_#65a30d,-3px_3px_0_#65a30d]"></div>
                       <img src={card.image} alt={card.label} className="relative w-[48px] h-[48px] object-contain z-10 bottom-[1px] drop-shadow-[2px_2px_2px_rgba(0,0,0,0.3)]" />
                    </div>
                    <div className="text-[16px] font-semibold text-[#333] mb-3">{card.label}</div>

                    {/* Checkbox */}
                    <div className={`absolute bottom-[10px] right-[10px] w-[22px] h-[22px] border-[2px] ${isSelected ? 'border-[#84cc16] text-[#84cc16]' : 'border-[#ccc] text-transparent'} rounded-[4px] bg-white flex justify-center items-center text-[16px] font-bold`}>
                      {isSelected && '✔'}
                    </div>
                    {!isAllowed && (
                       <div className="absolute top-[10px] -left-1 w-[110%] bg-white border-[2px] border-[#e91e63] text-[#e91e63] text-[11px] font-bold p-1 text-center -rotate-12 rounded-[4px] z-10 shadow-[2px_2px_5px_rgba(0,0,0,0.1)]">
                         Không thực hiện được ở vòng đầu tiên
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>

          <div className="p-[4px_20px_12px] relative z-10">
            <div className="flex flex-col items-center w-full">
              <div className="text-[18px] text-[#333] mb-2.5">
                Giá thuê: <strong className="text-[22px]">{formatMoneyFull(rentAtLevel)}</strong> <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
              </div>
              <button
                className={`btn-3d w-[90%] max-w-[400px] p-[15px_30px] text-[16px] font-bold tracking-[1px] shadow-[0_12px_30px_rgba(74,144,217,0.4)] ${!canAfford ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'btn-3d-blue'}`}
                onClick={handleConfirm}
                disabled={!canAfford}
              >
                {isBuy ? 'MUA VỚI GIÁ' : 'NÂNG CẤP VỚI GIÁ'} {formatMoneyFull(totalCost)} <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

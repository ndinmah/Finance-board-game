import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { send } from '../net/colyseusClient';
import { TILE_IMAGE } from '../game/tileImages';
import { formatMoneyFull } from '../utils/format';
import ModalShell, { ModalCloseButton } from './ModalShell';

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
  const selectedTileId = useGameStore(s => s.selectedTileId);
  const activeFestivalTile = useGameStore(s => s.activeFestivalTile);
  const tile = useGameStore(s => {
    if (s.turnPhase === 'go_remote_upgrade' && s.selectedTileId !== null) {
      return s.board.get(s.selectedTileId);
    }
    const myPos = s.players.get(s.myPlayerId)?.position ?? 0;
    return s.board.get(myPos);
  });

  const isBuy = isMyTurn && turnPhase === 'buy_decision';
  const isUpgrade = isMyTurn && (turnPhase === 'upgrade_decision' || turnPhase === 'go_remote_upgrade');
  const isValidRemoteUpgrade = turnPhase !== 'go_remote_upgrade' || (
    selectedTileId !== null &&
    tile?.ownerId === myPlayerId &&
    tile.tileType === 'property' &&
    !!me &&
    tile.houseCount < getMaxHouses(me.passCount || 0, tile.houseCount) &&
    me.money >= (tile.houseCount === 3 ? tile.hotelCost : tile.buildCost)
  );
  const isActive = isBuy || (isUpgrade && tile !== undefined && isValidRemoteUpgrade);

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
    else if (turnPhase === 'go_remote_upgrade') {
      send('skipRemoteUpgrade');
      useGameStore.getState().setSelectedTile(null);
    } else {
      send('skipUpgrade');
    }
  };

  const headerColor = me.color ? (me.color.startsWith('#') ? me.color : `#${me.color}`) : '#9e9e9e';

  if (tile.tileType === 'port') {
    const ownedPorts = Array.from(board.values()).filter(t => t.tileType === 'port' && t.ownerId === myPlayerId && t.id !== tile.id).length;
    const nextPortCount = Math.min(4, ownedPorts + 1);
    const portPrice = tile.price || 200;
    const canAfford = me.money >= portPrice;
    const rentMap: Record<number, number> = { 1: 25, 2: 50, 3: 100, 4: 0 };
    let expectedRent = rentMap[nextPortCount] || 0;
    if (tile.hasMonopoly) expectedRent *= 2;
    if (tile.isTouristSpot) expectedRent *= 2;
    if (activeFestivalTile === tile.id) expectedRent *= 2;
    if (!tile.isActive) expectedRent = 0;

    return (
      <ModalShell
        ariaLabel={`${isBuy ? 'Mua' : 'Nâng cấp'} ${tile.name}`}
        onClose={handleSkip}
        closeOnBackdrop={false}
      >
        <div className="relative w-full max-w-[38.6667rem] h-auto max-h-[95vh] animate-card-modal-slide flex flex-col [@media(max-height:480px)_and_(orientation:landscape)]:[max-height:calc(100dvh_-_1rem)]
          before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[1.6rem] before:shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.15)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
          after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[1.6rem] after:shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.15)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
          <div
            className="bg-gradient-to-b from-[#fdfbf7] to-[#f4f0e6] rounded-[1.6rem] overflow-hidden shadow-[0_1.6rem_3.2rem_rgba(0,0,0,0.25),0_0_0_0.0667rem_rgba(0,0,0,0.05),inset_0_0.1333rem_0.2667rem_rgba(255,255,255,0.8)] relative z-10 flex flex-col max-h-full"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Ticket Photo: covers full header + photo zone ── */}
            <div className="relative w-full h-[9.3333rem] shrink-0 rounded-t-[1.6rem] overflow-hidden [@media(max-height:480px)_and_(orientation:landscape)]:[height:6rem]" style={{ borderTop: `5px solid ${headerColor}` }}>
              <img src={'/images/port.webp'} alt={tile.name} className="w-full h-full object-cover block brightness-105 contrast-110 saturate-[1.2]" />
              {/* Header overlaid on top of image */}
              <div className="absolute top-0 left-0 right-0 p-[0.8rem_1.3333rem] flex justify-center items-center bg-gradient-to-b from-[rgba(0,0,0,0.65)] to-transparent z-10">
                <h3 className="text-white font-extrabold text-[1.2rem] tracking-[0.1333rem] drop-shadow-[0_0.1333rem_0.5333rem_rgba(0,0,0,0.8)] text-center m-0">{tile.name.toUpperCase()}</h3>
                <ModalCloseButton
                  className="absolute right-[0.9333rem] top-1/2 z-[100] -translate-y-1/2"
                  onClick={handleSkip}
                  ariaLabel={isBuy ? 'Bỏ qua mua tài sản' : 'Bỏ qua nâng cấp'}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[4rem] bg-gradient-to-b from-transparent to-[#fdfbf7] pointer-events-none" />
            </div>

            <div className="p-[1.0667rem] pt-0 relative z-10 flex min-h-0 flex-col items-center [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0_0.65rem_0.65rem]">
              <div className="w-full max-w-[32rem] bg-white rounded-[1.0667rem] p-[1.0667rem] shadow-[0_0.5333rem_1.6rem_rgba(0,0,0,0.06),0_0.1333rem_0.5333rem_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.05)] mb-[0.8rem] mt-[-1.5rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.55rem_0.75rem] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-top:-0.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:0.35rem]">
                <p className="text-[0.8667rem] font-bold text-[#4a5568] leading-[1.4] text-center m-[0_0_0.8rem_0] border-b border-[rgba(0,0,0,0.06)] pb-[0.8rem] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:0.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding-bottom:0.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.72rem]">
                  Phí tăng theo số cảng sở hữu (không thể bị cướp đất)
                </p>
                <table className="w-full border-collapse font-medium text-[0.9333rem] text-[#2d3748]">
                  <tbody>
                    <tr className={`border-b border-[rgba(0,0,0,0.04)] transition-colors duration-200 ${nextPortCount === 1 ? 'bg-[rgba(74,144,217,0.12)] shadow-[inset_0.2667rem_0_0_#4a90d9]' : 'hover:bg-[rgba(0,0,0,0.02)]'}`}>
                      <td className="p-[0.5333rem_0.8rem] font-semibold [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem]">1 Cảng</td>
                      <td className="p-[0.5333rem_0.8rem] text-right text-[1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.82rem]">{formatMoneyFull(25)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr className={`border-b border-[rgba(0,0,0,0.04)] transition-colors duration-200 ${nextPortCount === 2 ? 'bg-[rgba(74,144,217,0.12)] shadow-[inset_0.2667rem_0_0_#4a90d9]' : 'hover:bg-[rgba(0,0,0,0.02)]'}`}>
                      <td className="p-[0.5333rem_0.8rem] font-semibold [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem]">2 Cảng</td>
                      <td className="p-[0.5333rem_0.8rem] text-right text-[1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.82rem]">{formatMoneyFull(50)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr className={`border-b border-[rgba(0,0,0,0.04)] transition-colors duration-200 ${nextPortCount === 3 ? 'bg-[rgba(74,144,217,0.12)] shadow-[inset_0.2667rem_0_0_#4a90d9]' : 'hover:bg-[rgba(0,0,0,0.02)]'}`}>
                      <td className="p-[0.5333rem_0.8rem] font-semibold [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem]">3 Cảng</td>
                      <td className="p-[0.5333rem_0.8rem] text-right text-[1rem] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.82rem]">{formatMoneyFull(100)} <span className="text-[#22c55e] font-black drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)] ml-0.5">$</span></td>
                    </tr>
                    <tr className={`transition-colors duration-200 ${nextPortCount === 4 ? 'bg-[rgba(74,144,217,0.12)] shadow-[inset_0.2667rem_0_0_#4a90d9]' : 'hover:bg-[rgba(0,0,0,0.02)]'}`}>
                      <td className="p-[0.5333rem_0.8rem] font-semibold [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem]">4 Cảng</td>
                      <td className="p-[0.5333rem_0.8rem] text-right text-[1rem] font-black text-[#e67e22] tracking-wide [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.22rem_0.6rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.78rem]">THẮNG LẬP TỨC! 🏆</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-center w-full">
                <div className="text-[1.1333rem] text-[#2c3e50] mb-[0.8rem] font-medium [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:0.35rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.82rem]">
                  Thu nhập mỗi lượt: <strong className="text-[1.4rem] ml-1">{formatMoneyFull(expectedRent)}</strong> <span className="text-[#22c55e] font-black text-[1.1em] drop-shadow-[0_0.0667rem_0.1333rem_rgba(0,0,0,0.2)]">$</span>
                </div>
                <button
                  className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed btn-3d [background-color:var(--btn-color,_#0ea5e9)] [color:var(--btn-text,_white)] [border:none] [border-radius:2rem] [padding:var(--btn-pad,_0.8rem_1.8667rem)] [font-size:var(--btn-size,_1.0667rem)] [font-weight:800] [cursor:pointer] [display:inline-flex] [justify-content:center] [align-items:center] [gap:0.5333rem] [box-shadow:0_0.4rem_0_var(--btn-shadow,_#0284c7)] [transition:transform_0.1s,_box-shadow_0.1s,_filter_0.1s] [text-transform:uppercase] [letter-spacing:0.5px] [&:active:not(.disabled):not(:disabled)]:[transform:translateY(0.4rem)] [&:active:not(.disabled):not(:disabled)]:[box-shadow:0_0px_0_var(--btn-shadow,_#0284c7)] [&:hover:not(.disabled):not(:disabled)]:[filter:brightness(1.1)] [&.disabled]:![background-color:#94a3b8] disabled:![background-color:#94a3b8] [&.disabled]:![box-shadow:0_0.4rem_0_#64748b] disabled:![box-shadow:0_0.4rem_0_#64748b] [&.disabled]:![cursor:not-allowed] disabled:![cursor:not-allowed] [&.disabled]:![transform:translateY(0)] disabled:![transform:translateY(0)] [&.disabled]:![filter:none] disabled:![filter:none] [&.disabled]:![color:#e2e8f0] disabled:![color:#e2e8f0] w-full max-w-[24rem] p-[0.8rem_2rem] text-[1.0667rem] font-bold tracking-[0.0667rem] shadow-[0_0.8rem_2rem_rgba(74,144,217,0.4)] [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.55rem_1.25rem] [@media(max-height:480px)_and_(orientation:landscape)]:[font-size:0.82rem] ${!canAfford ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'btn-3d-blue hover:scale-[1.02] active:scale-[0.98]'}`}
                  onClick={() => {
                    if (canAfford) send('buyProperty', { houses: 0 });
                  }}
                  disabled={!canAfford}
                >
                  MUA VỚI GIÁ {formatMoneyFull(portPrice)} <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
                </button>

              </div>
            </div>
          </div>
        </div>
      </ModalShell>
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

  let willHaveMonopoly = tile.hasMonopoly;
  if (isBuy && tile.tileType === 'property' && tile.colorGroup) {
    let ownsAllOthers = true;
    board.forEach((t) => {
      if (t.colorGroup === tile.colorGroup && t.id !== tile.id) {
        if (t.ownerId !== myPlayerId) ownsAllOthers = false;
      }
    });
    willHaveMonopoly = ownsAllOthers;
  }

  if (willHaveMonopoly) rentAtLevel *= 2;
  if (tile.isTouristSpot) rentAtLevel *= 2;
  if (activeFestivalTile === tile.id) rentAtLevel *= 2;
  if (!tile.isActive) rentAtLevel = 0;
  const canAfford = me.money >= totalCost;
  const handleConfirm = () => {
    if (!canAfford) return;
    if (isBuy) {
      send('buyProperty', { houses: selectedLevel });
    } else {
      if (turnPhase === 'go_remote_upgrade') {
        send('remoteUpgradeProperty', { tileId: tile.id, targetHouses: selectedLevel });
        useGameStore.getState().setSelectedTile(null);
      } else {
        send('upgradeProperty', { targetHouses: selectedLevel });
      }
    }
  };
  const cards = [
    { level: 0, label: 'Đất', image: '/images/house-0.png', maxAllowed: 0 },
    { level: 1, label: 'Nhà 1', image: '/images/house-1.png', maxAllowed: 1 },
    { level: 2, label: 'Nhà 2', image: '/images/house-2.png', maxAllowed: 2 },
    { level: 3, label: 'Nhà 3', image: '/images/house-3.png', maxAllowed: 3 },
  ];
  return (
    <ModalShell
      ariaLabel={`${isBuy ? 'Mua' : 'Nâng cấp'} ${tile.name}`}
      onClose={handleSkip}
      closeOnBackdrop={false}
    >
      <div className="relative w-full max-w-[42rem] h-auto max-h-[95vh] animate-card-modal-slide flex flex-col
        before:content-[''] before:absolute before:bg-[#fdfaf5] before:rounded-[1.6rem] before:shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.15)] before:-z-[1] before:inset-0 before:border before:border-[rgba(0,0,0,0.04)] before:transition-all before:duration-300 before:-rotate-2 before:-translate-x-1 before:translate-y-2
        after:content-[''] after:absolute after:bg-[#f5f0e6] after:rounded-[1.6rem] after:shadow-[0_0.2667rem_1.0667rem_rgba(0,0,0,0.15)] after:-z-[2] after:inset-0 after:border after:border-[rgba(0,0,0,0.04)] after:transition-all after:duration-300 after:rotate-3 after:translate-x-1.5 after:translate-y-3">
        <div
          className="bg-white rounded-[1.6rem] overflow-hidden shadow-[0_1.6rem_3.2rem_rgba(0,0,0,0.25),0_0_0_0.0667rem_rgba(0,0,0,0.05),inset_0_0.1333rem_0.2667rem_rgba(255,255,255,0.8)] relative z-10 flex flex-col h-full max-h-full"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Ticket Photo: covers full header + photo zone ── */}
          <div className="relative w-full h-[10.6667rem] shrink-0 rounded-t-[1.6rem] overflow-hidden" style={{ borderTop: `5px solid ${headerColor}` }}>
            <img src={TILE_IMAGE[tile.id] ?? '/images/go.webp'} alt={tile.name} className="w-full h-full object-cover block brightness-105 contrast-110 saturate-[1.2]" />
            {/* Header overlaid on top of image */}
            <div className="absolute top-0 left-0 right-0 p-[1.0667rem_1.3333rem] flex justify-center items-center bg-gradient-to-b from-[rgba(0,0,0,0.55)] to-transparent z-10">
              <h3 className="text-white font-extrabold text-[1.2rem] tracking-[0.1333rem] drop-shadow-[0_0.0667rem_0.5333rem_rgba(0,0,0,0.7)] text-center m-0">{tile.name.toUpperCase()}</h3>
              <ModalCloseButton
                className="absolute right-[0.9333rem] top-1/2 z-[100] -translate-y-1/2"
                onClick={handleSkip}
                ariaLabel={isBuy ? 'Bỏ qua mua tài sản' : 'Bỏ qua nâng cấp'}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[5.3333rem] bg-gradient-to-b from-transparent to-white pointer-events-none" />
          </div>

          {/* Wrapper for the cards that overlaps the image, outside of card-body */}
          <div className="relative z-10 px-[1.3333rem] overflow-visible">
            {tile.houseCount === 3 ? (
              <div className="flex items-center bg-white rounded-[0.8rem] p-[1.0667rem_1.3333rem] mt-[-2.9333rem] mb-[1.3333rem] shadow-[0_0.4rem_1.0667rem_rgba(0,0,0,0.15)] gap-[1rem] border-[0.1333rem] border-[#fbbf24]">
                <img src="/images/house-4.png" alt="Khách sạn" className="w-[4.2667rem] h-[4.2667rem] object-contain drop-shadow-[0.1333rem_0.1333rem_0.1333rem_rgba(0,0,0,0.3)] shrink-0" />
                <div className="flex-1">
                  <h4 className="m-[0_0_0.4rem_0] text-[1.2rem] text-[#b45309]">Nâng cấp lên Khách Sạn!</h4>
                  <p className="m-0 text-[0.9333rem] text-[#4b5563] leading-[1.4]">Bạn có muốn dùng <strong>{formatMoneyFull(tile.hotelCost)}</strong> <span className="text-[#2e7d32] font-black text-[1.1em]">$</span> để xây khách sạn không?</p>
                </div>
              </div>
            ) : (
            <div className="flex justify-between gap-[0.6rem] w-full mt-[-2.9333rem] mb-[0.8rem] relative z-10">
              {cards.map((card) => {
                const isBuilt = card.level <= tile.houseCount && !isBuy;
                const isAllowed = card.level <= maxAllowed;
                const isSelected = selectedLevel === card.level;
                const isIncluded = selectedLevel > card.level;
                const isChecked = selectedLevel >= card.level;
                const isDisabled = isBuilt || !isAllowed;
                return (
                  <button
                    type="button"
                    key={card.level}
                    className={`flex-1 min-w-0 border-[0.1333rem] ${isSelected ? 'border-[#15803d] bg-[linear-gradient(160deg,#f0fdf4,#dcfce7)] -translate-y-1 shadow-[0_0_0_0.2rem_rgba(34,197,94,0.2),0_0.8rem_1.8rem_rgba(21,128,61,0.28)]' : isDisabled ? 'border-[#d1d5db] opacity-55 cursor-not-allowed bg-[#f3f4f6]' : isIncluded ? 'border-[#86efac] bg-[#f0fdf4] cursor-pointer shadow-[0_0.35rem_1rem_rgba(21,128,61,0.12)]' : 'border-[#d1d5db] bg-white cursor-pointer hover:border-[#4ade80] hover:-translate-y-0.5 hover:shadow-[0_0.65rem_1.5rem_rgba(0,0,0,0.16)] shadow-[0_0.35rem_1rem_rgba(0,0,0,0.1)]'} rounded-[0.9333rem] p-[0.9333rem_0.2rem] flex flex-col items-center relative transition-all duration-200 backdrop-blur-[0.2667rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 [@media(max-height:480px)_and_(orientation:landscape)]:[padding:0.55rem_0.15rem]`}
                    onClick={() => {
                      if (!isDisabled) setSelectedLevel(card.level);
                    }}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    aria-label={`${card.label}${isSelected ? ', đang chọn' : ''}`}
                  >

                    <div className="w-[5.3333rem] h-[4rem] relative mb-[1rem] flex justify-center items-center [@media(max-height:480px)_and_(orientation:landscape)]:[height:3.2rem] [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:0.45rem]">
                       <div className={`w-[4rem] h-[4rem] absolute top-[0.6667rem] [transform:rotateX(60deg)_rotateZ(-45deg)] shadow-[-0.1333rem_0.1333rem_0_#65a30d,-0.2rem_0.2rem_0_#65a30d] ${isSelected ? 'bg-[#22c55e]' : 'bg-[#a3e635]'}`}></div>
                       <img src={card.image} alt={card.label} className="relative w-[3.2rem] h-[3.2rem] object-contain z-10 bottom-[0.0667rem] drop-shadow-[0.1333rem_0.1333rem_0.1333rem_rgba(0,0,0,0.3)]" />
                    </div>
                    <div className={`text-[0.9333rem] font-extrabold mb-[0.8rem] whitespace-nowrap [@media(max-height:480px)_and_(orientation:landscape)]:[margin-bottom:0.35rem] ${isSelected ? 'text-[#166534]' : 'text-[#333]'}`}>{card.label}</div>

                    {/* Checkbox */}
                    <div className={`absolute bottom-[0.6667rem] right-[0.6667rem] w-[1.4667rem] h-[1.4667rem] border-[0.1333rem] ${isSelected ? 'border-[#15803d] bg-[#15803d] text-white' : isIncluded ? 'border-[#22c55e] bg-[#dcfce7] text-[#15803d]' : 'border-[#ccc] text-transparent'} rounded-full flex justify-center items-center text-[0.9rem] font-bold`}>
                      {isChecked && '✔'}
                    </div>
                    {!isAllowed && (
                       <div className="absolute top-[0.6667rem] -left-1 w-[110%] bg-white border-[0.1333rem] border-[#e91e63] text-[#e91e63] text-[0.7333rem] font-bold p-1 text-center -rotate-12 rounded-[0.2667rem] z-10 shadow-[0.1333rem_0.1333rem_0.3333rem_rgba(0,0,0,0.1)] leading-tight">
                         Không thực hiện được ở vòng đầu tiên
                       </div>
                    )}
                  </button>
                );
              })}
            </div>
            )}
          </div>

          <div className="p-[0.2667rem_1.3333rem_0.8rem] relative z-10">
            <div className="flex flex-col items-center w-full">
              <div className="text-[1.2rem] text-[#333] mb-[0.6667rem]">
                Giá thuê: <strong className="text-[1.4667rem]">{formatMoneyFull(rentAtLevel)}</strong> <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
              </div>
              <button
                className={`font-inter cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed btn-3d [background-color:var(--btn-color,_#0ea5e9)] [color:var(--btn-text,_white)] [border:none] [border-radius:2rem] [padding:var(--btn-pad,_0.8rem_1.8667rem)] [font-size:var(--btn-size,_1.0667rem)] [font-weight:800] [cursor:pointer] [display:inline-flex] [justify-content:center] [align-items:center] [gap:0.5333rem] [box-shadow:0_0.4rem_0_var(--btn-shadow,_#0284c7)] [transition:transform_0.1s,_box-shadow_0.1s,_filter_0.1s] [text-transform:uppercase] [letter-spacing:0.5px] [&:active:not(.disabled):not(:disabled)]:[transform:translateY(0.4rem)] [&:active:not(.disabled):not(:disabled)]:[box-shadow:0_0px_0_var(--btn-shadow,_#0284c7)] [&:hover:not(.disabled):not(:disabled)]:[filter:brightness(1.1)] [&.disabled]:![background-color:#94a3b8] disabled:![background-color:#94a3b8] [&.disabled]:![box-shadow:0_0.4rem_0_#64748b] disabled:![box-shadow:0_0.4rem_0_#64748b] [&.disabled]:![cursor:not-allowed] disabled:![cursor:not-allowed] [&.disabled]:![transform:translateY(0)] disabled:![transform:translateY(0)] [&.disabled]:![filter:none] disabled:![filter:none] [&.disabled]:![color:#e2e8f0] disabled:![color:#e2e8f0] w-[90%] max-w-[26.6667rem] p-[1rem_2rem] text-[1.0667rem] font-bold tracking-[0.0667rem] shadow-[0_0.8rem_2rem_rgba(74,144,217,0.4)] ${!canAfford ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'btn-3d-blue'}`}
                onClick={handleConfirm}
                disabled={!canAfford}
              >
                {isBuy ? 'MUA VỚI GIÁ' : 'NÂNG CẤP VỚI GIÁ'} {formatMoneyFull(totalCost)} <span className="text-[#2e7d32] font-black text-[1.1em]">$</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

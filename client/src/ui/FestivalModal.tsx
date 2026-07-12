import './CardModal.css';

interface Props {
  onClose: () => void;
}

const IsoBox = ({ x, y, z = 0, w, d, h, cTop, cSE, cSW }: any) => {
  const bx = x - z, by = y - z; // base shifted by z
  const tx = bx - h, ty = by - h; // top shifted by h
  return (
    <g>
      {/* South-East Wall (X+) */}
      <polygon points={`${bx+w},${by} ${bx+w},${by+d} ${tx+w},${ty+d} ${tx+w},${ty}`} fill={cSE} />
      {/* South-West Wall (Y+) */}
      <polygon points={`${bx+w},${by+d} ${bx},${by+d} ${tx},${ty+d} ${tx+w},${ty+d}`} fill={cSW} />
      {/* Top Wall */}
      <polygon points={`${tx},${ty} ${tx+w},${ty} ${tx+w},${ty+d} ${tx},${ty+d}`} fill={cTop} />
    </g>
  );
};

const FestivalIllustration = () => (
  <svg width="280" height="180" viewBox="0 0 280 180" style={{ overflow: 'visible', filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))' }}>
    {/* Base Transform for Ground */}
    <g transform="translate(140, 40) scale(1.414, 0.707) rotate(45)">
      {/* Base shadow */}
      <rect x="6" y="6" width="100" height="100" fill="#a0a4a8" opacity="0.6" />
      {/* Grass Base */}
      <rect x="0" y="0" width="100" height="100" fill="#aed581" />
      
      {/* Roads / Paths forming an X */}
      <line x1="0" y1="0" x2="100" y2="100" stroke="#9e9e9e" strokeWidth="18" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="#9e9e9e" strokeWidth="18" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="#e0e0e0" strokeWidth="14" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="#e0e0e0" strokeWidth="14" />
      
      {/* Trees at the corners */}
      <IsoBox x={8} y={8} z={0} w={10} d={10} h={12} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={82} y={8} z={0} w={10} d={10} h={12} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={8} y={82} z={0} w={10} d={10} h={12} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={82} y={82} z={0} w={10} d={10} h={12} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
    </g>

    {/* Stadium (Drawn in screen space for perfect cylinders/ellipses) */}
    {/* Origin translated to the center of the stadium */}
    <g transform="translate(140, 90)">
      {/* Outer Cylinder Body (Front half visible) */}
      <path d="M -48 0 L -48 -25 A 48 24 0 0 1 48 -25 L 48 0 A 48 24 0 0 1 -48 0 Z" fill="#e0e0e0" />
      
      {/* Vertical pillars (dark gray lines on the body) */}
      <line x1="-32" y1="17.5" x2="-32" y2="-7.5" stroke="#9e9e9e" strokeWidth="3.5" />
      <line x1="-16" y1="22.5" x2="-16" y2="-2.5" stroke="#9e9e9e" strokeWidth="3.5" />
      <line x1="0" y1="24" x2="0" y2="-1" stroke="#9e9e9e" strokeWidth="3.5" />
      <line x1="16" y1="22.5" x2="16" y2="-2.5" stroke="#9e9e9e" strokeWidth="3.5" />
      <line x1="32" y1="17.5" x2="32" y2="-7.5" stroke="#9e9e9e" strokeWidth="3.5" />

      {/* Main Door */}
      <path d="M -9 23 L -9 6 A 9 9 0 0 1 9 6 L 9 23 Z" fill="#757575" />
      
      {/* Outer Ring Top (White Roof rim) */}
      <ellipse cx="0" cy="-25" rx="48" ry="24" fill="#ffffff" />
      
      {/* Inner Hole (Showing inner wall depth) */}
      <ellipse cx="0" cy="-25" rx="30" ry="15" fill="#66bb6a" />
      {/* Inner Wall (Grey shadow of the inside wall) */}
      <path d="M -30 -25 A 30 15 0 0 0 30 -25 L 30 -18 A 30 15 0 0 1 -30 -18 Z" fill="#bdbdbd" />
      {/* Inner Field Ground */}
      <ellipse cx="0" cy="-18" rx="30" ry="15" fill="#81c784" />

      {/* Purple/Magenta Seating/Roofs on top (Right/Top-Right side) */}
      {/* Using paths to follow the ellipses */}
      <path d="M 0 -49 A 48 24 0 0 1 46 -18 L 32 -18 A 30 15 0 0 0 0 -40 Z" fill="#ab47bc" />
      <path d="M 5 -47.5 A 48 24 0 0 1 42 -20 L 29 -20 A 30 15 0 0 0 5 -38.5 Z" fill="#8e24aa" />
      
      {/* Segmentation lines on seating */}
      <line x1="16" y1="-43" x2="12" y2="-34" stroke="#6a1b9a" strokeWidth="2" />
      <line x1="30" y1="-33" x2="21" y2="-27" stroke="#6a1b9a" strokeWidth="2" />
    </g>
  </svg>
);

export default function FestivalModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header">
            <h3>GIẢI ĐẤU THẾ GIỚI</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body">
            <div className="card-illustration">
              <FestivalIllustration />
            </div>
            <div className="card-text">
              Chi phí tiến hành giải đấu <strong>50000</strong>
            </div>
            <ul className="card-list">
              <li>Tổ chức một giải đấu thế giới làm tăng hệ số cho thuê</li>
              <li>Giải đấu thế giới chỉ có thể được tổ chức tại một thành phố tại một thời điểm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

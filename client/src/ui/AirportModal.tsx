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

const AirportIllustration = () => (
  <svg width="280" height="180" viewBox="0 0 280 180" style={{ overflow: 'visible', filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))' }}>
    <g transform="translate(140, 40) scale(1.414, 0.707) rotate(45)">
      {/* Runway Base Shadow */}
      <rect x="6" y="6" width="100" height="100" fill="#888c90" />
      {/* Runway Base */}
      <rect x="0" y="0" width="100" height="100" fill="#a0a4a8" />
      
      {/* Dashed line */}
      <g fill="#ffffff">
        <rect x="48" y="10" width="4" height="12" />
        <rect x="48" y="30" width="4" height="12" />
        <rect x="48" y="50" width="4" height="12" />
        <rect x="48" y="70" width="4" height="12" />
      </g>
      
      {/* Trees */}
      <IsoBox x={10} y={10} z={0} w={6} d={6} h={8} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={20} y={5}  z={0} w={5} d={5} h={7} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={80} y={85} z={0} w={6} d={6} h={9} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={75} y={92} z={0} w={5} d={5} h={6} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      <IsoBox x={85} y={5}  z={0} w={5} d={5} h={6} cTop="#81c784" cSE="#4caf50" cSW="#66bb6a" />
      
      {/* Control Tower */}
      {/* Base */}
      <IsoBox x={65} y={15} z={0} w={16} d={16} h={25} cTop="#f5f5f5" cSE="#bdbdbd" cSW="#e0e0e0" />
      {/* Glass */}
      <IsoBox x={64} y={14} z={25} w={18} d={18} h={8} cTop="#81d4fa" cSE="#0288d1" cSW="#29b6f6" />
      {/* Roof */}
      <IsoBox x={64} y={14} z={33} w={18} d={18} h={3} cTop="#ef5350" cSE="#c62828" cSW="#e53935" />
      {/* Antenna */}
      <IsoBox x={72} y={22} z={36} w={2} d={2} h={10} cTop="#bdbdbd" cSE="#757575" cSW="#9e9e9e" />
      
      {/* Airplane */}
      <g>
        {/* Fuselage (Body) */}
        <IsoBox x={40} y={35} z={2} w={10} d={40} h={10} cTop="#ffffff" cSE="#9e9e9e" cSW="#e0e0e0" />
        {/* Cockpit window (dark blue) */}
        <IsoBox x={41} y={36} z={6} w={8} d={4} h={6} cTop="#1565c0" cSE="#0d47a1" cSW="#1976d2" />
        {/* Left Wing */}
        <IsoBox x={20} y={55} z={2} w={20} d={10} h={2} cTop="#ffffff" cSE="#9e9e9e" cSW="#e0e0e0" />
        {/* Right Wing */}
        <IsoBox x={50} y={55} z={2} w={20} d={10} h={2} cTop="#ffffff" cSE="#9e9e9e" cSW="#e0e0e0" />
        {/* Tail fin (Vertical stabilizer) */}
        <IsoBox x={43} y={70} z={12} w={4} d={8} h={12} cTop="#1e88e5" cSE="#1565c0" cSW="#1976d2" />
        {/* Tail wings (Horizontal stabilizers) */}
        <IsoBox x={30} y={72} z={4} w={10} d={6} h={2} cTop="#ffffff" cSE="#9e9e9e" cSW="#e0e0e0" />
        <IsoBox x={50} y={72} z={4} w={10} d={6} h={2} cTop="#ffffff" cSE="#9e9e9e" cSW="#e0e0e0" />
      </g>
    </g>
  </svg>
);

export default function AirportModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header">
            <h3>CHUYẾN ĐI VÒNG QUANH THẾ GIỚI</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body">
            <div className="card-illustration">
              <AirportIllustration />
            </div>
            <div className="card-text">
              Chi phí cho chuyến đi vòng quanh thế giới <strong>50000</strong>
            </div>
            <ul className="card-list">
              <li>Cho phép bạn di chuyển đến bất kỳ ô vuông nào không bị đối thủ của bạn chiếm giữ</li>
              <li>Bạn chỉ có thể sử dụng chuyến bay ở lượt tiếp theo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

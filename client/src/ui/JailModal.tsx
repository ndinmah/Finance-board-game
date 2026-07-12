import './CardModal.css';

interface Props {
  onClose: () => void;
}

const JailIllustration = () => (
  <svg width="280" height="180" viewBox="0 0 280 180" style={{ overflow: 'visible', filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))' }}>
    {/* Base Transform for Ground */}
    <g transform="translate(140, 40) scale(1.414, 0.707) rotate(45)">
      {/* Water Base Shadow */}
      <rect x="6" y="6" width="100" height="100" fill="#4fc3f7" opacity="0.5" />
      {/* Water Base */}
      <rect x="0" y="0" width="100" height="100" fill="#81d4fa" />
      
      {/* Island (Sandy Blob) */}
      {/* Overlapping circles make a nice blob in isometric space */}
      <g fill="#ffe0b2">
        <circle cx="50" cy="50" r="25" />
        <circle cx="65" cy="40" r="15" />
        <circle cx="40" cy="65" r="18" />
        <circle cx="35" cy="35" r="12" />
        <circle cx="65" cy="65" r="12" />
      </g>

      {/* Tree Shadow */}
      <circle cx="55" cy="55" r="12" fill="#d7ccc8" opacity="0.7" />

      {/* Palm Tree Trunk */}
      {/* Curves up (towards top-left in rotated space) */}
      <path d="M 55 55 Q 45 40 20 20" stroke="#795548" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      
      {/* Palm Leaves */}
      <g transform="translate(20, 20)">
        <path d="M 0 0 Q -15 -10 -25 -5 Q -15 -2 0 0 Z" fill="#66bb6a" />
        <path d="M 0 0 Q -10 -25 -5 -35 Q -2 -20 0 0 Z" fill="#4caf50" />
        <path d="M 0 0 Q 15 -15 25 -5 Q 15 -5 0 0 Z" fill="#66bb6a" />
        <path d="M 0 0 Q 20 10 30 15 Q 15 15 0 0 Z" fill="#4caf50" />
        <path d="M 0 0 Q 5 20 -5 30 Q -5 15 0 0 Z" fill="#66bb6a" />
        <path d="M 0 0 Q -20 20 -30 15 Q -15 10 0 0 Z" fill="#4caf50" />
      </g>

      {/* Shark Fins */}
      <g transform="translate(20, 80)">
         <polygon points="0,0 5,-2 -8,-15" fill="#455a64" />
      </g>
      <g transform="translate(80, 20)">
         <polygon points="0,0 5,-2 -8,-15" fill="#455a64" />
      </g>

      {/* Life Buoy */}
      <g transform="translate(25, 45)">
         <circle cx="0" cy="0" r="6" fill="none" stroke="#ffca28" strokeWidth="4.5" />
         {/* Red stripes (diagonal in rotated space looks vertical/horizontal in screen) */}
         <line x1="-6" y1="-6" x2="-4" y2="-4" stroke="#f44336" strokeWidth="3" />
         <line x1="6" y1="6" x2="4" y2="4" stroke="#f44336" strokeWidth="3" />
         <line x1="-6" y1="6" x2="-4" y2="4" stroke="#f44336" strokeWidth="3" />
         <line x1="6" y1="-6" x2="4" y2="-4" stroke="#f44336" strokeWidth="3" />
      </g>
    </g>
  </svg>
);

export default function JailModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header">
            <h3>HÒN ĐẢO BỊ LÃNG QUÊN</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body">
            <div className="card-illustration">
              <JailIllustration />
            </div>
            <div className="card-text">
              Khi đến đảo, bạn không được di chuyển trong ba lượt.
              <br /><br />
              Làm thế nào để thoát ra:
            </div>
            <ul className="card-list" style={{ listStyle: 'decimal inside', marginTop: '4px' }}>
              <li>Ném ra được một cặp</li>
              <li>Trả <strong>200000</strong> cho ngân hàng</li>
              <li>Sử dụng thẻ đặc biệt</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

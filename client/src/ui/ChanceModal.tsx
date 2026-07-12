import './CardModal.css';

interface Props {
  onClose: () => void;
}

const ChanceIllustration = () => {
  const R = 60;
  const segments = [
    { fill: '#ffca28' }, // yellow
    { fill: '#81c784' }, // green
    { fill: '#e91e63' }, // pink
    { fill: '#29b6f6' }, // blue
    { fill: '#ffca28' },
    { fill: '#81c784' },
    { fill: '#e91e63' },
    { fill: '#29b6f6' },
    { fill: '#ffca28' },
    { fill: '#81c784' },
    { fill: '#e91e63' },
    { fill: '#29b6f6' },
  ];

  // 12 segments, each 30 degrees
  const paths = segments.map((seg, i) => {
    const a1 = (i * 30 * Math.PI) / 180;
    const a2 = ((i + 1) * 30 * Math.PI) / 180;
    const x1 = R * Math.cos(a1);
    const y1 = R * Math.sin(a1);
    const x2 = R * Math.cos(a2);
    const y2 = R * Math.sin(a2);
    return (
      <path
        key={i}
        d={`M 0 0 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`}
        fill={seg.fill}
      />
    );
  });

  return (
    <svg width="280" height="150" viewBox="0 0 280 150" style={{ overflow: 'visible', filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))' }}>
      <g transform="translate(140, 75)">
        {/* Shadow */}
        <ellipse cx="0" cy="15" rx="65" ry="25" fill="#e0e0e0" opacity="0.8" />
        
        {/* Tilt the wheel back (isometric-like) */}
        <g transform="scale(1, 0.35) rotate(15)">
          {/* Wheel thickness/base */}
          <circle cx="0" cy="5" r={R} fill="#bdbdbd" />
          <circle cx="0" cy="10" r={R} fill="#9e9e9e" />
          <circle cx="0" cy="15" r={R} fill="#757575" />
          
          {/* Wheel face */}
          <g>
            {paths}
          </g>
          
          {/* Center Hub */}
          <circle cx="0" cy="0" r="14" fill="#bdbdbd" />
          <circle cx="0" cy="0" r="10" fill="#9e9e9e" />
        </g>
        
        {/* White Pointer on the right */}
        {/* Points left towards the center. */}
        <g transform="translate(30, 0)">
          {/* Pointer shape: white triangle */}
          <path d="M 25 -10 L 0 0 L 25 10 Z" fill="#ffffff" filter="drop-shadow(-2px 2px 2px rgba(0,0,0,0.2))" />
          {/* Pointer base */}
          <path d="M 23 -10 L 40 -10 L 40 10 L 23 10 Z" fill="#ffffff" />
          {/* Pointer inner detail */}
          <path d="M 25 -6 L 8 0 L 25 6 Z" fill="#f5f5f5" />
        </g>
      </g>
    </svg>
  );
};

export default function ChanceModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header">
            <h3>CƠ HỘI</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body">
            <div className="card-illustration">
              <ChanceIllustration />
            </div>
            <div className="card-text">
              Thẻ cơ hội vừa có thể giúp bạn, vừa có thể cản trở bạn trên con đường chiến thắng.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

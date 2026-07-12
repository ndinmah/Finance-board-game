import './CardModal.css';

interface Props {
  onClose: () => void;
}

const TaxIllustration = () => (
  <svg width="240" height="160" viewBox="0 0 240 160" style={{ overflow: 'visible', filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))' }}>
    <g transform="translate(120, 30) scale(1.414, 0.707) rotate(45)">
      <rect x="0" y="0" width="80" height="80" fill="#c7c3b1" transform="translate(12, 12)" />
      <rect x="0" y="0" width="80" height="80" fill="#e3dfd3" transform="translate(6, 6)" />
      <rect x="0" y="0" width="80" height="80" fill="#ffffff" />
      <g fill="#777">
        <rect x="12" y="15" width="40" height="4" rx="2" />
        <rect x="12" y="27" width="56" height="4" rx="2" />
        <rect x="12" y="39" width="48" height="4" rx="2" />
        <rect x="12" y="51" width="25" height="4" rx="2" />
        <rect x="12" y="63" width="35" height="4" rx="2" />
      </g>
      <g transform="translate(56, 56)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="#ea005e" strokeWidth="4" />
        <circle cx="0" cy="0" r="8" fill="none" stroke="#ea005e" strokeWidth="1.5" />
      </g>
    </g>
  </svg>
);

export default function TaxModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header">
            <h3>THUẾ</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body">
            <div className="card-illustration">
              <TaxIllustration />
            </div>
            <div className="card-text">
              Lãi suất hiện tại
              <br />
              <strong>10% giá trị toàn bộ tài sản</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import './CardModal.css';

interface Props {
  onClose: () => void;
}

const TaxIllustration = () => (
  <img src="/images/tax.webp" alt="Thuế" />
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

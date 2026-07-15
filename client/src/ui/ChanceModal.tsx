import './CardModal.css';

interface Props {
  onClose: () => void;
}

const ChanceIllustration = () => (
  <img src="/images/chance.webp" alt="Cơ hội" />
);

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

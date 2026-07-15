import './CardModal.css';
import './FestivalModal.css';
import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const FestivalIllustration = () => (
  <img src="/images/festival.webp" alt="Festival" />
);

export default function FestivalModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}>
            <h3>LỄ HỘI THÀNH PHỐ</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body festival-body">
            <div className="festival-layout">
              <div className="festival-left-col">
                <div className="card-illustration festival-illustration">
                  <FestivalIllustration />
                </div>
              </div>

              <div className="festival-right-col">
                <div className="festival-ticket">
                  <div className="festival-ticket-header">
                    <span className="festival-ticket-title">🎉 CITY FESTIVAL / LỄ HỘI</span>
                    <span className="festival-ticket-badge">FESTIVAL</span>
                  </div>
                  <div className="festival-ticket-info">
                    <div className="festival-info-row">
                      <span className="festival-host-title">TỔ CHỨC SỰ KIỆN</span>
                      <span className="festival-host-sub">Tăng hệ số thuê thành phố</span>
                    </div>
                    <div className="festival-price-box">
                      <div className="festival-price-label">Chi phí đăng cai</div>
                      <div className="festival-price-value">{formatMoneyFull(50)} $</div>
                    </div>
                  </div>
                </div>

                <div className="festival-rules-section">
                  <h4 className="festival-rules-title">📋 Quy tắc lễ hội</h4>
                  <ul className="festival-rules-list">
                    <li className="festival-rule-item">
                      <span className="festival-rule-icon">📈</span>
                      <span className="festival-rule-text">Tổ chức lễ hội làm <strong>tăng vĩnh viễn</strong> hệ số thu tiền thuê đất.</span>
                    </li>
                    <li className="festival-rule-item">
                      <span className="festival-rule-icon">📍</span>
                      <span className="festival-rule-text">Chỉ có thể tổ chức tại <strong>một thành phố duy nhất</strong> tại một thời điểm.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

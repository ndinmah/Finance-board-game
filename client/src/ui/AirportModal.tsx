import './CardModal.css';
import './AirportModal.css';
import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const AirportIllustration = () => (
  <img 
    src="/images/airport.png" 
    alt="Airport" 
    style={{ 
      width: '100%', 
      height: 'auto', 
      borderRadius: '12px', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)' 
    }} 
  />
);

export default function AirportModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
            <h3>CHUYẾN ĐI VÒNG QUANH THẾ GIỚI</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="card-body airport-body">
            <div className="airport-layout">
              <div className="airport-left-col">
                <div className="card-illustration airport-illustration">
                  <AirportIllustration />
                </div>
              </div>

              <div className="airport-right-col">
                <div className="airport-ticket">
                  <div className="airport-ticket-header">
                    <span className="airport-ticket-title">✈️ BOARDING PASS / VÉ MÁY BAY</span>
                    <span className="airport-ticket-badge">VIP TICKET</span>
                  </div>
                  <div className="airport-ticket-info">
                    <div className="airport-dest-row">
                      <span className="airport-dest-code">AIRPORT</span>
                      <span className="airport-arrow">➔</span>
                      <span className="airport-dest-code">ANYWHERE</span>
                    </div>
                    <div className="airport-price-box">
                      <div className="airport-price-label">Chi phí vé</div>
                      <div className="airport-price-value">{formatMoneyFull(50)} $</div>
                    </div>
                  </div>
                </div>

                <div className="airport-rules-section">
                  <h4 className="airport-rules-title">📋 Quy định chuyến bay</h4>
                  <ul className="airport-rules-list">
                    <li className="airport-rule-item">
                      <span className="airport-rule-icon">🗺️</span>
                      <span className="airport-rule-text">Di chuyển đến <strong>bất kỳ ô vuông nào</strong> chưa bị đối thủ chiếm giữ.</span>
                    </li>
                    <li className="airport-rule-item">
                      <span className="airport-rule-icon">⏰</span>
                      <span className="airport-rule-text">Chuyến bay sẽ được khởi hành ngay ở <strong>lượt tiếp theo</strong> của bạn.</span>
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

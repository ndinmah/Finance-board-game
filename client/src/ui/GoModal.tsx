import './CardModal.css';
import './GoModal.css';
import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const GoIllustration = () => (
  <img src="/images/go.webp" alt="Go" />
);

export default function GoModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <h3>TRẠM KHỞI HÀNH</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="card-body go-body">
            <div className="go-layout">
              <div className="go-left-col">
                <div className="card-illustration go-illustration">
                  <GoIllustration />
                </div>
              </div>

              <div className="go-right-col">
                <div className="go-alert-box">
                  <div className="go-alert-title">
                    <span>🚀</span> Điểm xuất phát của mọi hành trình!
                  </div>
                  <div className="go-alert-desc">
                    Đây là vạch xuất phát. Mỗi lần bạn đi ngang qua hoặc dừng lại tại đây, ngân hàng sẽ thưởng cho bạn một khoản tiền tiêu vặt.
                  </div>
                </div>

                <div className="go-info-section">
                  <h4 className="go-info-title">📋 Quyền lợi</h4>
                  <ul className="go-info-list">
                    <li className="go-info-item">
                      <div className="go-info-icon-box">💵</div>
                      <div className="go-info-text-box">
                        <div className="go-info-label">Thưởng đi qua</div>
                        <div className="go-info-detail">Nhận ngay lương khi đi ngang qua (hoặc dừng lại).</div>
                      </div>
                      <span className="go-info-badge bonus">+{formatMoneyFull(300)} $</span>
                    </li>

                    <li className="go-info-item">
                      <div className="go-info-icon-box">🎲</div>
                      <div className="go-info-text-box">
                        <div className="go-info-label">Dừng trúng ô</div>
                        <div className="go-info-detail">Nhận ngẫu nhiên: Thêm lượt đi hoặc Nâng cấp từ xa!</div>
                      </div>
                      <span className="go-info-badge">Đặc quyền</span>
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

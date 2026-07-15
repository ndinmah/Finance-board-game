import './CardModal.css';
import './JailModal.css';
import { formatMoneyFull } from '../utils/format';

interface Props {
  onClose: () => void;
}

const JailIllustration = () => (
  <img src="/images/jail.webp" alt="Jail" />
);

export default function JailModal({ onClose }: Props) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal-wrapper">
        <div className="card-modal" onClick={e => e.stopPropagation()}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
            <h3>HÒN ĐẢO BỊ LÃNG QUÊN</h3>
            <button className="card-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="card-body jail-body">
            <div className="jail-layout">
              <div className="jail-left-col">
                <div className="card-illustration jail-illustration">
                  <JailIllustration />
                </div>
              </div>

              <div className="jail-right-col">
                <div className="jail-alert-box">
                  <div className="jail-alert-title">
                    <span>🏝️</span> Bạn đã bị mắc kẹt trên đảo!
                  </div>
                  <div className="jail-alert-desc">
                    Khi đến đây, bạn sẽ không được di chuyển trong vòng <strong>3 lượt</strong> tiếp theo trừ khi tìm cách thoát ra.
                  </div>
                </div>

                <div className="jail-escape-section">
                  <h4 className="jail-escape-title">🔑 Cách thức thoát đảo</h4>
                  <ul className="jail-escape-list">
                    <li className="jail-escape-item">
                      <div className="jail-escape-icon-box">🎲</div>
                      <div className="jail-escape-text-box">
                        <div className="jail-escape-label">Đổ xúc xắc đôi</div>
                        <div className="jail-escape-detail">Đổ ra hai mặt xúc xắc giống nhau ở đầu lượt.</div>
                      </div>
                      <span className="jail-escape-badge chance">May mắn</span>
                    </li>

                    <li className="jail-escape-item">
                      <div className="jail-escape-icon-box">💰</div>
                      <div className="jail-escape-text-box">
                        <div className="jail-escape-label">Nộp phạt ngân hàng</div>
                        <div className="jail-escape-detail">Trả tiền phạt ngay để được tiếp tục di chuyển.</div>
                      </div>
                      <span className="jail-escape-badge cost">{formatMoneyFull(200)} $</span>
                    </li>

                    <li className="jail-escape-item">
                      <div className="jail-escape-icon-box">🎫</div>
                      <div className="jail-escape-text-box">
                        <div className="jail-escape-label">Sử dụng Thẻ đặc biệt</div>
                        <div className="jail-escape-detail">Dùng thẻ "Thoát đảo miễn phí" kiếm được từ ô Cơ Hội.</div>
                      </div>
                      <span className="jail-escape-badge">Thẻ đặc quyền</span>
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


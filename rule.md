# Luật Chơi Webopoly (Dựa trên mã nguồn hiện tại)

Đây là tài liệu mô tả chi tiết luật chơi của Webopoly, được trích xuất trực tiếp từ logic code hiện tại của dự án.

## ⚙️ Thiết lập cơ bản
- **Số người chơi:** 2–6 người.
- **Tiền ban đầu:** 2.000đ mỗi người.
- **Thứ tự đi:** Ngẫu nhiên khi bắt đầu.
- **Thời gian mỗi lượt:** 5 phút (nếu hết giờ hệ thống sẽ tự động tung xúc xắc hoặc bỏ qua).

## 🗺️ Bản đồ (32 ô)
Bản đồ gồm 32 ô, bao gồm:
- **4 ô góc:** Xuất Phát (Go), Nhà Tù (Jail), Lễ Hội (Festival), Sân Bay (Airport).
- **24 ô đất (chia thành 8 nhóm màu):**
  - **Đỏ (Red):** Cà Mau, Bến Tre, Cần Thơ (60đ)
  - **Cam (Orange):** Long An, Vĩnh Long, Tiền Giang (100–120đ)
  - **Vàng (Yellow):** Đà Nẵng, Hội An, Huế (140–160đ)
  - **Xanh lá (Green):** Điện Biên, Sơn La (180–200đ)
  - **Xanh dương (Blue):** Nha Trang, Phú Quốc (220–240đ)
  - **Tím (Purple):** Ninh Bình, Quảng Ninh, Hà Nội (260–280đ)
  - **Hồng (Pink):** Bình Dương, HCM (300–320đ)
  - **Lục lam (Cyan):** Thanh Hóa, Đà Lạt (360–400đ)
- **4 ô Cảng (Port):** Cảng Nam, Cảng Tây, Cảng Bắc, Cảng Đông (200đ).
- **3 ô Cơ hội (Chance):** Hiện tại chưa có chức năng đặc biệt, người chơi bước vào sẽ kết thúc lượt.
- **1 ô Thuế Thu Nhập:** Phạt 10% tổng tài sản.

## 🎲 Lượt chơi & Di chuyển
1. Tới lượt, người chơi tung 2 viên xúc xắc và di chuyển đúng tổng số bước.
2. **Đổ đúp (Double):** Nếu 2 viên xúc xắc ra số giống nhau, người chơi được tung thêm 1 lượt nữa.
3. **Vào tù:** Nếu đổ đúp 3 lần liên tiếp, người chơi lập tức bị tống vào tù.
4. **Qua ô Xuất Phát:** Nhận ngay **300đ**. Nếu dừng đúng ô Xuất Phát, nhận thêm **300đ** nữa (tổng 600đ).

## 🏠 Đất đai & Xây dựng
- **Mua đất:** Khi dừng ở đất trống, bạn có quyền mua nếu đủ tiền.
- **Xây nhà/khách sạn:** Bạn có thể nâng cấp nhà lên cấp 1, 2, 3, và cuối cùng là Khách sạn. **Điều kiện:** Phải sở hữu toàn bộ các lô đất cùng nhóm màu mới được phép xây dựng. Không thể xây nhà trên Cảng.
- **Trả tô:** Khi dẫm lên đất của người khác, bạn phải trả tiền tô theo mức phát triển của lô đất:
  - Đất trống chưa độc quyền: Mức cơ bản.
  - Đất trống nhưng chủ sở hữu đã gom đủ nhóm màu (độc quyền): Tiền tô nhân đôi (x2).
  - Đất có nhà/khách sạn: Trả theo bảng giá tương ứng.

## 🚢 Bến Cảng (Port)
- **Giá mua:** 200đ.
- **Tiền tô:** Tính theo số cảng mà chủ sở hữu đang có = `25đ × số cảng`.
- **ĐIỀU KIỆN THẮNG ĐẶC BIỆT:** Nếu một người chơi thu thập đủ cả **4 Cảng**, người đó sẽ **Thắng ngay lập tức**.

## 🎪 Lễ Hội (Festival - Ô 16)
Khi bước vào ô Lễ Hội, bạn được chọn 1 lô đất đang sở hữu để **nhân đôi (x2)** toàn bộ bảng giá tô của lô đất đó.

## ✈️ Sân Bay (Airport - Ô 24)
- Khi vừa dẫm lên ô Sân Bay, lượt của bạn lập tức kết thúc.
- Ở lượt tiếp theo, bạn có 2 lựa chọn:
  1. Tung xúc xắc miễn phí để di chuyển như bình thường.
  2. Mua vé chuyến bay giá **50đ**: Bạn được phép bay thẳng đến bất kỳ ô đất trống nào hoặc ô đất thuộc sở hữu của bạn.

## 🏦 Thuế Thu Nhập (Ô 30)
- Trừ thẳng **10% Tổng tài sản** của người chơi.
  - Tổng tài sản = Tiền mặt + Giá gốc mua đất + Chi phí xây nhà/khách sạn.
- Tiền thuế sẽ trừ vào tiền mặt trước.
- Nếu tiền mặt không đủ, hệ thống tự động **bán tháo tài sản** (từ lô đất rẻ nhất) với giá 50% giá trị gốc cho đến khi đủ bù tiền thuế. Các lô đất bị bán tháo sẽ bị dỡ sạch nhà và trở thành đất vô chủ.

## 🔒 Cầm cố & Phá sản
- **Cầm cố:** Bạn có thể cầm cố đất bất kỳ lúc nào để nhận lại 50% giá mua ban đầu. Khi cầm cố, toàn bộ nhà trên đất sẽ bị dỡ bỏ. Đất đang cầm cố sẽ không thu được tiền tô.
- **Phá sản:** Xảy ra khi tiền của bạn bị âm mà không còn tài sản nào để tự động bán hoặc cầm cố. Khi phá sản, toàn bộ tài sản của bạn sẽ bị hệ thống tịch thu, dỡ nhà và trở thành đất vô chủ. Bạn bị loại khỏi trò chơi. Người còn sống sót cuối cùng sẽ là người chiến thắng.

## 💸 Cướp đất (Buyout)
- Nếu dừng ở lô đất của người khác (không phải Cảng và chưa xây Khách sạn), bạn có quyền "Cướp" lô đất đó bằng cách trả cho chủ sở hữu số tiền gấp đôi tổng giá trị lô đất (bao gồm tiền đất + tiền xây nhà hiện tại).

*(Lưu ý: Các ô "Cơ hội" hiện chưa được cài đặt sự kiện cụ thể).*

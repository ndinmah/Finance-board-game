# Luật Chơi Webopoly (Dựa trên logic code thực tế)

Đây là tài liệu mô tả chi tiết luật chơi của Webopoly, được trích xuất trực tiếp từ mã nguồn hiện tại của game (WebopolyRoom.ts & mapData.ts).

## ⚙️ Thiết Lập Cơ Bản
- **Số người chơi:** 2 - 6 người.
- **Tiền ban đầu:** 20.000K mỗi người.
- **Thứ tự đi:** Ngẫu nhiên khi bắt đầu game.
- **Thời gian lượt:** 5 phút (300,000 ms). Hết giờ hệ thống tự động thao tác (tung xúc xắc, bỏ qua mua đất/cướp đất, tự động bán đất trả nợ).
- **Mất kết nối:** Nếu người chơi mất kết nối và không trở lại, Bot sẽ đánh thay.
- **Thời gian tối đa (Time Limit):** 1 Tiếng. Nếu hết 1 tiếng game chưa kết thúc, người có **Tổng Tài Sản (Tiền mặt + 100% Giá trị gốc của đất đai)** cao nhất sẽ thắng.

## 🗺️ Bản Đồ (32 Ô)
- **4 Ô Góc:** Xuất Phát (0), Nhà Tù (8), Lễ Hội (16), Sân Bay (24).
- **20 Ô Đất (8 nhóm màu):**
    - Đỏ (3 ô): Cà Mau, Bến Tre, Cần Thơ.
    - Cam (3 ô): Long An, Vĩnh Long, Mỹ Tho.
    - Vàng (3 ô): Đà Nẵng, Hội An, Huế.
    - Xanh lá (2 ô): Điện Biên, Mộc Châu.
    - Xanh dương (2 ô): Nha Trang, Phú Quốc.
    - Tím (3 ô): Ninh Bình, Hạ Long, Hà Nội.
    - Hồng (2 ô): Vũng Tàu, HCM.
    - Lục lam (2 ô): Thanh Hóa, Đà Lạt.
- **4 Ô Cảng (Port):** Nam (4), Tây (14), Bắc (18), Đông (25). Giá mua: 200K.
- **3 Ô Cơ Hội (Chance):** Ô số 12, 20, 28.
- **1 Ô Thuế (Tax):** Ô số 30.
- **✨ ĐIỂM DU LỊCH (Đặc biệt):** Ngay khi game bắt đầu, 3 ô ngẫu nhiên (chọn từ đất hoặc cảng) sẽ được buff làm Điểm Du Lịch, tiền tô tại các ô này luôn được nhân đôi (x2).

## 🎲 Lượt Chơi & Di Chuyển
- Tung 2 viên xúc xắc. Di chuyển theo tổng xúc xắc.
- **Double (Đổ Đôi):** Được đi thêm 1 lượt. Nếu đổ Double 3 lần liên tiếp, vào thẳng Nhà Tù và mất lượt.
- **Qua ô Xuất Phát (GO):** Nhận 300K tiền lương.
- **Dừng ĐÚNG ô Xuất Phát (GO):**
    - Không nhận thêm tiền (chỉ nhận 300K vì đã tính là đi qua).
    - Có 50% cơ hội: Được tặng thêm 1 lượt đi ngay lập tức.
    - Có 50% cơ hội: Được kích hoạt "Nâng cấp từ xa". Bạn được chọn 1 mảnh đất bất kỳ đang sở hữu để xây nhà mà không cần phải đứng trên nó (phí xây nhà vẫn trừ bình thường).

## 🏠 Đất Đai & Xây Dựng
- **Cấp độ nhà:** Đất trống -> Nhà 1 -> Nhà 2 -> Nhà 3 -> Khách sạn (Cấp 4).
- **Giới hạn xây dựng:**
    - Vòng 1 (Chưa qua ô GO lần nào): Chỉ được xây tối đa lên Nhà 2. *(Lưu ý: Nếu cướp đất đã có sẵn 3 nhà, hệ thống sẽ giữ nguyên 3 nhà chứ không ép hạ xuống).*
    - Từ Vòng 2 trở đi (Đã qua ô GO ít nhất 1 lần): Được xây lên Nhà 3 và Khách sạn.
- **Cướp đất (Buyout):**
    - Khi dẫm lên đất đối thủ, nếu họ **chưa xây Khách sạn** và đó **không phải là Bến Cảng**, bạn có quyền Cướp đất.
    - **Giá cướp:** Gấp 2 lần tổng giá trị hiện tại của mảnh đất (Giá mua đất + Tổng tiền đã xây nhà). Số tiền này được trả thẳng cho chủ cũ.
    - Cướp xong, bạn có quyền xây thêm nhà ngay lập tức nếu đủ điều kiện vòng chơi.

## 💰 Tiền Tô (Rent)
Tiền tô được tính theo cấp nhà, có thể được buff bằng các hệ số nhân sau (cộng dồn nhân lẫn nhau):
- **Độc quyền nhóm màu:** Nếu sở hữu tất cả các mảnh đất cùng 1 màu, tiền tô của màu đó nhân đôi (x2).
- **Điểm Du lịch:** Tiền tô nhân đôi (x2).
- **Lễ Hội (Festival):** Tiền tô nhân đôi (x2) nếu ô đất đang có Lễ hội.
- *Ví dụ: Nếu 1 mảnh đất vừa độc quyền màu, vừa là điểm du lịch, vừa tổ chức lễ hội -> Tiền tô được nhân x8!*

## 🚢 Bến Cảng (Port)
- Thu tô dựa trên số lượng Cảng mà chủ sở hữu đang có:
    - 1 Cảng = 25K
    - 2 Cảng = 50K
    - 3 Cảng = 100K
    - 4 Cảng = 200K (Thường game sẽ kết thúc luôn ngay khi ai đó gom đủ 4 Cảng).
- Không thể xây nhà, không thể bị Cướp (Buyout) theo cách thông thường (trừ khi dùng thẻ Cơ Hội).

## ⚖️ Các Ô Chức Năng Đặc Biệt
- **Thuế (Tax - Ô 30):** Bị phạt 10% Tổng Tài Sản (Tiền mặt + (Giá bán lại đất * 2)).
- **Sân Bay (Airport - Ô 24):**
    - Dừng chân kết thúc lượt chờ chuyến bay. Nếu đổ đôi vào Sân bay sẽ bị mất lượt đôi.
    - Lượt tiếp theo: Phải trả phí 50K. Bạn được chọn bay thẳng đến **Bất kỳ ô đất/cảng vô chủ nào** hoặc **Ô đất của chính bạn**. Bay xong thực hiện sự kiện tại ô đó bình thường.
- **Lễ Hội (Festival - Ô 16):**
    - Trả phí 50K để tổ chức Lễ hội tại 1 thành phố bất kỳ mà bạn đang sở hữu. Thành phố đó sẽ được x2 Tiền tô. Chỉ có 1 Lễ hội được phép tồn tại trên toàn bản đồ.
- **Nhà Tù (Jail - Ô 8):**
    - Phải ở tù 3 lượt.
    - Cách ra tù: (1) Trả phí bảo lãnh 200K, (2) Đổ xúc xắc ra Đôi (Đổ đôi thoát tù sẽ mất luôn quyền đi thêm lượt), (3) Dùng Thẻ ra tù miễn phí, hoặc (4) Chờ hết 3 lượt sẽ tự động thả.

## 🃏 Thẻ Cơ Hội (Chance)
Hệ thống thẻ cơ hội gồm 18 thẻ có thể thay đổi hoàn toàn cục diện game:
- **Buff/Debuff tiền tô:** Giảm 50% tiền thuê tiếp theo, Trả gấp đôi tiền thuê tiếp theo.
- **Tấn Công / Phòng Thủ:**
    - *Shield:* Tạo 1 Khiên bảo vệ trên 1 thành phố của mình.
    - *Force Sell:* Ép đối thủ bán 1 ô đất (họ nhận lại tiền bán bằng 50% giá trị gốc).
    - *Sabotage:* Giáng cấp 1 nhà của đối thủ.
    - *Earthquake:* Xóa sổ hoàn toàn 1 mảnh đất (về trạng thái vô chủ).
    - *Blackout:* Cúp điện thành phố đối thủ. Thành phố bị mất hiệu lực thu tiền cho đến khi đối thủ đi qua vạch Xuất Phát 3 lần!
    - *Lưu ý:* Khiên bảo vệ có thể đỡ được 1 lần các đòn Tấn công.
- **Dịch Chuyển:** Bay đến Sân bay, bay về Xuất Phát, bay đến ô Lễ Hội, dính bẫy bay về ô Thuế / ô Nhà Tù.
- **Sự Kiện Đặc Biệt:** Nhận 25K tiền sinh nhật từ MỖI đối thủ, Bị phạt 50K ngẫu nhiên, Tặng 1 thành phố cho người khác, Thẻ ra tù miễn phí.

## 🏦 Nợ Nần & Phá Sản
- **Giá trị bán đất:** Mọi mảnh đất khi bán cho Ngân hàng để trả nợ chỉ thu hồi được **50%** (Giá gốc + Tiền xây nhà).
- Khi bạn thiếu tiền, game đưa bạn vào trạng thái trả nợ. Nếu hết giờ lượt (5 phút) mà bạn chưa trả xong, hệ thống **tự động bán mảnh đất rẻ nhất** của bạn đi cho đến khi đủ trả nợ.
- Nếu bạn bán sạch tài sản vẫn không đủ trả: Bạn bị Phá Sản. Toàn bộ số tiền (nếu còn) được thanh toán cho chủ nợ. Trò chơi kết thúc nếu chỉ còn 1 người.

## 🏆 ĐIỀU KIỆN THẮNG (WIN CONDITIONS)
Trò chơi sẽ lập tức kết thúc nếu một người chơi đạt được 1 trong các điều kiện sau:
1. **Sống sót cuối cùng:** Tất cả người chơi khác đều phá sản.
2. **Độc Quyền Cảng (Port Monopoly):** Sở hữu đủ 4 Bến Cảng.
3. **Độc Quyền Đường Bay (Line Monopoly):** Sở hữu toàn bộ các lô đất và cảng trên cùng 1 cạnh của bàn cờ (ví dụ: ôm trọn từ ô 1 đến ô 7).
4. **Độc Quyền 3 Màu (Triple Monopoly):** Hoàn thành việc Độc quyền (gom đủ các ô) của 3 nhóm màu khác nhau trên bản đồ.
5. **Hết giờ (Time Limit):** Sau 1 tiếng (60 phút) tính từ lúc bắt đầu, game tự động chốt sổ. Người có Tổng tài sản lớn nhất chiến thắng.

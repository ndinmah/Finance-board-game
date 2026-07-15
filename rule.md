# Luật Chơi Webopoly (Dựa trên mã nguồn hiện tại)

Đây là tài liệu mô tả chi tiết luật chơi của Webopoly, được trình bày theo cấu trúc Business Logic (dễ dàng tham chiếu cho lập trình viên).

## ⚙️ Thiết lập cơ bản
- Số người chơi: 2 - 6 người.
- Tiền ban đầu: 2.000đ mỗi người.
- Thứ tự đi: Random khi bắt đầu game.
- Hết thời gian lượt (5 phút):
    -> Hệ thống tự động tung xúc xắc hoặc thực hiện hành động mặc định.

## 🗺️ Bản đồ (32 ô)
Bản đồ gồm 32 ô:
- 4 ô góc:
    -> Ô 0: Xuất Phát (Go)
    -> Ô 8: Nhà Tù (Jail)
    -> Ô 16: Lễ Hội (Festival)
    -> Ô 24: Sân Bay (Airport)
- 24 ô đất (8 nhóm màu):
    -> Đỏ: Cà Mau, Bến Tre, Cần Thơ (60đ)
    -> Cam: Long An, Vĩnh Long, Mỹ Tho (100–120đ)
    -> Vàng: Đà Nẵng, Hội An, Huế (140–160đ)
    -> Xanh lá: Điện Biên, Mộc Châu (180–200đ)
    -> Xanh dương: Nha Trang, Phú Quốc (220–240đ)
    -> Tím: Ninh Bình, Hạ Long, Hà Nội (260–280đ)
    -> Hồng: Vũng Tàu, HCM (300–320đ)
    -> Lục lam: Thanh Hóa, Đà Lạt (360–400đ)
- 4 ô Cảng (Port):
    -> Giá mua: 200đ.
- 3 ô Cơ hội (Chance):
    -> Chưa có chức năng, vào ô sẽ kết thúc lượt.
- 1 ô Thuế (Tax):
    -> Phạt 10% tổng tài sản.

## 🎲 Lượt chơi & Di chuyển
Khi tới lượt của người chơi:
    - Tung 2 viên xúc xắc.
    - Di chuyển số bước = Tổng 2 viên xúc xắc.

    Nếu 2 viên xúc xắc giống nhau (Double):
        - Nếu số lần Double liên tiếp == 3:
            -> Bị đưa vào Nhà Tù (Jail).
            -> Kết thúc lượt.
        - Nếu số lần Double liên tiếp < 3:
            -> Được tung xúc xắc thêm 1 lần nữa sau khi hoàn thành các hành động của ô hiện tại.

    Khi người chơi đi qua ô Bắt đầu (nhưng không dừng lại):
        -> Nhận ngay 300đ.

    Khi người chơi dừng đúng ô Bắt đầu:
        - Không nhận thêm tiền phụ (chỉ nhận 300đ do đi qua).
        - Random 1 trong 2 sự kiện:
            Sự kiện 1:
                -> Được tung xúc xắc thêm 1 lần (dù không đổ Double).
            Sự kiện 2:
                -> Được quyền nâng cấp nhà từ xa (nếu nâng cấp sẽ tốn phí như bình thường).
                -> Nếu không sở hữu đất hoặc không đủ tiền cho bất kỳ mảnh đất nào:
                    -> Tự động bỏ qua.
                -> Ngược lại:
                    -> Chọn 1 ô đất để nâng cấp.
                    -> Hoặc chọn bỏ qua.

## 🏠 Đất đai & Xây dựng
Khi dừng ở ô đất trống:
    - Nếu đủ tiền:
        -> Có quyền mua đất.
    - Không yêu cầu phải sở hữu cả nhóm màu để mua hoặc xây nhà.
    - Không thể xây nhà trên Cảng.

Khi dừng ở ô đất đã sở hữu:
    - Có quyền nâng cấp (mua thêm cấp nhà).
    - Cấp độ nhà: Nhà 1 -> Nhà 2 -> Nhà 3 -> Khách sạn.
    - Điều kiện nâng cấp:
        - Vòng đầu tiên (passCount == 0):
            -> Xây tối đa đến Nhà 2.
        - Sau khi đi qua ô Bắt đầu >= 1 lần (passCount > 0):
            -> Được phép xây lên Nhà 3 và Khách sạn.
        - Khách sạn chỉ được phép xây khi đất đã đạt Nhà 3.
        - Cho phép xây nhiều nhà cùng lúc (nhảy cóc) nếu đủ tiền và không vượt giới hạn vòng chơi.

Khi dừng ở ô đất của người khác:
    - Nếu chủ sở hữu chưa độc quyền nhóm màu:
        -> Phải trả tiền thuê (tương ứng cấp nhà hiện tại).
    - Nếu chủ sở hữu đã độc quyền (sở hữu toàn bộ nhóm màu đó):
        -> Phải trả tiền thuê x2 (bất kể cấp nhà).

## 🚢 Bến Cảng (Port)
Khi sở hữu Bến Cảng:
    - Tiền tô = 25đ * (Số lượng Cảng mà chủ sở hữu đang có).
    - Nếu một người chơi sở hữu đủ 4 Cảng:
        -> Người chơi đó lập tức Thắng game.

## 🎪 Lễ Hội (Festival - Ô 16)
Khi dừng ở ô Lễ Hội:
    -> Chọn 1 lô đất đang sở hữu để tổ chức Lễ Hội.
    -> Tiền tô của lô đất đó được nhân đôi (x2) (cộng dồn với hiệu ứng độc quyền nếu có).
    -> Chỉ có duy nhất 1 Lễ Hội được diễn ra trên bản đồ cùng một lúc (Lễ hội mới sẽ thay thế Lễ hội cũ).

## ✈️ Sân Bay (Airport - Ô 24)
Khi dừng ở ô Sân Bay:
    - Nếu đổ bằng Double để vào:
        -> Bị hủy quyền đi thêm lượt của Double.
    -> Kết thúc lượt ngay lập tức.

Ở lượt tiếp theo của người chơi đó (đang đứng tại Sân Bay):
    - Chọn 1 trong 2 hành động:
        Hành động 1:
            -> Tung xúc xắc miễn phí để di chuyển như bình thường.
        Hành động 2:
            -> Trả 50đ để mua vé.
            -> Bay thẳng đến bất kỳ ô đất trống nào hoặc ô đất thuộc sở hữu của bản thân.

## 💸 Cướp đất (Buyout)
Khi dừng ở ô đất của người khác (không phải Cảng, chưa xây Khách sạn):
    - Có quyền mua lại (Cướp) mảnh đất đó.
    - Số tiền phải trả = 2 * (Chi phí mua đất + Tổng chi phí xây nhà hiện tại).
    - Số tiền này được trả thẳng cho chủ sở hữu cũ.

## 🏦 Nợ Nần & Phá Sản
Không có tính năng cầm cố. Áp dụng bán đất trả nợ.

Khi phải trả tiền (thuế, tiền tô) nhưng không đủ tiền mặt:
    - Trạng thái nợ nần được kích hoạt.
    - Giá trị bán lại của đất = 50% * (Chi phí gốc của đất + Tổng chi phí xây nhà).
    - Tính (Tổng giá trị bán lại của tất cả tài sản).

    Nếu (Tổng giá trị bán lại >= Số tiền đang nợ):
        -> Bắt buộc chọn bán đất để trả nợ cho đến khi đủ tiền.
        -> Đất bị bán sẽ bị dỡ sạch nhà và trở thành đất vô chủ.
        -> Nếu hết giờ không thao tác:
            -> Hệ thống tự động bán các mảnh đất rẻ nhất để trừ nợ.

    Nếu (Tổng giá trị bán lại < Số tiền đang nợ):
        -> Người chơi bị Phá sản.
        -> Hệ thống tự động thanh lý toàn bộ đất cho Ngân Hàng (trả về trạng thái vô chủ).
        -> Tính Tổng quỹ = (Tiền thanh lý đất + Tiền mặt đang có).
        -> Trả cho chủ nợ số tiền = Tổng quỹ (nếu nợ nhiều hơn Tổng quỹ, chủ nợ chỉ nhận được Tổng quỹ; nếu tự nguyện bỏ cuộc khi nợ ít hơn Tổng quỹ, chủ nợ nhận đủ nợ).
        -> Số tiền dư (nếu có) bị Ngân Hàng thu hồi (về 0).
        -> Người chơi bị loại khỏi game.
        -> Trò chơi kết thúc nếu chỉ còn 1 người chơi sống sót.

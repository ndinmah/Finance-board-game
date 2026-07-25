# Luật chơi Webopoly

Tài liệu này mô tả đúng hành vi đang được server thực thi trong `WebopolyRoom.ts` và dữ liệu ở `mapData.ts`. Đơn vị tiền trong game là **K**.

## 1. Thiết lập ván

- Một phòng có từ **2 đến 8 người chơi**, tính cả bot.
- Mỗi người bắt đầu tại ô **Xuất Phát (0)** với **20.000K**.
- Ván bắt đầu khi có ít nhất 2 người và tất cả người trong phòng đã sẵn sàng. Thứ tự lượt được xáo ngẫu nhiên.
- Khi bắt đầu, server chọn ngẫu nhiên **3 ô mua được** (đất hoặc cảng) làm Điểm Du Lịch.
- Mỗi pha quyết định thông thường có thời hạn **5 phút**. Các pha chọn mục tiêu của thẻ Cơ Hội có 15 giây; pha chọn đầu tiên sau khi hiện thẻ được cộng thêm 4 giây trình chiếu.
- Sau 30 giây mất kết nối mà không quay lại, người chơi được chuyển sang bot.
- Ván có giới hạn **1 giờ**.

## 2. Bản đồ

Bàn cờ có 32 ô:

- Góc: Xuất Phát (0), Nhà Tù (8), Lễ Hội (16), Sân Bay (24).
- Cơ Hội: 12, 20, 28.
- Thuế: 30.
- Cảng: Cảng Nam (4), Cảng Tây (14), Cảng Bắc (18), Cảng Đông (25); mỗi cảng giá 200K.
- 20 ô đất thuộc 8 nhóm màu:
  - Đỏ: Cà Mau (1), Bến Tre (2), Cần Thơ (3).
  - Cam: Long An (5), Vĩnh Long (6), Mỹ Tho (7).
  - Vàng: Đà Nẵng (9), Hội An (10), Huế (11).
  - Xanh lá: Điện Biên (13), Mộc Châu (15).
  - Xanh dương: Nha Trang (17), Phú Quốc (19).
  - Tím: Ninh Bình (21), Hạ Long (22), Hà Nội (23).
  - Hồng: Vũng Tàu (26), HCM (27).
  - Cyan: Thanh Hóa (29), Đà Lạt (31).

### Giá đất, xây dựng và tiền thuê

Các mức thuê lần lượt là: đất trống / nhà 1 / nhà 2 / nhà 3 / khách sạn.

| Ô | Thành phố | Giá | Xây 1 cấp nhà | Khách sạn | Các mức thuê |
|---:|---|---:|---:|---:|---|
| 1 | Cà Mau | 60 | 50 | 150 | 2 / 25 / 50 / 75 / 150 |
| 2 | Bến Tre | 60 | 50 | 150 | 2 / 28 / 55 / 83 / 165 |
| 3 | Cần Thơ | 60 | 50 | 150 | 4 / 30 / 60 / 90 / 180 |
| 5 | Long An | 100 | 50 | 150 | 6 / 33 / 65 / 98 / 188 |
| 6 | Vĩnh Long | 100 | 50 | 150 | 6 / 35 / 75 / 105 / 210 |
| 7 | Mỹ Tho | 120 | 50 | 150 | 8 / 38 / 75 / 113 / 225 |
| 9 | Đà Nẵng | 140 | 100 | 250 | 10 / 70 / 140 / 210 / 385 |
| 10 | Hội An | 140 | 100 | 250 | 10 / 75 / 150 / 225 / 413 |
| 11 | Huế | 160 | 100 | 250 | 12 / 80 / 160 / 240 / 440 |
| 13 | Điện Biên | 180 | 100 | 250 | 14 / 85 / 170 / 255 / 468 |
| 15 | Mộc Châu | 200 | 100 | 250 | 16 / 90 / 180 / 270 / 495 |
| 17 | Nha Trang | 220 | 150 | 375 | 18 / 108 / 220 / 333 / 614 |
| 19 | Phú Quốc | 240 | 150 | 375 | 20 / 120 / 240 / 360 / 660 |
| 21 | Ninh Bình | 260 | 150 | 375 | 22 / 128 / 255 / 383 / 701 |
| 22 | Hạ Long | 260 | 150 | 375 | 22 / 135 / 270 / 405 / 743 |
| 23 | Hà Nội | 280 | 150 | 375 | 24 / 143 / 285 / 428 / 784 |
| 26 | Vũng Tàu | 300 | 200 | 500 | 26 / 170 / 340 / 510 / 935 |
| 27 | HCM | 320 | 200 | 500 | 28 / 180 / 360 / 540 / 990 |
| 29 | Thanh Hóa | 360 | 200 | 500 | 36 / 195 / 390 / 585 / 1.060 |
| 31 | Đà Lạt | 400 | 200 | 500 | 50 / 200 / 400 / 600 / 1.100 |

## 3. Xúc xắc, di chuyển và Xuất Phát

- Server tự sinh kết quả của 2 xúc xắc. Người chơi đi theo tổng hai viên.
- Đổ đôi cho thêm lượt sau khi xử lý xong ô đến.
- Đổ đôi 3 lần liên tiếp trong cùng chuỗi lượt sẽ đưa người chơi thẳng vào Nhà Tù.
- Đi qua hoặc đi đúng một vòng tới Xuất Phát nhận **300K**, tăng số lần qua Xuất Phát và giảm bộ đếm Cúp Điện.
- Khi dừng đúng Xuất Phát, không nhận thêm khoản nào ngoài 300K vừa nhận khi hoàn thành vòng. Sau đó server chọn ngẫu nhiên 50/50:
  - cho tung thêm một lượt; hoặc
  - cho nâng cấp từ xa một đất đang sở hữu. Nếu không có đất đủ điều kiện hoặc không đủ tiền, lượt kết thúc.

## 4. Mua, xây và cướp đất

- Dừng trên đất/cảng vô chủ: nếu đủ tiền, người chơi có thể mua hoặc bỏ qua. Không đủ tiền thì tự bỏ qua.
- Khi mua đất, có thể mua kèm cấp nhà trong cùng giao dịch:
  - chưa qua Xuất Phát lần nào: tối đa nhà 2;
  - đã qua Xuất Phát ít nhất một lần: tối đa nhà 3.
- Không cần sở hữu trọn nhóm màu để xây.
- Khi dừng trên đất của mình, có thể nâng cấp nếu đủ tiền và còn cấp hợp lệ.
- Cấp 4 là khách sạn. Chỉ có thể lên khách sạn từ nhà 3 và sau khi đã qua Xuất Phát ít nhất một lần.
- Cảng không xây được.

### Cướp đất

Sau khi trả đủ tiền thuê, người chơi được đề nghị cướp ô vừa dừng nếu:

- đó là đất, không phải cảng;
- đất không có khách sạn;
- đất không có khiên;
- người cướp còn đủ tiền sau khi trả thuê.

Giá cướp bằng **2 × (giá đất + toàn bộ chi phí xây hiện có)** và được trả cho chủ cũ. Cấp nhà được giữ nguyên; Festival, khiên và trạng thái Cúp Điện trên ô đó bị xóa. Người cướp có thể nâng cấp ngay nếu đủ điều kiện.

## 5. Tiền thuê và các hệ số

- Đất dùng mức thuê theo cấp xây.
- Sở hữu trọn một nhóm màu nhân đôi tiền thuê của các đất trong nhóm.
- Điểm Du Lịch nhân đôi tiền thuê.
- Ô đang tổ chức Festival nhân đôi tiền thuê.
- Ba hệ số trên nhân chồng; một ô có đủ cả ba nhận **x8**.
- Ô đang bị Cúp Điện có tiền thuê bằng 0.
- Thẻ Giảm/Gấp đôi tiền thuê áp dụng lên lần tiếp theo chính người giữ thẻ phải trả, sau đó trở về hệ số bình thường.

Cảng tính tiền thuê theo tổng số cảng cùng chủ: 1 cảng = 25K, 2 = 50K, 3 = 100K, 4 = 200K. Điểm Du Lịch và Festival vẫn có thể nhân tiền thuê cảng.

## 6. Ô đặc biệt

### Thuế (ô 30)

Thuế bằng **10%**, làm tròn xuống, của:

`tiền mặt + giá mua của mọi tài sản + toàn bộ chi phí xây trên các tài sản đó`

### Sân Bay (ô 24)

- Dừng tại Sân Bay kết thúc lượt và hủy lượt thêm do đổ đôi.
- Ở lượt kế tiếp, người chơi có thể tung xúc xắc bình thường hoặc trả **50K** để bay.
- Điểm đến phải là đất/cảng vô chủ hoặc do chính người bay sở hữu.
- Nếu bay từ ô 24 tới ô có số nhỏ hơn 24, code hiện tính là qua Xuất Phát: nhận 300K, tăng số vòng và giảm bộ đếm Cúp Điện.
- Sau khi bay, hiệu ứng của ô đến được xử lý bình thường.

### Lễ Hội (ô 16)

- Nếu có ít nhất một đất/cảng và đủ 50K, người chơi có thể chọn một tài sản của mình để tổ chức hoặc bỏ qua.
- Festival nhân đôi tiền thuê của đúng một ô. Chỉ có một Festival hoạt động trên toàn bàn; chọn ô mới thay thế ô cũ.
- Festival bị xóa nếu ô đang đăng cai bị bán, cướp, tặng hoặc trở thành vô chủ.

### Nhà Tù (ô 8)

- Dừng tại ô Nhà Tù hoặc bị thẻ đưa tới đó đều vào tù 3 lượt và hủy chuỗi đổ đôi.
- Trước khi tung, có thể trả **200K** hoặc dùng thẻ Ra Tù Miễn Phí; sau đó vẫn được tung trong lượt hiện tại.
- Đổ đôi khi ở tù: ra tù và di chuyển theo kết quả, nhưng không nhận lượt thêm.
- Không đổ đôi: không di chuyển và giảm 1 lượt tù. Sau lần thất bại thứ ba, người chơi được thả nhưng lượt đó kết thúc.

## 7. Bộ 18 thẻ Cơ Hội

Bộ bài được xáo, mỗi thẻ được rút một lần; khi hết 18 thẻ, toàn bộ bộ bài được xáo lại.

1. **DISCOUNT_RENT:** lần trả thuê tiếp theo còn 50%.
2. **DOUBLE_RENT:** lần trả thuê tiếp theo gấp đôi.
3. **SHIELD:** đặt khiên lên một tài sản của mình. Khiên chặn cướp đất và chịu thay một lần tấn công; cản tấn công xong thì vỡ.
4. **FORCE_SELL:** chọn tài sản đối thủ không có khách sạn, kể cả cảng; chủ tài sản nhận 50% tổng vốn đã đầu tư và ô trở thành vô chủ.
5. **SABOTAGE:** chọn đất đối thủ không có khách sạn; giảm một cấp nhà, hoặc biến đất trống thành vô chủ.
6. **EARTHQUAKE:** biến một tài sản đối thủ không có khách sạn, kể cả cảng, thành vô chủ; chủ cũ không nhận tiền.
7. **BLACKOUT:** vô hiệu hóa tiền thuê của một tài sản đối thủ không có khách sạn, kể cả cảng, cho tới khi chủ ô đi qua Xuất Phát 3 lần.
8. **CHANCE_FESTIVAL:** miễn phí chọn một đất/cảng của mình làm Festival mới.
9. **GIVE_CITY:** tặng một tài sản bất kỳ của mình cho một người chơi chưa phá sản; cấp xây được giữ, còn Festival/khiên/Cúp Điện trên ô bị xóa.
10. **GOTO_AIRPORT:** tới Sân Bay, không nhận lương khi dịch chuyển.
11. **GOTO_START:** về Xuất Phát, nhận 300K rồi xử lý hiệu ứng dừng đúng Xuất Phát.
12. **GOTO_ACTIVE_FESTIVAL:** tới ô Festival đang hoạt động và xử lý ô đó; nếu chưa có Festival thì bỏ qua thẻ.
13. **GOTO_FESTIVAL_CORNER:** tới ô Lễ Hội và xử lý ô đó.
14. **GOTO_TAX:** tới ô Thuế và nộp thuế.
15. **GOTO_JAIL:** tới Nhà Tù và vào tù.
16. **BIRTHDAY:** mỗi đối thủ chưa phá sản trả tối đa 25K; người thiếu tiền phải tự thanh lý tài sản và có thể phá sản.
17. **PENALTY:** trả ngân hàng 50K.
18. **JAIL_CARD:** giữ một thẻ Ra Tù Miễn Phí; nếu đã có thẻ thì lá mới không có hiệu lực.

Mọi đòn tấn công hợp lệ nhắm vào ô có khiên sẽ chỉ phá khiên và không áp dụng hiệu ứng của thẻ.

## 8. Nợ, thanh lý và phá sản

- Khi thiếu tiền trả thuê, thuế hoặc tiền phạt, tiền mặt hiện có được dùng trước.
- Tài sản được bán cho ngân hàng bằng **50%**, làm tròn xuống, của giá mua cộng toàn bộ chi phí xây.
- Trong pha trả nợ, người chơi chọn từng tài sản để bán. Phần vượt quá khoản nợ được trả lại thành tiền mặt.
- Hết thời gian trả nợ, server tự bán từ tài sản có giá thanh lý thấp nhất cho tới khi trả đủ.
- Nếu tổng giá trị thanh lý nhỏ hơn phần còn thiếu, người chơi phá sản ngay. Tài sản trở thành vô chủ.
- Với nợ người chơi khác, tiền mặt và giá trị thanh lý thu được được chuyển cho chủ nợ trong giới hạn khoản nợ. Nợ ngân hàng không chuyển cho người chơi nào.

## 9. Điều kiện kết thúc

Ván kết thúc ngay khi xảy ra một trong các trường hợp:

1. Chỉ còn một người chưa phá sản.
2. Một người sở hữu đủ 4 cảng.
3. Một người sở hữu tất cả đất/cảng mua được trên một cạnh: 1–7, 9–15, 17–23 hoặc 25–31.
4. Một người sở hữu trọn ít nhất 3 nhóm màu.
5. Hết 1 giờ: người chưa phá sản có tổng tài sản lớn nhất thắng. Tổng tài sản ở đây dùng 100% giá mua và chi phí xây, không dùng giá thanh lý 50%.

Khi hết thời gian mà nhiều người bằng tài sản, code hiện chọn người được duyệt trước trong danh sách người chơi; không có bước phụ để phá hòa.

## 10. Hành vi khi hết giờ lượt

- Chờ tung: server tự tung.
- Mua/cướp/nâng cấp/Festival: tự bỏ qua.
- Chọn Sân Bay: kết thúc lượt, không bay.
- Trả nợ: tự bán tài sản rẻ nhất trước.
- Chọn mục tiêu Cơ Hội: server chọn ngẫu nhiên một mục tiêu hợp lệ.

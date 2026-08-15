# 🎲 Webopoly - Real-time Finance Board Game

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PixiJS](https://img.shields.io/badge/Pixi.js_v8-E72264?style=for-the-badge&logo=pixijs&logoColor=white)
![Colyseus](https://img.shields.io/badge/Colyseus-F6495C?style=for-the-badge&logo=socketdotio&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Trò chơi Cờ Tỷ Phú tài chính trực tuyến thời gian thực (Multiplayer 2.5D Isometric Board Game)** lấy cảm hứng từ các địa danh nổi tiếng của Việt Nam, xây dựng trên kiến trúc Client-Server hiện đại với khả năng đồng bộ trạng thái cực nhanh.

[Luật Chơi Chi Tiết](rule.md) • [Cài Đặt & Khởi Chạy](#-cài-đặt--khởi-chạy) • [Cấu Trúc Dự Án](#-cấu-trúc-dự-án) • [Công Nghệ](#-công-nghệ-sử-dụng)

</div>

---

## 🌟 Điểm Nổi Bật (Key Features)

- 🎮 **Chơi nhiều người thời gian thực (Real-time Multiplayer):**
  - Hỗ trợ phòng chơi từ **2 đến 8 người**.
  - Đồng bộ trạng thái game theo thời gian thực dựa trên kiến trúc Authoritative Server của **Colyseus**.
  - Cơ chế **Reconnection & AI Bot Takeover**: Tự động chuyển quyền điều khiển cho Bot thông minh khi người chơi mất kết nối quá 30 giây.

- 🗺️ **Bản đồ 32 ô đậm chất Việt Nam:**
  - 20 ô đất thuộc 8 nhóm màu trải dọc theo các tỉnh/thành phố Việt Nam (Cà Mau, Cần Thơ, Đà Nẵng, Huế, Hà Nội, TP.HCM, Đà Lạt...).
  - 4 Cảng biển chiến lược (Cảng Nam, Cảng Tây, Cảng Bắc, Cảng Đông).
  - Các ô chức năng đặc biệt: **Xuất Phát**, **Sân Bay** (bay đến ô mong muốn), **Lễ Hội** (nhân đôi tiền thuê), **Nhà Tù**, **Thuế**, **Cơ Hội**.

- 🏙️ **Chiến thuật Kinh tế & Bất động sản sâu sắc:**
  - Mua đất, xây dựng từ Cấp 1, 2, 3 đến **Khách Sạn**.
  - **Hệ số nhân tiền thuê cộng dồn**: Sở hữu trọn nhóm màu (x2) × Điểm du lịch (x2) × Lễ hội (x2) $\rightarrow$ Tiền thuê tối đa lên đến **x8**.
  - **Cơ chế Cướp đất (Land Stealing)**: Cơ hội lật kèo ngoạn mục bằng cách mua đứt tài sản của đối thủ với giá $2 \times$ tổng vốn đầu tư (áp dụng cho đất chưa có khách sạn hoặc khiên).

- 🃏 **18 Thẻ Cơ Hội phong phú & bất ngờ:**
  - Hiệu ứng đa dạng: Khiên phòng thủ (`SHIELD`), Động đất (`EARTHQUAKE`), Cúp điện (`BLACKOUT`), Phá hoại (`SABOTAGE`), Ép bán (`FORCE_SELL`), Sinh nhật đòi quà (`BIRTHDAY`), v.v.

- 🏆 **Nhiều điều kiện thắng linh hoạt:**
  1. **Độc tôn:** Tất cả đối thủ khác bị phá sản.
  2. **Thâu tóm Cảng biển:** Sở hữu đủ 4 Cảng.
  3. **Thâu tóm 1 Cạnh:** Sở hữu toàn bộ đất/cảng trên 1 cạnh bàn cờ.
  4. **Độc quyền 3 Nhóm màu:** Sở hữu trọn vẹn ít nhất 3 nhóm màu đất.
  5. **Đại gia sau 1 giờ:** Người có tổng tài sản lớn nhất khi hết thời gian ván đấu.

- 🎨 **Đồ họa Isometric 2.5D & Hiệu ứng sống động:**
  - Bàn cờ Canvas 2.5D được render bằng **Pixi.js v8** kết hợp animation mượt mà từ **GSAP**.
  - Hiệu ứng đổ xúc xắc 3D, camera tracking, HUD chỉ số và hệ thống Modal tương tác trực quan.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### **Frontend (`/client`)**

- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vite.dev/)
- **Canvas Engine:** [Pixi.js v8](https://pixijs.com/) (Isometric Game Board Renderer)
- **Animation:** [GSAP (GreenSock)](https://greensock.com/gsap/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Networking:** [colyseus.js](https://github.com/colyseus/colyseus.js)
- **Styling:** [TailwindCSS](https://tailwindcss.com/), PostCSS

### **Backend (`/server`)**

- **Runtime:** [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Game Server:** [Colyseus Framework](https://colyseus.io/) (`@colyseus/core`, `@colyseus/ws-transport`, `@colyseus/schema`)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Development Tool:** `ts-node-dev`
- **Validation:** [Zod](https://zod.dev/)

### **Monorepo Architecture**

- Quản lý dạng **npm workspaces** giúp cài đặt và chạy đồng thời cả Client và Server một cách tiện lợi.

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```text
Finance-board-game/
├── package.json               # Root monorepo configuration (npm workspaces)
├── rule.md                    # Quy tắc và cơ chế tính toán chi tiết của trò chơi
├── client/                    # Frontend React + Pixi.js App
│   ├── index.html             # Entry HTML file
│   ├── package.json           # Client dependencies & scripts
│   ├── vite.config.ts         # Cấu hình Vite & WebSocket Proxy sang Colyseus
│   ├── src/
│   │   ├── main.tsx           # Entry point của React
│   │   ├── App.tsx            # Main App Router / Screen switcher
│   │   ├── game/              # Hệ thống render bàn cờ Isometric
│   │   │   ├── IsoBoard.ts    # Pixi.js Board Canvas, Token animations, Tiles
│   │   │   ├── boardCoords.ts # Tính toán toạ độ Isometric 2.5D
│   │   │   ├── tileConstants.ts# Định nghĩa màu sắc, thông số visual các ô
│   │   │   └── tileImages.ts  # Quản lý assets hình ảnh
│   │   ├── net/               # Quản lý kết nối WebSocket
│   │   │   ├── colyseusClient.ts   # Wrapper Colyseus Client
│   │   │   ├── colyseusEndpoint.ts # Phân giải URL kết nối
│   │   │   └── reconnectSession.ts # Lưu session hỗ trợ reconnect
│   │   ├── store/             # Global state
│   │   │   └── gameStore.ts   # Zustand Store đồng bộ dữ liệu game
│   │   ├── ui/                # UI Components, Modals & HUD
│   │   │   ├── LobbyScreen.tsx     # Sảnh chờ, Tạo phòng & Vào phòng bằng mã
│   │   │   ├── WaitingRoom.tsx     # Phòng chờ trước khi Start game
│   │   │   ├── GameScreen.tsx      # Màn hình chính trong trận đấu
│   │   │   ├── GameHUD.tsx         # Bảng thông tin người chơi, tài sản, lượt
│   │   │   ├── DiceRoller.tsx      # Component xúc xắc 3D / hiệu ứng tung
│   │   │   ├── EventLog.tsx        # Lịch sử sự kiện trong ván
│   │   │   ├── BuyUpgradeModal.tsx # Modal mua đất / nâng cấp nhà
│   │   │   ├── PropertyModal.tsx   # Modal xem chi tiết và thanh lý tài sản
│   │   │   ├── ChanceModal.tsx     # Modal mở thẻ Cơ Hội
│   │   │   ├── AirportModal.tsx    # Modal chọn điểm bay ở Sân Bay
│   │   │   ├── FestivalModal.tsx   # Modal chọn địa điểm tổ chức Lễ Hội
│   │   │   ├── JailModal.tsx       # Modal lựa chọn khi ở trong Nhà Tù
│   │   │   ├── TaxModal.tsx        # Modal đóng thuế
│   │   │   └── WinnerModal.tsx     # Modal công bố người chiến thắng
│   │   └── utils/             # Format tiền tệ, helper functions
│   └── tests/                 # Unit tests cho client logic
│
└── server/                    # Backend Authoritative Game Server
    ├── package.json           # Server dependencies & scripts
    ├── tsconfig.json          # TypeScript config cho server
    └── src/
        ├── index.ts           # Khởi tạo Express, HTTP Server & Colyseus Server
        ├── config/
        │   └── mapData.ts     # Dữ liệu 32 ô cờ (giá đất, giá xây, tiền thuê)
        ├── rooms/
        │   ├── LobbyRoom.ts   # Quản lý số lượng client chờ
        │   └── WebopolyRoom.ts# Logic cốt lõi toàn bộ trận đấu (FSM, Turn, Cards...)
        └── schema/
            └── GameState.ts   # Colyseus Schema đồng bộ trạng thái (Player, Tile...)
```

---

## 🚀 Cài Đặt & Khởi Chạy (Getting Started)

### 1. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản `>= 20.19.0` hoặc `>= 22.12.0` (Do yêu cầu của Vite 8).
- **npm**: Phiên bản `>= 9.x` (đi kèm Node.js).

### 2. Cài Đặt Dependencies

Từ thư mục gốc của dự án, chạy lệnh:

```bash
npm install
```

_Lệnh này sẽ tự động cài đặt toàn bộ package cho cả thư mục gốc, `client` và `server`._

### 3. Khởi Chạy Môi Trường Development

Chỉ với **1 câu lệnh duy nhất** ở thư mục gốc để chạy đồng thời cả Server và Client:

```bash
npm run dev
```

Sau khi chạy:

- 🎲 **Game Server (Colyseus + Express):** Đang chạy tại `ws://localhost:2567` (HTTP: `http://localhost:2567`)
- 🌐 **Web Client (Vite + React):** Truy cập tại `http://localhost:5173`

_(Vite dev server đã được cấu hình sẵn proxy `/colyseus` trỏ về backend `http://127.0.0.1:2567`, không cần cấu hình thêm)._

---

## 📜 Các Lệnh Scripts Khác (Available Scripts)

| Lệnh                        | Thư mục             | Mô tả                                                   |
| --------------------------- | ------------------- | ------------------------------------------------------- |
| `npm run dev`               | Gốc                 | Chạy đồng thời cả Server và Client trong môi trường dev |
| `npm run dev:server`        | Gốc                 | Chỉ khởi chạy Server (reload tự động với `ts-node-dev`) |
| `npm run dev:client`        | Gốc                 | Chỉ khởi chạy Client với Vite HMR                       |
| `npm run build -w client`   | `client`            | Build source code TypeScript thành mã production        |
| `npm run build -w server`   | `server`            | Build source code TypeScript thành mã production        |
| `npm run test -w client`    | `client`            | Chạy bộ kiểm thử (Node Test Runner)                     |
| `npm run lint -w client`    | `client`            | Kiểm tra cú pháp và code style bằng Oxlint              |

---

## 📖 Tóm Tắt Luật Chơi & Cơ Chế Hoạt Động

| Nội dung            | Chi tiết                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Vốn khởi điểm**   | `2.000K` cho mỗi người chơi tại ô Xuất Phát (0).                                                                                         |
| **Lương qua vòng**  | `300K` khi đi qua hoặc dừng đúng ô Xuất Phát. Dừng đúng ô còn nhận thêm cơ hội đổ xúc xắc tiếp hoặc nâng cấp nhà từ xa.                  |
| **Cấp độ xây dựng** | Đất trống $\rightarrow$ Nhà cấp 1 $\rightarrow$ Nhà cấp 2 $\rightarrow$ Nhà cấp 3 $\rightarrow$ Khách Sạn.                               |
| **Đổ xúc xắc đôi**  | Được tung tiếp 1 lượt. Đổ đôi 3 lần liên tiếp bị đưa thẳng vào Nhà Tù.                                                                   |
| **Cướp đất**        | Trả $2 \times$ (Giá đất + Chi phí xây dựng hiện tại) cho chủ sở hữu cũ để lấy ô đất (áp dụng cho ô chưa có khách sạn và chưa bật khiên). |
| **Nhà tù**          | Bị giam tối đa 3 lượt. Có thể nộp phạt `200K`, dùng Thẻ Ra Tù hoặc tung ra số đôi để thoát.                                              |
| **Sân bay**         | Trả `50K` để bay trực tiếp đến bất kỳ ô đất/cảng vô chủ hoặc thuộc sở hữu của bản thân.                                                  |
| **Lễ hội**          | Trả `50K` để tổ chức Festival trên 1 tài sản, nhân đôi tiền thuê của ô đó.                                                               |

> 📌 **Xem đầy đủ chi tiết bảng giá đất, tiền thuê, quy tắc 18 thẻ cơ hội và điều kiện thắng tại:** [rule.md](rule.md)

---

## 🤝 Đóng Góp (Contributing)

1. Fork repository.
2. Tạo branch tính năng: `git checkout -b feature/AmazingFeature`.
3. Commit các thay đổi: `git commit -m 'feat: Add some AmazingFeature'`.
4. Push lên branch: `git push origin feature/AmazingFeature`.
5. Mở một Pull Request.

---

## 📄 Bản Quyền (License)

Dự án hiện chưa xác định giấy phép cụ thể (Private repository).

<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=LingoSwap+API" alt="LingoSwap Logo" width="120" />
  <h1>LingoSwap Backend API 🌍</h1>
  <p>
    <em>Hệ thống Backend mạnh mẽ, thời gian thực dành cho nền tảng trao đổi ngôn ngữ toàn cầu LingoSwap.</em>
  </p>

  <!-- Badges -->
  <p>
    <img alt="Version" src="https://img.shields.io/badge/version-1.1.0-blue.svg?cacheSeconds=2592000" />
    <img alt="Node Version" src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" />
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
    <img alt="Docker Support" src="https://img.shields.io/badge/Docker-supported-blue.svg" />
  </p>
</div>

---

## 📖 Giới Thiệu

**LingoSwap Backend** là lõi xử lý dữ liệu và logic nghiệp vụ cho ứng dụng LingoSwap. Hệ thống cung cấp API hiệu suất cao, xử lý kết nối thời gian thực bằng Socket.IO và WebRTC, hỗ trợ ghép cặp người dùng (Matchmaking) để học ngoại ngữ, đồng thời tích hợp hệ thống quản trị chuyên sâu.

Hệ thống được thiết kế theo kiến trúc **Modular Monolith**, đảm bảo tính đóng gói (Encapsulation), dễ bảo trì (Maintainability) và sẵn sàng chuyển đổi sang Microservices khi cần thiết.

## ✨ Tính Năng Nổi Bật

- 🔐 **Xác Thực Đa Luồng:** Đăng nhập truyền thống, Google/Facebook OAuth2, và OTP Email verification.
- ⚡ **Real-time Matchmaking:** Thuật toán ghép cặp nhanh dựa trên ngôn ngữ muốn học và quốc gia bằng Socket.IO & Redis.
- 📹 **WebRTC Signaling:** Quản lý luồng tín hiệu (Offer/Answer/ICE Candidate) cho Video/Audio Call P2P.
- 💬 **Hệ Thống Chat:** Nhắn tin thời gian thực, lưu trữ lịch sử hội thoại an toàn.
- 🛡️ **Hệ Thống Quản Trị (Admin Dashboard):** Quản lý người dùng, duyệt report, khóa/mở khóa tài khoản, phân tích thống kê trực quan.
- ⚖️ **Hệ Thống Kháng Cáo (Appeal System):** Cho phép người dùng bị khóa gửi đơn giải trình và được tự động unban qua email workflow.
- 📧 **Automated Emails:** Gửi email OTP, thông báo khóa tài khoản, duyệt kháng cáo bằng giao diện HTML chuyên nghiệp.
- 🛡️ **Production Ready:** Tích hợp hệ thống Log tập trung, Kiểm tra dữ liệu và Containerization (Docker).

---

## 🛠️ Công Nghệ Sử Dụng

- **Core:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Caching & Pub/Sub:** [Redis](https://redis.io/)
- **Real-time:** [Socket.IO](https://socket.io/), [WebRTC](https://webrtc.org/)
- **Containerization:** [Docker](https://www.docker.com/)
- **Authentication:** [JSON Web Token (JWT)](https://jwt.io/), [Passport.js](http://www.passportjs.org/), [Bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Mailing:** [Nodemailer](https://nodemailer.com/)
- **Documentation:** [Swagger UI](https://swagger.io/)

---

## 🚀 Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- Node.js `v18.x` trở lên
- MongoDB (Local hoặc MongoDB Atlas)
- Redis Server (Đang chạy ở port 6379)
- Docker (Tùy chọn)

### 2. Cài đặt trực tiếp

Clone repository và cài đặt các gói thư viện:

```bash
git clone https://github.com/HauiZ/lingoswap-backend.git
cd lingoswap-backend
npm install
```

Tạo file `.env` từ `.env.example` và điền đầy đủ thông tin cấu hình.

**Chạy Development:**
```bash
npm run dev
```

### 3. Khởi chạy bằng Docker (Khuyên dùng cho Production)

Hệ thống đã hỗ trợ Docker Compose để khởi chạy toàn bộ stack (App + MongoDB + Redis):

```bash
docker-compose up -d --build
```

---

## 📚 Tài Liệu API (API Documentation)

LingoSwap Backend cung cấp 2 phương thức để tra cứu API:

1. **Swagger UI (Interactive):** Khi server đang chạy, truy cập `http://localhost:5000/api-docs` để xem và test trực tiếp các endpoint.
2. **Markdown Doc:** Tham khảo file [`api-doc.md`](./api-doc.md) để đọc tài liệu đặc tả chi tiết về Request/Response payload.

---

## 📂 Cấu Trúc Mã Nguồn (Modular Monolith)

```text
lingoswap-backend/
├── public/                 # File tĩnh và Email Templates
├── src/
│   ├── core/               # Các thành phần cốt lõi và dùng chung
│   │   ├── config/         # Cấu hình Database, Redis, Môi trường
│   │   ├── middlewares/    # Middleware chung (Auth, Error, Validate)
│   │   └── utils/          # Tiện ích chung (Logger, Email, Cloudinary)
│   ├── modules/            # Chứa các Module nghiệp vụ (Domain-driven)
│   │   ├── auth/           # Xác thực, Đăng ký, OTP
│   │   ├── users/          # Quản lý Profile, Kháng cáo
│   │   ├── match/          # Ghép cặp, Matchmaking Logic
│   │   ├── chat/           # Hội thoại, Tin nhắn
│   │   ├── friends/        # Quản lý bạn bè
│   │   ├── admin/          # Quản lý hệ thống, Dashboard
│   │   ├── notifications/  # Thông báo đẩy
│   │   ├── reports/        # Báo cáo vi phạm
│   │   └── presence/       # Trạng thái Online/Offline
│   └── app.js              # Khởi tạo Express App
├── Dockerfile              # Cấu hình Docker Image (Multi-stage build)
├── docker-compose.yml      # Orchestration cho stack dịch vụ
├── package.json            # Dependencies & Scripts
└── server.js               # Entry point khởi động hệ thống
```

---

## 🛡️ Quy Ước Phát Triển (Guidelines)

### 1. Luồng Dữ Liệu (Data Flow)
Mọi luồng API mới phải tuân thủ nghiêm ngặt mô hình 3 lớp:
`Route` ➔ `Middleware (Xác thực)` ➔ `Controller (Nhận Request)` ➔ `Service (Xử lý Logic/DB)` ➔ `Controller (Trả Response)`

### 2. Xử Lý Lỗi (Error Handling)
Luôn sử dụng `ApiError` class được định nghĩa trong `src/core/utils/ApiError.js` để ném lỗi trong Service. Tránh việc `try-catch` và trả về `res.status` trực tiếp trong Service.

```javascript
import ApiError from '../core/utils/ApiError.js';

// Trong Service
if (!user) throw new ApiError(404, 'Tài khoản không tồn tại');
```

### 3. Git Workflow
- Nhánh chính: `main` (Production)
- Nhánh phát triển: `develop` hoặc các nhánh tính năng (ví dụ: `socials`).
- Phải tạo Pull Request và review trước khi merge.

---

<div align="center">
  <p>Cảm ơn bạn đã đóng góp cho sự phát triển của LingoSwap! 🚀</p>
  <p>Bản quyền © 2026 <strong>Đội ngũ LingoSwap</strong></p>
</div>

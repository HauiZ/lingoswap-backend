<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=LingoSwap+API" alt="LingoSwap Logo" width="120" />
  <h1>LingoSwap Backend API 🌍</h1>
  <p>
    <em>Hệ thống Backend mạnh mẽ, thời gian thực dành cho nền tảng trao đổi ngôn ngữ toàn cầu LingoSwap.</em>
  </p>

  <!-- Badges -->
  <p>
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
    <img alt="Node Version" src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" />
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </p>
</div>

---

## 📖 Giới Thiệu

**LingoSwap Backend** là lõi xử lý dữ liệu và logic nghiệp vụ cho ứng dụng LingoSwap. Hệ thống cung cấp API hiệu suất cao, xử lý kết nối thời gian thực bằng Socket.IO và WebRTC, hỗ trợ ghép cặp người dùng (Matchmaking) để học ngoại ngữ, đồng thời tích hợp hệ thống quản trị chuyên sâu.

Hệ thống được thiết kế theo kiến trúc **Controller-Service-Repository**, đảm bảo tính mở rộng (Scalability), dễ bảo trì (Maintainability) và hiệu năng (Performance).

## ✨ Tính Năng Nổi Bật

- 🔐 **Xác Thực Đa Luồng:** Đăng nhập truyền thống, Google/Facebook OAuth2, và OTP Email verification.
- ⚡ **Real-time Matchmaking:** Thuật toán ghép cặp nhanh dựa trên ngôn ngữ muốn học và quốc gia bằng Socket.IO & Redis.
- 📹 **WebRTC Signaling:** Quản lý luồng tín hiệu (Offer/Answer/ICE Candidate) cho Video/Audio Call P2P.
- 💬 **Hệ Thống Chat:** Nhắn tin thời gian thực, lưu trữ lịch sử hội thoại an toàn.
- 🛡️ **Hệ Thống Quản Trị (Admin Dashboard):** Quản lý người dùng, duyệt report, khóa/mở khóa tài khoản, phân tích thống kê trực quan.
- ⚖️ **Hệ Thống Kháng Cáo (Appeal System):** Cho phép người dùng bị khóa gửi đơn giải trình và được tự động unban qua email workflow.
- 📧 **Automated Emails:** Gửi email OTP, thông báo khóa tài khoản, duyệt kháng cáo bằng giao diện HTML chuyên nghiệp.

---

## 🛠️ Công Nghệ Sử Dụng

- **Core:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Caching & Pub/Sub:** [Redis](https://redis.io/)
- **Real-time:** [Socket.IO](https://socket.io/), [WebRTC](https://webrtc.org/)
- **Authentication:** [JSON Web Token (JWT)](https://jwt.io/), [Passport.js](http://www.passportjs.org/), [Bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Mailing:** [Nodemailer](https://nodemailer.com/)
- **Documentation:** [Swagger UI](https://swagger.io/)

---

## 🚀 Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- Node.js `v18.x` trở lên
- MongoDB (Local hoặc MongoDB Atlas)
- Redis Server (Đang chạy ở port 6379)
- NPM hoặc Yarn

### 2. Cài đặt

Clone repository và cài đặt các gói thư viện:

```bash
git clone https://github.com/HauiZ/lingoswap-backend.git
cd lingoswap-backend
npm install
```

### 3. Biến môi trường (.env)

Tạo file `.env` tại thư mục gốc và cấu hình các biến số sau:

| Biến | Ý nghĩa | Ví dụ |
|------|---------|-------|
| `PORT` | Port chạy server | `5000` |
| `NODE_ENV` | Môi trường | `development` / `production` |
| `DB_URI` | MongoDB Connection String | `mongodb://localhost:27017/lingoswap` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `JWT_SECRET` | Khóa bí mật ký JWT | `your_super_secret_key` |
| `FRONTEND_URL` | Domain của ứng dụng Client | `http://localhost:3000` |
| `EMAIL_USER` | Email gửi SMTP | `no-reply@lingoswap.com` |
| `EMAIL_PASS` | Mật khẩu ứng dụng Email | `xxxx xxxx xxxx xxxx` |

### 4. Khởi chạy Server

**Môi trường Development (Tự động reload code):**
```bash
npm run dev
```

**Môi trường Production:**
```bash
npm start
```
> Server sẽ lắng nghe tại: `http://localhost:5000`

---

## 📚 Tài Liệu API (API Documentation)

LingoSwap Backend cung cấp 2 phương thức để tra cứu API:

1. **Swagger UI (Interactive):** Khi server đang chạy, truy cập `http://localhost:5000/api-docs` để xem và test trực tiếp các endpoint.
2. **Markdown Doc:** Tham khảo file [`api-doc.md`](./api-doc.md) để đọc tài liệu đặc tả chi tiết về Request/Response payload.

---

## 📂 Cấu Trúc Mã Nguồn

```text
lingoswap-backend/
├── public/                 # Chứa giao diện Email Template (HTML) và file tĩnh
├── src/
│   ├── config/             # Cấu hình Database, Redis, Môi trường
│   ├── controllers/        # Điều hướng HTTP Request và Response (REST)
│   ├── middlewares/        # Lớp trung gian: Auth, Upload, Error Handler
│   ├── models/             # Schema & Model tương tác MongoDB
│   ├── routes/             # Khai báo các Endpoints (Router)
│   ├── services/           # Chứa Business Logic (Core của hệ thống)
│   ├── sockets/            # Logic xử lý WebSocket (Match, Chat, WebRTC)
│   ├── utils/              # Các hàm tiện ích (Email sender, Validators)
│   └── app.js              # Khởi tạo Express App
├── .env.example            # Template cấu hình môi trường
├── api-doc.md              # Đặc tả API dạng Markdown
├── package.json            # Thông tin dependencies
└── server.js               # Entry point khởi động hệ thống
```

---

## 🛡️ Quy Ước Phát Triển (Guidelines)

### 1. Luồng Dữ Liệu (Data Flow)
Mọi luồng API mới phải tuân thủ nghiêm ngặt mô hình 3 lớp:
`Route` ➔ `Middleware (Xác thực)` ➔ `Controller (Nhận Request)` ➔ `Service (Xử lý Logic/DB)` ➔ `Controller (Trả Response)`

### 2. Xử Lý Lỗi (Error Handling)
Luôn sử dụng `ApiError` class được định nghĩa trong `src/utils/ApiError.js` để ném lỗi trong Service. Tránh việc `try-catch` và trả về `res.status` trực tiếp trong Service.

```javascript
import ApiError from '../utils/ApiError.js';

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

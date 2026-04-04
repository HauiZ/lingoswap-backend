# LingoSwap Backend

Nền tảng trao đổi ngôn ngữ trực tuyến - Backend API

## 📁 Cấu trúc thư mục

```text
lingoswap_backend/
├── src/
│   ├── app.js                 # Cấu hình Express app
│   ├── config/                # Cấu hình (database, env...)
│   ├── controllers/           # Xử lý logic nghiệp vụ
│   ├── helper/                # Các helper function (VD: token, hash)
│   ├── middlewares/           # Middleware (auth, error handler, upload...)
│   ├── models/                # Schema Mongoose
│   ├── routes/                # Định nghĩa endpoints (auth, users, ...)
│   ├── sockets/               # WebSocket handler (match, chat...)
│   ├── utils/                 # Tiện ích bổ sung
│   └── workers/               # Tiến trình chạy ngầm (background jobs)
├── public/                    # File tĩnh (HTML, CSS, JS, ảnh upload)
├── views/                     # Template (EJS, Pug...)
├── tests/                     # Unit & Integration tests
├── server.js                  # Điểm khởi động ứng dụng
├── .env                       # Biến môi trường (KHÔNG commit)
├── .gitignore                 # File git ignore
├── package.json               # Dependencies
├── api-doc.md                 # Tài liệu API (Chi tiết các endpoint)
├── func_ui@ux.md              # Đặc tả tính năng và UI/UX
└── README.md                  # Tài liệu hệ thống tổng quan
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js >= 14.x
- MongoDB
- npm hoặc yarn

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Cấu hình biến môi trường

Tạo file `.env` từ file mẫu và điền thông tin:

```bash
PORT=5000
NODE_ENV=development
DB_URI=mongodb://localhost:27017/lingoswap
JWT_SECRET=your-secret-key
```

### Bước 3: Chạy server

**Development (với hot reload sử dụng nodemon):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Endpoints

Toàn bộ thông tin chi tiết về các API, bao gồm payload, params và response đều được tài liệu hóa cụ thể trong file [`api-doc.md`](./api-doc.md).

**Các nhóm API có sẵn:**
- **Auth (`/api/auth`)**: Đăng ký, đăng nhập (Local, Google, FB), đổi/quên mật khẩu, lấy lại Token.
- **Users (`/api/users`)**: Cập nhật hồ sơ, avatar, và xem hồ sơ public.
- **Admin (`/api/admin`)**: Khóa, xóa tài khoản, lấy danh sách hệ thống (yêu cầu quyền admin).
- **Conversations (`/api/user/conversations`)**: Lấy danh sách đoạn hội thoại và tin nhắn.
- **Friends (`/api/user/friends`)**: Gửi yêu cầu kết bạn, xem và phản hồi lời mời.

*(Ứng dụng cũng tích hợp **Swagger UI**, có thể truy cập tại `http://localhost:5000/api-docs` khi chạy ở máy local)*

## 🔐 Xác thực

API sử dụng JWT (JSON Web Token) cho các endpoint cần bảo vệ.

**Header:**
```
Authorization: Bearer <token>
```

## 🧪 Chạy Tests

```bash
npm test
```

## 📝 Ghi chú phát triển

### Thêm dependencies mới

```bash
npm install <package-name>
```

### Quy ước Code

- Sử dụng ES6+
- Naming conventions: camelCase cho biến/hàm, PascalCase cho class
- Thêm comments cho logic phức tạp
- Error handling đầy đủ

### Middleware

Thứ tự middleware trong `src/app.js` rất quan trọng:
1. Body parser middleware
2. Static files
3. View engine
4. Routes
5. 404 handler
6. Error handler

## 🤝 Đóng góp

Hãy follow các quy tắc code trên khi đóng góp.

## 📄 License

ISC

---

**Made with ❤️ for language exchange enthusiasts**

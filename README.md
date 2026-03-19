# LingoSwap Backend

Nền tảng trao đổi ngôn ngữ trực tuyến - Backend API

## 📁 Cấu trúc thư mục

```
lingoswap_backend/
├── src/
│   ├── app.js                 # Cấu hình Express app
│   ├── controllers/           # Xử lý logic nghiệp vụ
│   ├── models/                # Schema Mongoose
│   ├── routes/                # Định nghĩa endpoints
│   ├── middlewares/           # Middleware (auth, error handler...)
│   ├── config/                # Cấu hình (database, env...)
│   └── utils/                 # Tiện ích, helpers
├── public/                    # File tĩnh (HTML, CSS, JS)
├── views/                     # Template (EJS, Pug...)
├── tests/                     # Unit & Integration tests
├── server.js                  # Điểm khởi động ứng dụng
├── .env                       # Biến môi trường (KHÔNG commit)
├── .gitignore                 # File git ignore
├── package.json               # Dependencies
└── README.md                  # Tài liệu

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

### Users
- `GET /api/users` - Lấy tất cả users
- `GET /api/users/:id` - Lấy user theo ID
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user (cần auth)
- `DELETE /api/users/:id` - Xóa user (cần auth)

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

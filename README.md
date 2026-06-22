# LingoSwap Backend — Microservices Architecture

> **Nền tảng trao đổi ngôn ngữ trực tuyến** | Node.js · Express · MongoDB · Redis · Socket.io

---

## Kiến trúc tổng quan

LingoSwap Backend được tổ chức theo kiến trúc **Microservices** với 10 service độc lập giao tiếp qua **REST API nội bộ** và **Redis Pub/Sub (EventBus)**.

```
📱 Mobile App / 🌐 Web Admin
          │
          ▼
┌─────────────────────────┐
│     API Gateway :5000   │  ← Điểm vào duy nhất (REST + Socket.io)
└──────────┬──────────────┘
           │ proxy
     ┌─────┼──────────────────────────────────┐
     ▼     ▼     ▼     ▼     ▼     ▼     ▼    ▼
 Auth  User  Chat  Match Friend Notif  Rep  Admin
 5001  5002  5003  5004  5005  5006  5008  5009
                                    Presence:5007
     │
     └──────────── Redis Pub/Sub ──────────────┘
```

---

## Service Map

| Service | Port | Database | Chức năng |
|---------|------|----------|-----------|
| **api-gateway** | 5000 | — | Proxy REST + Socket.io Hub |
| **auth-service** | 5001 | `lingoswap_auth` | Đăng ký, đăng nhập, JWT, OAuth, OTP |
| **user-service** | 5002 | `lingoswap_users` | Profile, avatar, stats, appeals |
| **chat-service** | 5003 | `lingoswap_chat` | Conversations, messages, ảnh |
| **match-service** | 5004 | `lingoswap_match` | Queue ghép đôi, WebRTC sessions |
| **friend-service** | 5005 | `lingoswap_friends` | Kết bạn, chặn, block |
| **notification-service** | 5006 | `lingoswap_notifications` | Push realtime notifications |
| **presence-service** | 5007 | RAM + Redis | Online/offline tracking |
| **report-service** | 5008 | `lingoswap_reports` | Báo cáo vi phạm |
| **admin-service** | 5009 | `lingoswap_admin` | Admin BFF, dashboard, từ khóa đen |

---

## Cấu trúc thư mục

```
lingoswap-backend/
├── packages/
│   └── shared/                   # Shared utilities (EventBus, ApiError, logger...)
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── chat-service/
│   ├── match-service/
│   ├── friend-service/
│   ├── notification-service/
│   ├── presence-service/
│   ├── report-service/
│   └── admin-service/
├── scripts/
│   ├── seed.js                   # Tạo dữ liệu mẫu (monolith DB)
│   ├── migrate-to-microservices.js  # Migrate dữ liệu sang từng service DB
│   └── check-all-services.js    # Kiểm tra toàn bộ service khởi động OK
├── _archive_monolith_src/        # Monolith cũ (lưu trữ, không dùng)
├── docker-compose.yml            # Local development
├── render.yaml                   # Render.com deployment blueprint
└── package.json                  # npm workspaces root
```

---

## Chạy local (Development)

### Yêu cầu
- Node.js >= 18
- MongoDB (local hoặc Atlas)
- Redis (local hoặc Upstash)

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` ở root (mẫu đã có trong `.env`). Các service đọc biến từ đây khi chạy local.

### 3. Tạo dữ liệu mẫu (lần đầu)

```bash
# Seed dữ liệu vào database monolith (lingoswap)
npm run db:seed

# Migrate dữ liệu sang từng database microservice
node scripts/migrate-to-microservices.js
```

### 4. Chạy từng service riêng lẻ

```bash
# Ví dụ chạy auth-service
PORT=5001 DB_URI=mongodb://localhost:27017/lingoswap_auth node services/auth-service/server.js

# Ví dụ chạy user-service
PORT=5002 DB_URI=mongodb://localhost:27017/lingoswap_users node services/user-service/server.js

# Ví dụ chạy api-gateway
PORT=5000 node services/api-gateway/server.js
```

> **Lưu ý:** Presence Service không cần `DB_URI` (chỉ dùng Redis + RAM).

### 5. Kiểm tra toàn bộ service khởi động

```bash
node scripts/check-all-services.js
```

---

## Chạy bằng Docker Compose (local)

### Yêu cầu
- Docker Desktop

### Chạy

```bash
# Build và khởi động toàn bộ stack (MongoDB + Redis + 10 services)
docker-compose up --build

# Chạy nền
docker-compose up -d --build

# Xem logs của service cụ thể
docker-compose logs -f auth-service

# Dừng
docker-compose down
```

Sau khi khởi động, API Gateway sẽ chạy tại: **http://localhost:5000**

---

## Deploy lên Render.com

### Bước 1 — Chuẩn bị MongoDB Atlas

1. Tạo cluster miễn phí tại [cloud.mongodb.com](https://cloud.mongodb.com)
2. Tạo **9 database** riêng biệt (hoặc dùng chung cluster, khác database name):
   - `lingoswap_auth`, `lingoswap_users`, `lingoswap_chat`, `lingoswap_match`
   - `lingoswap_friends`, `lingoswap_notifications`, `lingoswap_reports`, `lingoswap_admin`
3. Lấy **connection string** dạng: `mongodb+srv://user:pass@cluster.mongodb.net`

### Bước 2 — Chuẩn bị Redis (Upstash)

1. Đăng ký tại [upstash.com](https://upstash.com) → tạo Redis database (free tier)
2. Lấy **Redis URI** dạng: `rediss://default:xxx@yyy.upstash.io:6379`

### Bước 3 — Deploy qua Render Blueprint

1. Push code lên GitHub
2. Vào [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
3. Chọn repository → Render tự detect file `render.yaml`
4. Điền các **Secret Environment Variables** cho từng service (xem bảng bên dưới)

### Biến môi trường cần điền thủ công

> Các biến đánh dấu `sync: false` trong `render.yaml` bạn phải điền thủ công.

#### Tất cả services cần chung:
| Biến | Mô tả |
|------|-------|
| `JWT_SECRET` | JWT access token secret (tự sinh, ví dụ: `openssl rand -hex 32`) |

#### Auth Service & Admin Service:
| Biến | Mô tả |
|------|-------|
| `DB_URI` | MongoDB Atlas connection string (database `lingoswap_auth`) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `OAUTH_CLIENT_ID` | Google OAuth Client ID |
| `OAUTH_CLIENT_SECRET` | Google OAuth Client Secret |
| `OAUTH_REFRESH_TOKEN` | Google OAuth Refresh Token (để gửi email) |
| `MY_EMAIL_ACCOUNT` | Gmail account dùng để gửi email (vd: lingoswap@gmail.com) |
| `FRONTEND_URL` | URL của frontend app (vd: https://lingoswap.vercel.app) |

#### User Service:
| Biến | Mô tả |
|------|-------|
| `DB_URI` | MongoDB Atlas (database `lingoswap_users`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

#### Chat Service:
| Biến | Mô tả |
|------|-------|
| `DB_URI` | MongoDB Atlas (database `lingoswap_chat`) |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Cloudinary (cho ảnh chat) |

#### Match / Friend / Notification / Presence / Report Services:
| Biến | Mô tả |
|------|-------|
| `DB_URI` | MongoDB Atlas (database riêng của service) |

> **Presence Service**: Không cần `DB_URI`.

### Bước 4 — Migrate dữ liệu lên production (tùy chọn)

Nếu bạn có dữ liệu cần migrate từ MongoDB local lên Atlas:

```bash
# Chỉnh MONGO_URI trỏ sang Atlas connection string
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net" node scripts/migrate-to-microservices.js
```

---

## Giao tiếp giữa các Services

### REST API nội bộ (synchronous)

Các service gọi nhau qua HTTP với header `X-Internal-Service: true`.

Ví dụ: Match Service → User Service để cập nhật stats:
```
PATCH http://user-service:5002/internal/users/:id/stats
```

### EventBus — Redis Pub/Sub (asynchronous)

Tất cả events publish qua channel `lingoswap:events`.

| Event | Publisher | Subscriber(s) |
|-------|-----------|---------------|
| `user.created` | Auth Service | User Service |
| `match.ended` | Match Service | User Service |
| `notification.push` | Friend/Report/Match Services | Notification Service |
| `presence.user.online/offline` | Presence Service | User Service |
| `socket.emit` | Tất cả services | API Gateway |

---

## Scripts tiện ích

```bash
# Chạy test monolith (regression)
npm test

# Seed dữ liệu mẫu
npm run db:seed

# Migrate dữ liệu sang microservice DBs
node scripts/migrate-to-microservices.js

# Kiểm tra toàn bộ services khởi động không lỗi
node scripts/check-all-services.js
```

---

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| **Node.js 18+** | Runtime |
| **Express 4** | HTTP framework |
| **MongoDB / Mongoose** | Database |
| **Redis (ioredis)** | EventBus Pub/Sub + Cache |
| **Socket.io 4** | Real-time (tại Gateway) |
| **JWT** | Authentication (stateless) |
| **Cloudinary** | Image storage |
| **Google OAuth2** | Social login + Email |
| **http-proxy-middleware** | Gateway reverse proxy |
| **Docker / Docker Compose** | Containerization |
| **Render.com** | Cloud deployment |

# Tài liệu API LingoSwap Backend

Dưới đây là chi tiết toàn bộ các API hiện tại của hệ thống. 
API có tag `🔒 Yêu cầu Token` cần gửi kèm Header: `Authorization: Bearer <accessToken>`.

---

## 1. Authentication APIs (`/api/auth`)
Các API liên quan đến xác thực, đăng nhập và quản lý tài khoản.

### 1.1 Đăng ký người dùng
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "fullName": "Nguyen Van A",
    "country": "vi",
  }
  ```
- **Responses:**
  - `201 Created`: Trả về JWT Token và thông tin cơ bản. RefreshToken được set vào Cookie.
    ```json
    {
      "id": "60d0fe4f5311236168a109ca",
      "email": "user@example.com",
      "profile": { "fullName": "Nguyen Van A", "language": "vi", "proficiencyLevel": "Beginner" },
      "role": "user",
      "token": "eyJhb..."
    }
    ```
  - `400 Bad Request`: `{ "error": "Email đã được sử dụng" }` hoặc lỗi validate dữ liệu.

### 1.2 Đăng nhập bằng Mật khẩu
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Responses:**
  - `200 OK`: Trả về JWT Token và thông tin user (giống Đăng ký). Set `refreshToken` vào Cookie.
  - `401 Unauthorized`: `{ "error": "Email hoặc mật khẩu không chính xác" }`
  - `403 Forbidden`: `{ "error": "Tài khoản đã bị khóa" }`

### 1.3 Đăng nhập bằng Google
- **Method:** `POST`
- **Endpoint:** `/api/auth/google`
- **Request Body (JSON):**
  ```json
  {
    "idToken": "google_id_token_here"
  }
  ```
- **Responses:**
  - `200 OK`: Trả về JWT Token và thông tin user (giống Đăng ký). Set `refreshToken` vào Cookie.

### 1.4 Đăng nhập bằng Facebook
- **Method:** `POST`
- **Endpoint:** `/api/auth/facebook`
- **Request Body (JSON):**
  ```json
  {
    "accessToken": "facebook_access_token_here"
  }
  ```
- **Responses:**
  - `200 OK`: Trả về JWT Token và thông tin user. (Tương tự Google/Basic Auth).

### 1.5 Làm mới Token
- **Method:** `POST`
- **Endpoint:** `/api/auth/token`
- **Request Header/Cookies:** Gửi kèm cookie `refreshToken` đã được set ở bước Đăng nhập.
- **Responses:**
  - `200 OK`: 
    ```json
    {
      "token": "new.jwt.access.token"
    }
    ```
  - `401/403 Unauthorized`: `{ "error": "Không tìm thấy refresh token, vui lòng đăng nhập lại" }`

### 1.6 Đăng xuất
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Mô tả:** Xóa `refreshToken` cookie khỏi trình duyệt.
- **Responses:**
  - `200 OK`: `{ "message": "Đăng xuất thành công" }`

### 1.7 Thay đổi mật khẩu `🔒 Yêu cầu Token`
- **Method:** `PATCH`
- **Endpoint:** `/api/auth/password/change`
- **Request Body (JSON):**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Đổi mật khẩu thành công" }`
  - `400 Bad Request`: `{ "error": "Mật khẩu hiện tại không chính xác" }`

### 1.8 Yêu cầu quên mật khẩu (Gửi OTP)
- **Method:** `POST`
- **Endpoint:** `/api/auth/password/forgot`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Email đã được gửi" }`
  - `404 Not Found`: `{ "error": "Không tìm thấy người dùng có email này" }`

### 1.9 Đặt lại mật khẩu (Dùng OTP)
- **Method:** `POST`
- **Endpoint:** `/api/auth/password/reset`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Đặt lại mật khẩu thành công" }`
  - `400 Bad Request`: `{ "error": "Mã OTP không hợp lệ hoặc đã hết hạn" }`

---

## 2. User & Profile APIs (`/api/users`)
Quản lý thông tin hồ sơ người dùng.

### 2.1 Lấy thông tin cá nhân `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/users/me`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "_id": "user_id_string",
      "email": "user@example.com",
      "profile": { "fullName": "Nguyen Van A", "bio": "", "avatar": "..." },
      "settings": { "theme": "light", "uiLanguage": "vi" },
      "role": "user",
      "statusAccount": "active"
    }
    ```

### 2.2 Lấy thông tin Public Profile 
- **Method:** `GET`
- **Endpoint:** `/api/users/{id}`
- **Path Parameters:** `id` = ID của người dùng.
- **Responses:**
  - `200 OK`: Trả về dữ liệu profile (không bao gồm password, settings, `__v`, status).
    ```json
    {
      "_id": "user_id",
      "email": "user@example.com",
      "profile": { "fullName": "Nguyen Van A", "avatar": "..." },
      "role": "user"
    }
    ```
  - `404 Not Found`: `{ "error": "Người dùng không tồn tại" }`

### 2.3 Cập nhật hồ sơ cá nhân `🔒 Yêu cầu Token`
- **Method:** `PUT`
- **Endpoint:** `/api/users/me`
- **Request Body (JSON):**
  ```json
  {
    "profile": {
      "fullName": "Name Changed",
      "bio": "New bio text"
    },
    "settings": {
      "theme": "dark"
    }
  }
  ```
- **Responses:**
  - `200 OK`: 
    ```json
    {
      "message": "Cập nhật hồ sơ thành công",
      "user": { 
        "_id": "...", 
        "profile": { "fullName": "Name Changed", "bio": "New bio text" },
        "settings": { "theme": "dark" }
      }
    }
    ```

### 2.4 Cập nhật Avatar `🔒 Yêu cầu Token`
- **Method:** `POST`
- **Endpoint:** `/api/users/avatar`
- **Request Body:** Form-Data (`multipart/form-data`) - Chứa field `avatar` đính kèm file ảnh.
- **Responses:**
  - `200 OK`: 
    ```json
    {
       "message": "Cập nhật avatar thành công",
       "avatarUrl": "https://cloudinary..."
    }
    ```

---

## 3. Admin APIs (`/api/admin`)
Dành riêng cho quản trị viên, yêu cầu `🔒 Admin Token`.

### 3.1 Lấy danh sách Users
- **Method:** `GET`
- **Endpoint:** `/api/admin/users`
- **Responses:**
  - `200 OK`: 
    ```json
    [
      {
        "_id": "...",
        "email": "user@example.com",
        "profile": { "fullName": "..." },
        "settings": { "theme": "light" },
        "statusAccount": "active",
        "role": "user",
        "createdAt": "..."
      }
    ]
    ```

### 3.2 Khóa (Ban) tài khoản người dùng
- **Method:** `PUT`
- **Endpoint:** `/api/admin/users/{id}/ban`
- **Path Parameters:** `id` = ID của người dùng.
- **Responses:**
  - `200 OK`: 
    ```json
    {
      "message": "Đã khóa tài khoản người dùng do vi phạm",
      "user": { 
        "_id": "...",
        "email": "user@example.com",
        "statusAccount": "banned"
      }
    }
    ```

### 3.3 Xóa tài khoản vĩnh viễn
- **Method:** `DELETE`
- **Endpoint:** `/api/admin/users/{id}`
- **Path Parameters:** `id` = ID của người dùng.
- **Responses:**
  - `200 OK`: `{ "message": "Đã xóa user có ID: {id} vĩnh viễn" }`

### 3.4 Lấy thống kê Dashboard
- **Method:** `GET`
- **Endpoint:** `/api/admin/dashboard`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "users": { "total": 100, "active": 90, "banned": 10, "online": 5, "newToday": 2, "newThisWeek": 15, "newThisMonth": 40 },
      "matchSessions": { "total": 200, "today": 10, "thisWeek": 50, "avgDurationSeconds": 120, "totalDurationSeconds": 24000 },
      "messages": { "total": 5000, "today": 100, "thisWeek": 700 },
      "reports": { "total": 20, "pending": 5, "resolved": 15, "today": 1 },
      "friendships": { "total": 30 },
      "charts": { "newUsersLast7Days": [...], "sessionsLast7Days": [...] }
    }
    ```

---

## 4. Conversation APIs (`/api/user/conversations`)
Quản lý lịch sử và tin nhắn trong ứng dụng.

### 4.1 Lấy tất cả các cuộc trò chuyện `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/conversations/all`
- **Responses:**
  - `200 OK`:
    ```json
    [
      {
        "_id": "conversation_id",
        "partner": {
           "_id": "partner_id",
           "email": "partner@example.com",
           "profile": { "fullName": "...", "avatar": "..." },
           "status": "online",
           "lastSeen": { "full": "10/05/2023 10:30", "friendly": "Vài giây trước" }
        },
        "lastMessage": {
           "content": "Hello",
           "time": { "full": "10/05/2023 10:30", "friendly": "10 phút trước" }
        },
        "updatedAt": { "full": "...", "friendly": "..." }
      }
    ]
    ```

### 4.2 Lấy tin nhắn trong một cuộc trò chuyện `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/conversations/{conversationId}`
- **Query Parameters (Tuỳ chọn):** `?limit=20&page=1`
- **Path Parameters:** `conversationId` = ID của cuộc trò chuyện cần lấy.
- **Responses:**
  - `200 OK`:
    ```json
    [
      {
        "_id": "message_id",
        "conversationId": "conv_id",
        "senderId": "sender_id",
        "content": "Noi dung tin nhan",
        "type": "text",
        "createdAt": {
           "full": "10/05/2023 10:30",
           "friendly": "1 phút trước"
        }
      }
    ]
    ```

### 4.3 Upload ảnh chat `🔒 Yêu cầu Token`
- **Method:** `POST`
- **Endpoint:** `/api/user/conversations/upload-image`
- **Request Body:** Form-Data (`multipart/form-data`) - Chứa field `image` (file ảnh) và `partnerId` (bắt buộc), `matchSessionId` (tùy chọn).
- **Responses:**
  - `201 Created`: Trả về Message object đã lưu DB (chứa URL ảnh). Đối phương sẽ tự nhận được ảnh qua Socket.
    ```json
    {
       "_id": "...",
       "content": "https://res.cloudinary.com/...",
       "type": "image",
       "conversationId": "..."
    }
    ```

---

## 5. Friend APIs (`/api/user/friends`)
Mọi việc liên quan đến trạng thái gửi, nhận và quản lý bạn bè.

### 5.1 Lấy danh sách yêu cầu kết bạn `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/friends/friends/requests`
- **Responses:**
  - `200 OK`:
    ```json
    [
      {
        "_id": "friendship_request_id",
        "partner": {
           "_id": "requester_id",
           "username": "user",
           "avatar": "...",
           "email": "user@example.com"
        },
        "sentAt": { "full": "10/05/2023 10:00", "friendly": "30 phút trước" }
      }
    ]
    ```

### 5.2 Gửi yêu cầu kết bạn `🔒 Yêu cầu Token`
- **Method:** `POST`
- **Endpoint:** `/api/user/friends/friends/{recipientId}/request`
- **Path Parameters:** `recipientId` = ID đích.
- **Responses:**
  - `201 Created`: `{ "message": "Đã gửi yêu cầu kết bạn" }`
  - `400 Bad Request`: `{ "error": "Đã tồn tại mối quan hệ với người này" }`

### 5.3 Phản hồi yêu cầu kết bạn `🔒 Yêu cầu Token`
- **Method:** `PATCH`
- **Endpoint:** `/api/user/friends/friends/{requestId}/response`
- **Path Parameters:** `requestId` = ID của lời mời (FriendshipRequest).
- **Request Body (JSON):**
  ```json
  {
    "status": "accept" // Enum: ['accept', 'reject']
  }
  ```
- **Responses:**
  - `200 OK`: `{ "message": "Đã chấp nhận yêu cầu kết bạn" }` (nếu `"status": "accept"`)
  - `200 OK`: `{ "message": "Đã từ chối yêu cầu kết bạn" }` (nếu `"status": "reject"`)
  - `400 Bad Request`: `{ "error": "Trạng thái không hợp lệ" }`
  - `403 Forbidden`: `{ "error": "Không có quyền thực hiện hành động này" }`

---

## 6. Matches APIs (`/api/user/matches`)
Lịch sử cuộc gọi và ghép cặp (Match Session History).

### 6.1 Lấy danh sách lịch sử các phiên Matching `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/matches`
- **Query Parameters (Tuỳ chọn):** `?limit=20&page=1`
- **Responses:**
  - `200 OK`: Trả về danh sách các cuộc gọi có thời lượng.
    ```json
    [
      {
        "_id": "match_session_id",
        "status": "completed",
        "durationSeconds": 145,
        "conversationId": "conversation_id",
        "partner": {
           "_id": "partner_id",
           "username": "user",
           "profile": { "fullName": "Nguyen B" }
        }
      }
    ]
    ```

### 6.2 Lấy chi tiết phiên gọi bao gồm tin nhắn `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/matches/{sessionId}`
- **Path Parameters:** `sessionId` = ID của phiên gọi.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "_id": "match_session_id",
      "status": "completed",
      "durationSeconds": 145,
      "conversationId": "conversation_id",
      "partner": { ... },
      "messages": [
        {
          "_id": "msg_id",
          "senderId": "nguoi_gui",
          "content": "Noi dung chat"
        }
      ]
    }
    ```
  - `400/500 Lỗi`: `{ "error": "Phiên gọi không tồn tại hoặc Không có quyền truy cập." }`

### 6.3 Đánh giá phiên gọi và người bạn ghép cặp `🔒 Yêu cầu Token`
- **Method:** `POST`
- **Endpoint:** `/api/user/matches/{sessionId}/review`
- **Path Parameters:** `sessionId` = ID của phiên gọi.
- **Request Body (JSON):**
  ```json
  {
    "rating": 5,
    "comment": "Rất vui vẻ và thân thiện"
  }
  ```
- **Responses:**
  - `201 Created`: 
    ```json
    {
      "message": "Đánh giá phiên gọi thành công",
      "review": {
        "_id": "review_id",
        "reviewerId": "...",
        "targetUserId": "...",
        "matchSessionId": "...",
        "rating": 5,
        "comment": "Rất vui vẻ và thân thiện",
        "createdAt": "..."
      }
    }
    ```
  - `400 Bad Request`: `{ "error": "Bạn đã đánh giá phiên gọi này rồi." }` hoặc `{ "error": "Đánh giá phải từ 1 đến 5 sao." }`
  - `403 Forbidden`: `{ "error": "Bạn không có quyền đánh giá phiên gọi này." }`
  - `404 Not Found`: `{ "error": "Phiên gọi không tồn tại." }`

---

## 7. Notification APIs (`/api/user/notifications`)
Quản lý thông báo người dùng.

### 7.1 Lấy danh sách thông báo `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/notifications`
- **Query Parameters (Tuỳ chọn):** `?limit=20&page=1`
- **Responses:**
  - `200 OK`: 
    ```json
    [
      {
        "_id": "notif_id",
        "type": "friend_request",
        "content": "User A đã gửi cho bạn lời mời kết bạn.",
        "isRead": false,
        "senderId": { "_id": "...", "profile": { "fullName": "User A", "avatar": "..." } },
        "metadata": { "friendshipId": "..." }
      }
    ]
    ```

### 7.2 Đếm số thông báo chưa đọc `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/user/notifications/unread-count`
- **Responses:**
  - `200 OK`: `{ "unreadCount": 5 }`

### 7.3 Đánh dấu 1 thông báo đã đọc `🔒 Yêu cầu Token`
- **Method:** `PATCH`
- **Endpoint:** `/api/user/notifications/{notificationId}/read`
- **Responses:**
  - `200 OK`: `{ "message": "Đã đánh dấu đã đọc" }`

### 7.4 Đánh dấu tất cả thông báo đã đọc `🔒 Yêu cầu Token`
- **Method:** `PATCH`
- **Endpoint:** `/api/user/notifications/read-all`
- **Responses:**
  - `200 OK`: `{ "message": "Đã đánh dấu tất cả đã đọc" }`

---

## 8. Socket.IO EVENTS
Danh sách các sự kiện Socket phục vụ ghép cặp ngẫu nhiên, gọi bạn bè, nhắn tin, gọi video (WebRTC), trạng thái online và thông báo.

### 8.1 Lướt ngẫu nhiên (Random Match)
- **`[EMIT]` join_queue**: Gửi yêu cầu ghép cặp ngẫu nhiên.
  - *Payload*: `{ "language": "vi" }`
- **`[EMIT]` leave_queue**: Thoát hàng chờ hoặc thoát khỏi phòng match hiện tại.
- **`[ON]` waiting_status**: Đang tìm kiếm...
  - *Payload*: `{ "message": "Đang tìm kiếm đối thủ..." }`
- **`[ON]` queue_timeout**: Lỗi / hết thời gian xếp hàng.
  - *Payload*: `{ "message": "Không tìm được đối tác..." }`
- **`[ON]` match_found**: Ghép cặp hoặc cuộc gọi trực tiếp thành công!
  - *Payload*: `{ "sessionId": "id_phong", "partnerId": "id_đối_phương" }`

### 8.2 Gọi thân thiết (Direct Intentional Matching)
- **`[EMIT]` direct_match_request**: Yêu cầu gọi điện tới một người bạn.
  - *Payload*: `{ "targetUserId": "user_id_người_muốn_gọi" }`
- **`[EMIT]` direct_match_response**: Phản hồi (Bắt máy / Từ chối).
  - *Payload*: `{ "callerId": "user_id_người_gọi", "accept": true }`
- **`[ON]` direct_match_offer**: Nhận được thông báo có cuộc gọi đến (đổ chuông).
  - *Payload*: `{ "callerId": "người_gọi", "message": "Bạn có một cuộc gọi đến." }`
- **`[ON]` direct_match_rejected**: Người kia đã dập máy/từ chối cuộc gọi.
  - *Payload*: `{ "message": "Người dùng đã từ chối cuộc gọi." }`
- **`[ON]` direct_match_error**: Các lỗi như đối phương offline, lỗi đồng ý kết nối.
  - *Payload*: `{ "message": "Đối tác hiện đang offline." }`

### 8.3 WebRTC (Truyền tải âm thanh / Video P2P)
Sử dụng chung các luồng sau cho WebRTC, truyền tải dữ liệu P2P trong thời gian thực khi đã ở chung 1 phòng gọi.
- **`[EMIT / ON]` webrtc_offer**: Truyền và Lắng nghe SDP Offer.
  - *Payload*: `{ "sessionId": "id_phong", "offer": { type: "offer", sdp: "..." } }`
- **`[EMIT / ON]` webrtc_answer**: Truyền và Lắng nghe SDP Answer.
  - *Payload*: `{ "sessionId": "id_phong", "answer": { type: "answer", sdp: "..." } }`
- **`[EMIT / ON]` webrtc_ice_candidate**: Gửi các đường rẽ mạng ICE.
  - *Payload*: `{ "sessionId": "id_phong", "candidate": { ... } }`

### 8.4 Chat theo thời gian thực (Messaging)
- **`[EMIT]` send_message**: Gửi một tin nhắn.
  - *Payload*:
    ```json
    {
      "partnerId": "id_người_nhận",
      "content": "Nội dung chat",
      "type": "text", // Hoặc "image"
      "matchSessionId": "id_phong" // (Bỏ trống hoặc null nếu là nhắn riêng bên ngoài với bạn bè)
    }
    ```
- **`[ON]` message_sent_success**: Thông báo đã lưu xuống Database thành công.
  - *Payload*: `Message Object`
- **`[ON]` receive_message**: Có tin nhắn mới được gửi đến (Tới người nhận).
  - *Payload*: 
    ```json
    {
      "_id": "message_id",
      "content": "Nội dung chat",
      "type": "text",
      "conversationId": "..."
    }
    ```

### 8.5 Thông báo (Notifications)
- **`[ON]` new_notification**: Nhận thông báo mới theo thời gian thực (realtime push).
  - *Payload*:
    ```json
    {
      "_id": "notif_id",
      "type": "friend_request", // Hoặc friend_accepted, report_new, account_banned, etc.
      "content": "Nội dung thông báo",
      "senderId": { "profile": { "fullName": "..." } }
    }
    ```
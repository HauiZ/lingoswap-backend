# Tài liệu API LingoSwap Backend

Dưới đây là tổng hợp toàn bộ các API hiện tại của hệ thống, dựa trên cấu trúc Routing (`auth`, `user`, `admin`). API có tag `🔒 Yêu cầu Token` cần đính kèm header `Authorization: Bearer <accessToken>`.

---

## 1. Authentication APIs (`/api/auth`)
Các API liên quan đến xác thực, đăng nhập và quản lý mật khẩu.

### 1.1 Đăng ký người dùng
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "fullName": "Nguyen Van A",
    "nativeLanguage": "vi",
    "targetLanguage": "en",
    "proficiencyLevel": "Beginner" // Enum: ['Beginner', 'Intermediate', 'Advanced']
  }
  ```
- **Responses:**
  - `201 Created`: Đăng ký thành công (trả về thông tin user & token).
  - `400 Bad Request`: Lỗi dữ liệu không hợp lệ.

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
  - `200 OK`: Đăng nhập thành công, trả về JWT Token và gán `refreshToken` vào HttpOnly Cookie.
  - `401 Unauthorized`: Sai email hoặc mật khẩu.

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
  - `200 OK`: Đăng nhập hoặc tạo mới thành công, gán JWT Token.
  - `400 Bad Request`: Thiếu `idToken`.

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
  - `200 OK`: Đăng nhập hoặc tạo mới thành công, gán JWT Token.
  - `400 Bad Request`: Thiếu `accessToken` hoặc token không hợp lệ từ FB Graph API.

### 1.5 Làm mới Token
- **Method:** `POST`
- **Endpoint:** `/api/auth/refresh-token`
- **Request Header/Cookies:** Gửi kèm cookie `refreshToken` đã được set ở bước Đăng nhập.
- **Responses:**
  - `200 OK`: Trả về `accessToken` mới.
  - `401 Unauthorized`: Không tìm thấy Refresh Token (cần đăng nhập lại).
  - `403 Forbidden`: Refresh Token không hợp lệ hoặc đã hết hạn.

### 1.6 Đăng xuất
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Mô tả:** Xóa `refreshToken` cookie khỏi trình duyệt.
- **Responses:**
  - `200 OK`: Đăng xuất thành công.

### 1.7 Thay đổi mật khẩu `🔒 Yêu cầu Token`
- **Method:** `PUT`
- **Endpoint:** `/api/auth/change-password`
- **Request Body (JSON):**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: Đổi mật khẩu thành công.
  - `400 Bad Request`: Sai mật khẩu cũ.

### 1.8 Yêu cầu quên mật khẩu (Gửi OTP)
- **Method:** `POST`
- **Endpoint:** `/api/auth/forgot-password`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Responses:**
  - `200 OK`: Email nạp mã OTP đã được gửi.
  - `404 Not Found`: Không tìm thấy email trong hệ thống.

### 1.9 Đặt lại mật khẩu (Dùng OTP)
- **Method:** `POST`
- **Endpoint:** `/api/auth/reset-password`
- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: Đặt lại mật khẩu thành công.
  - `400 Bad Request`: Mã OTP sai hoặc đã quá hạn.

---

## 2. User & Profile APIs (`/api/users`)
Quản lý thông tin hồ sơ người dùng.

### 2.1 Lấy thông tin cá nhân `🔒 Yêu cầu Token`
- **Method:** `GET`
- **Endpoint:** `/api/users/me`
- **Responses:**
  - `200 OK`: Trả về đối tượng hồ sơ người dùng hiện tại (không bao gồm password).

### 2.2 Lấy thông tin Public Profile 
- **Method:** `GET`
- **Endpoint:** `/api/users/{id}`
- **Path Parameters:** `id` = ID của người dùng.
- **Responses:**
  - `200 OK`: Thông tin public của người dùng.
  - `404 Not Found`: Người dùng không tồn tại.

### 2.3 Cập nhật hồ sơ cá nhân `🔒 Yêu cầu Token`
- **Method:** `PUT`
- **Endpoint:** `/api/users/me`
- **Request Body (JSON):**
  ```json
  {
    "profile": {
      "fullName": "Name Changed",
      "bio": "New bio text",
      "targetLanguage": "ja"
    },
    "settings": {
      "theme": "dark",
      "uiLanguage": "vi"
    }
  }
  ```
- **Responses:**
  - `200 OK`: User cập nhật thành công và trả về thông tin mới.

### 2.4 Cập nhật Avatar `🔒 Yêu cầu Token`
- **Method:** `POST`
- **Endpoint:** `/api/users/avatar`
- **Request Body (Multipart/Form-Data):**
  - Cần chứa key/field name là `avatar` đi kèm với file ảnh dạng Binary (.jpg, .png, .webp...).
- **Responses:**
  - `200 OK`: Cập nhật thành công, trả về `avatarUrl` từ Cloudinary.
  - `400 Bad Request`: Thiếu thư mục/file ảnh.

---

## 3. Admin APIs (`/api/admin`)
Dành riêng cho quản trị viên, tất cả endpoint đều yêu cầu xác thực (`Authenticate Token`) và quyền (`Role = admin`).

### 3.1 Lấy danh sách Users `🔒 Admin Token`
- **Method:** `GET`
- **Endpoint:** `/api/admin/users`
- **Responses:**
  - `200 OK`: Trả về mảng danh sách toàn bộ người dùng trong hệ thống.

### 3.2 Khóa (Ban) tài khoản người dùng `🔒 Admin Token`
- **Method:** `PUT`
- **Endpoint:** `/api/admin/users/{id}/ban`
- **Path Parameters:** `id` = ID của người dùng cần xử lý.
- **Responses:**
  - `200 OK`: Khóa/Gỡ khóa người dùng thành công (Chuyển trạng thái `status`).

### 3.3 Xóa tài khoản vĩnh viễn `🔒 Admin Token`
- **Method:** `DELETE`
- **Endpoint:** `/api/admin/users/{id}`
- **Path Parameters:** `id` = ID của người dùng.
- **Responses:**
  - `200 OK`: Xóa dữ liệu user thành công.

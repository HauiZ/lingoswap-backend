# CHƯƠNG 4: ĐÁNH GIÁ CHẤT LƯỢNG VÀ KIỂM THỬ (V&V)

## 4.1 Chiến lược Kiểm chứng (Verification) và Xác nhận (Validation)
* [cite_start]**Verification (Kiểm chứng – Làm đúng phần mềm):** Thực hiện rà soát (Review) các tài liệu thiết kế nhằm đảm bảo phần mềm được xây dựng đúng theo đặc tả[cite: 220]. 
  * [cite_start]*Câu hỏi trọng tâm:* "Sản phẩm có được xây dựng đúng cách không?" [cite: 221]
* [cite_start]**Validation (Xác nhận – Làm phần mềm đúng yêu cầu):** Thực hiện kiểm thử (Testing) khi phần mềm đã hình thành nhằm xác nhận sản phẩm đáp ứng đúng mong đợi thực tế của người dùng[cite: 222].
  * [cite_start]*Câu hỏi trọng tâm:* "Sản phẩm có đúng với điều người dùng cần không?" [cite: 223]

---

## 4.2 Rà soát tài liệu (Review)

### 4.2.1 Walk-through (Rà soát không chính thức)
[cite_start]Nhóm tổ chức các buổi walk-through sau mỗi mốc phát triển với mục tiêu đạt đồng thuận về thiết kế, cải tiến giải pháp và định nghĩa sớm các tiêu chí kiểm thử[cite: 226].

| Phiên Walk-through | Đối tượng rà soát | Kết quả / Vấn đề phát hiện |
| :--- | :--- | :--- |
| [cite_start]**WK-01:** Sau phân tích [cite: 227] | [cite_start]Use Case Diagram, Sequence Diagram ghép cặp [cite: 227] | [cite_start]Bổ sung nhánh ngoại lệ 'mất kết nối khi đang chờ queue'; cập nhật Sequence Diagram [cite: 227] |
| [cite_start]**WK-02:** Sau thiết kế DB [cite: 227] | [cite_start]Thiết kế MongoDB Collections [cite: 227] | [cite_start]Phát hiện thiếu trường `isReadOnly` trong Conversations; thêm vào schema [cite: 227] |
| [cite_start]**WK-03:** Sau thiết kế API [cite: 227] | [cite_start]Danh sách API endpoints [cite: 227] | [cite_start]Đồng thuận dùng Socket emit thay REST cho `match_found` để giảm độ trễ [cite: 227] |

### 4.2.2 Inspection (Rà soát chính thức)
[cite_start]Áp dụng quy trình Inspection dựa trên Checklist để đánh giá hệ thống qua 4 tiêu chí: Hoàn chỉnh (Completeness), Nhất quán (Consistency), Khả thi (Feasibility) và Khả kiểm (Testability)[cite: 229].

| STT | Đối tượng | Tiêu chí | Nội dung kiểm tra | Kết quả | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | [cite_start]Use Case tổng quát [cite: 230] | [cite_start]Hoàn chỉnh [cite: 230] | [cite_start]Tất cả nhu cầu (Ghép cặp, Chat, Report, Admin) đã thành Use Case? [cite: 230] | [cite_start]Đạt – đủ 4 phân hệ [cite: 230] | [cite_start]Cao [cite: 230] |
| 2 | [cite_start]Sequence Diagram OTP [cite: 230] | [cite_start]Nhất quán [cite: 230] | [cite_start]Tên Actor/Component khớp với sơ đồ phân rã hệ thống? [cite: 230] | [cite_start]Đạt – nhất quán [cite: 230] | [cite_start]Cao [cite: 230] |
| 3 | [cite_start]API Endpoints [cite: 230] | [cite_start]Hoàn chỉnh [cite: 230] | [cite_start]Mọi luồng trong Sequence Diagram có API/Event tương ứng? [cite: 230] | [cite_start]Đạt – đủ 34 API + 11 Socket event [cite: 230] | [cite_start]Cao [cite: 230] |
| 4 | [cite_start]Thiết kế DB [cite: 230] | [cite_start]Khả thi [cite: 230] | [cite_start]Truy vấn ghép cặp $O(1)$ với Redis có thực hiện được không? [cite: 230] | [cite_start]Đạt – RPOP/LPUSH trực tiếp [cite: 230] | [cite_start]Cao [cite: 230] |
| 5 | [cite_start]Yêu cầu NFR-01 [cite: 230] | [cite_start]Khả kiểm [cite: 230] | [cite_start]Có thể đo lường 'ghép cặp < 2 giây' bằng JMeter không? [cite: 230] | [cite_start]Đạt – dùng JMeter + Timestamp [cite: 230] | [cite_start]Trung bình [cite: 230] |
| 6 | [cite_start]Activity Diagram Report [cite: 230] | [cite_start]Nhất quán [cite: 230] | [cite_start]Luồng Report có khớp với Sequence Diagram Admin không? [cite: 230] | [cite_start]Đạt sau sửa – cập nhật bước Lưu vết [cite: 230] | [cite_start]Cao [cite: 230] |
| 7 | [cite_start]Ma trận dò vết (Traceability) [cite: 230] | [cite_start]Nhất quán [cite: 230] | [cite_start]Kiểm tra sự liên kết giữa Req ID (FR/NFR) và Test Case ID tương ứng? [cite: 230] | [cite_start]Đạt – 100% khớp mã ID [cite: 230] | [cite_start]Cao [cite: 230] |
| 8 | [cite_start]Cơ chế Bảo mật (Security) [cite: 230] | [cite_start]Hoàn chỉnh [cite: 230] | [cite_start]Các API nhạy cảm (quản trị, thông tin cá nhân) đã có Middleware xác thực JWT chưa? [cite: 230] | [cite_start]Đạt – Phủ 100% API cần bảo mật [cite: 230] | [cite_start]Cao [cite: 230] |

---

## 4.3 Chiến lược và Kỹ thuật Kiểm thử (Testing)

### 4.3.1 Chiến lược kiểm thử tổng thể
* [cite_start]**Nguyên lý Pareto (80/20):** Tập trung kiểm thử 20% tính năng cốt lõi (Auth, Matching, Chat/Call) nhằm quyết định 80% giá trị của hệ thống LingoSwap[cite: 233].
* [cite_start]**Chiến lược Bottom-up:** Tiến hành kiểm thử tuần tự từ Unit (từng function Service) $\rightarrow$ Integration (API + DB) $\rightarrow$ System (toàn luồng) $\rightarrow$ UAT (người dùng thực)[cite: 234].
* [cite_start]**Phương pháp Gieo lỗi (Seed Bugs):** Chủ động cài 10 lỗi nhân tạo vào codebase rồi chạy toàn bộ test suite[cite: 235]. [cite_start]Nếu hệ thống phát hiện được 8/10 lỗi gieo $\rightarrow$ đạt hiệu quả 80% $\rightarrow$ ước lượng còn khoảng ~20% lỗi thực bị sót lại[cite: 236].

### 4.3.2 Thiết kế Test Case từ Use Case
[cite_start]Phân tích luồng chính (Main Flow) và luồng ngoại lệ (Alternative/Exception Flow) của từng Use Case để sinh tập hợp Test Case đầy đủ[cite: 238]:

| TC ID | Mô tả kịch bản | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Kỹ thuật |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [cite_start]**TC-01** [cite: 239] | [cite_start]Đăng ký thành công với email hợp lệ [cite: 239] [cite_start]| email: test@gmail.com, password: Abc@1234 [cite: 239] | [cite_start]HTTP 201, OTP được gửi tới email [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Black-box BVA [cite: 239] |
| [cite_start]**TC-02** [cite: 239] | [cite_start]Đăng ký email đã tồn tại [cite: 239] [cite_start]| email: existing@gmail.com [cite: 239] | [cite_start]HTTP 409 Conflict, thông báo lỗi [cite: 239] | [cite_start]Negative [cite: 239] | [cite_start]Equivalence Partition [cite: 239] |
| [cite_start]**TC-03** [cite: 239] | [cite_start]Xác thực OTP đúng trong 5 phút [cite: 239] [cite_start]| otpCode: '123456' (hợp lệ) [cite: 239] | [cite_start]HTTP 200, tài khoản được kích hoạt [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Decision Table [cite: 239] |
| [cite_start]**TC-04** [cite: 239] | [cite_start]Xác thực OTP sai / hết hạn [cite: 239] [cite_start]| otpCode: '000000' / OTP sau 5 phút [cite: 239] | [cite_start]HTTP 400, thông báo lỗi xác thực [cite: 239] | [cite_start]Negative [cite: 239] | [cite_start]BVA – boundary 5 phút [cite: 239] |
| [cite_start]**TC-05** [cite: 239] | [cite_start]Đăng nhập thành công và cấp Token [cite: 239] [cite_start]| email: 'test@gmail.com', password: 'Abc@1234' [cite: 239] | [cite_start]HTTP 200 OK, trả về Access Token & Refresh Token [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Black-box Func Test [cite: 239] |
| [cite_start]**TC-06** [cite: 239] | [cite_start]Cập nhật thông tin hồ sơ cá nhân [cite: 239] [cite_start]| fullName: 'Trung Hậu', nativeLang: 'Vietnamese' [cite: 239] | [cite_start]HTTP 200, dữ liệu User trong MongoDB được cập nhật chính xác [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]CRUD Testing [cite: 239] |
| [cite_start]**TC-07** [cite: 239] | [cite_start]Ghép cặp khi có người chờ cùng ngôn ngữ [cite: 239] [cite_start]| lang: 'English', 2 user online [cite: 239] [cite_start]| emit('match_found') đến cả 2 trong < 2s [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Black-box Func Test [cite: 239] |
| [cite_start]**TC-08** [cite: 239] | [cite_start]Vào queue khi chưa có người chờ [cite: 239] [cite_start]| lang: 'Japanese', 1 user [cite: 239] | [cite_start]Trạng thái 'Đang chờ', lưu vào Redis [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Black-box [cite: 239] |
| [cite_start]**TC-09** [cite: 239] | [cite_start]User thoát app khi đang chờ queue [cite: 239] | [cite_start]Disconnect socket [cite: 239] | [cite_start]User bị xóa khỏi Redis queue [cite: 239] | [cite_start]Negative [cite: 239] | [cite_start]Exception Flow [cite: 239] |
| [cite_start]**TC-10** [cite: 239] | [cite_start]Gửi tin nhắn có từ cấm [cite: 239] [cite_start]| content: '[từ cấm]' [cite: 239] | [cite_start]Tin nhắn bị lọc/cảnh báo, không hiển thị [cite: 239] | [cite_start]Negative [cite: 239] | [cite_start]Cause-Effect Graph [cite: 239] |
| [cite_start]**TC-11** [cite: 239] | [cite_start]Nhận tin nhắn thời gian thực [cite: 239] | Sender gửi: "Hello"; [cite_start]Partner đang online [cite: 239] | [cite_start]Partner nhận sự kiện receive_message chứa nội dung "Hello" [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Socket.io Event [cite: 239] |
| [cite_start]**TC-12** [cite: 239] | [cite_start]Khởi tạo Video Call (WebRTC) [cite: 239] | Client A gửi offer; [cite_start]Client B gửi answer [cite: 239] | [cite_start]Trạng thái Signaling hoàn tất; luồng Media (P2P) được thiết lập [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]P2P Signaling [cite: 239] |
| [cite_start]**TC-13** [cite: 239] | [cite_start]Gửi lời mời kết bạn [cite: 239] [cite_start]| targetUserId: '65f...'; token hợp lệ [cite: 239] | HTTP 201; [cite_start]Bản ghi Friendship trạng thái 'pending' được tạo [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Black-box [cite: 239] |
| [cite_start]**TC-14** [cite: 239] | [cite_start]Gửi đơn tố cáo hợp lệ [cite: 239] [cite_start]| reportedId, reason, conversationId [cite: 239] | [cite_start]HTTP 201, Report lưu vào DB [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Functional Test [cite: 239] |
| [cite_start]**TC-15** [cite: 239] | [cite_start]Gửi đơn tố cáo thiếu lý do [cite: 239] [cite_start]| reportedId: 'abc'; reason: "" (rỗng) [cite: 239] | [cite_start]HTTP 400 Bad Request; thông báo "Lý do không được để trống" [cite: 239] | [cite_start]Negative [cite: 239] | [cite_start]Error Guessing [cite: 239] |
| [cite_start]**TC-16** [cite: 239] | [cite_start]Admin thực hiện khóa tài khoản [cite: 239] [cite_start]| targetUserId: 'user01'; status: 'Banned' [cite: 239] | User record trong DB cập nhật status: 'Banned'; [cite_start]User bị logout [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]Role-based [cite: 239] |
| [cite_start]**TC-17** [cite: 239] | [cite_start]Admin truy xuất danh sách tố cáo [cite: 239] | [cite_start]Admin token; endpoint: /api/admin/reports [cite: 239] | Trả về danh sách các đơn tố cáo từ MongoDB; [cite_start]HTTP 200 [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]API Query [cite: 239] |
| [cite_start]**TC-18** [cite: 239] | [cite_start]Thêm từ khóa vào Blacklist [cite: 239] | keyword: "quấy rối"; [cite_start]Admin quyền cao nhất [cite: 239] | [cite_start]Từ khóa được lưu vào BlacklistKeywords collection; bộ lọc cập nhật [cite: 239] | [cite_start]Positive [cite: 239] | [cite_start]CRUD [cite: 239] |
| [cite_start]**TC-P01** [cite: 239] | [cite_start]Load test ghép cặp 100 users đồng thời [cite: 239] | [cite_start]100 socket clients join queue cùng lúc [cite: 239] | [cite_start]50 cặp được ghép, thời gian < 2s/cặp [cite: 239] | [cite_start]Performance [cite: 239] | [cite_start]JMeter Load Test [cite: 239] |
| [cite_start]**TC-S01** [cite: 239] | [cite_start]Truy cập API không có JWT Token [cite: 239] | [cite_start]Request header: rỗng [cite: 239] | [cite_start]HTTP 401 Unauthorized; không thể truy cập dữ liệu [cite: 239] | [cite_start]Security [cite: 239] | [cite_start]Security Scan [cite: 239] |
| [cite_start]**TC-S02** [cite: 239] | [cite_start]Truy cập API với JWT đã hết hạn [cite: 239] | [cite_start]JWT Token sinh ra từ 24h trước [cite: 239] | [cite_start]HTTP 403 Forbidden hoặc Token Expired [cite: 239] | [cite_start]Security [cite: 239] | [cite_start]Security Scan [cite: 239] |
| [cite_start]**TC-R01** [cite: 239] | [cite_start]Kiểm tra tự động kết nối lại (Reconnection) [cite: 239] | [cite_start]Ngắt kết nối mạng của Client trong 10 giây rồi bật lại [cite: 239] | [cite_start]Socket tự động reconnect; phiên chat không bị mất dữ liệu [cite: 239] | [cite_start]Reliability [cite: 239] | [cite_start]Fault Injection [cite: 239] |
| [cite_start]**TC-U01** [cite: 239] | [cite_start]Đánh giá thời gian thực hiện tác vụ (Onboarding) [cite: 239] | [cite_start]Người dùng mới thực hiện luồng: Đăng ký [cite: 239] | [cite_start]80% người dùng hoàn thành trong < 3 phút [cite: 239] | [cite_start]Usability [cite: 239] | [cite_start]User Observation [cite: 239] |

### 4.3.3 Kiểm thử Hộp đen (Black-box Testing)
[cite_start]Áp dụng cho Functional Testing và System Testing ở tầng Giao diện (Frontend) của LingoSwap[cite: 241]:

#### [cite_start]A. Validation form input [cite: 242]
| TC ID | Field | Mô tả | Input | Expected Output | Rule vi phạm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FULLNAME** | | | | | |
| [cite_start]FE01 [cite: 243] [cite_start]| fullName [cite: 243] | [cite_start]Bỏ trống [cite: 243] | [cite_start]`""` [cite: 243] | [cite_start]Lỗi: fullName không được để trống [cite: 243] [cite_start]| required [cite: 243] |
| [cite_start]FE02 [cite: 243] [cite_start]| fullName [cite: 243] | [cite_start]Chỉ có khoảng trắng [cite: 243] | [cite_start]`" "` [cite: 243] | [cite_start]Lỗi: fullName không được để trống [cite: 243] [cite_start]| required / trim [cite: 243] |
| [cite_start]FE03 [cite: 243] [cite_start]| fullName [cite: 243] | [cite_start]Quá ngắn (< 2 ký tự) [cite: 243] | [cite_start]`"A"` [cite: 243] | [cite_start]Lỗi: fullName quá ngắn [cite: 243] [cite_start]| minLength(2) [cite: 243] |
| [cite_start]FE04 [cite: 243] [cite_start]| fullName [cite: 243] | [cite_start]Quá dài (> 50 ký tự) [cite: 243] | [cite_start]`"Nguyen Van Anh Khoa Bao Long Tran Minh Tuan Duc Hoa"` [cite: 243] | [cite_start]Lỗi: fullName quá dài [cite: 243] [cite_start]| maxLength(50) [cite: 243] |
| [cite_start]FE05 [cite: 243] [cite_start]| fullName [cite: 243] | [cite_start]Chứa ký tự đặc biệt / số [cite: 243] | [cite_start]`"Nguyen123"` [cite: 243] | [cite_start]Lỗi: fullName chỉ được chứa chữ cái [cite: 243] [cite_start]| isAlpha / pattern [cite: 243] |
| [cite_start]FE06 [cite: 243] [cite_start]| fullName [cite: 243] | [cite_start]Hợp lệ [cite: 243] | [cite_start]`"Nguyen Van A"` [cite: 243] | [cite_start]Không có lỗi [cite: 243] | [cite_start]— [cite: 243] |
| **EMAIL** | | | | | |
| [cite_start]FE07 [cite: 243] [cite_start]| email [cite: 243] | [cite_start]Bỏ trống [cite: 243] | [cite_start]`""` [cite: 243] | [cite_start]Lỗi: email không được để trống [cite: 243] [cite_start]| required [cite: 243] |
| [cite_start]FE08 [cite: 243] [cite_start]| email [cite: 243] | [cite_start]Thiếu ký tự @ [cite: 243] | [cite_start]`"abcgmail.com"` [cite: 243] | [cite_start]Lỗi: sai định dạng email [cite: 243] [cite_start]| isEmail [cite: 243] |
| [cite_start]FE09 [cite: 243] [cite_start]| email [cite: 243] | [cite_start]Thiếu domain sau @ [cite: 243] | [cite_start]`"abc@"` [cite: 243] | [cite_start]Lỗi: sai định dạng email [cite: 243] [cite_start]| isEmail [cite: 243] |
| [cite_start]FE10 [cite: 243] [cite_start]| email [cite: 243] | [cite_start]Thiếu phần mở rộng [cite: 243] | [cite_start]`"abc@gmail"` [cite: 243] | [cite_start]Lỗi: sai định dạng email [cite: 243] [cite_start]| isEmail [cite: 243] |
| [cite_start]FE11 [cite: 243] [cite_start]| email [cite: 243] | [cite_start]Hợp lệ [cite: 243] | [cite_start]`"abc@gmail.com"` [cite: 243] | [cite_start]Không có lỗi [cite: 243] | [cite_start]— [cite: 243] |
| **PASSWORD** | | | | | |
| [cite_start]FE12 [cite: 243] [cite_start]| password [cite: 243] | [cite_start]Bỏ trống [cite: 243] | [cite_start]`""` [cite: 243] | [cite_start]Lỗi: password không được để trống [cite: 243] [cite_start]| required [cite: 243] |
| [cite_start]FE13 [cite: 243] [cite_start]| password [cite: 243] | [cite_start]Dưới 8 ký tự [cite: 243] | [cite_start]`"Abc@1"` [cite: 243] | [cite_start]Lỗi: password quá ngắn [cite: 243] [cite_start]| minLength(8) [cite: 243] |
| [cite_start]FE14 [cite: 243] [cite_start]| password [cite: 243] | [cite_start]Không có chữ hoa [cite: 243] | [cite_start]`"truong@123"` [cite: 243] | [cite_start]Lỗi: password chưa đủ mạnh [cite: 243] [cite_start]| isStrongPassword [cite: 243] |
| [cite_start]FE15 [cite: 243] [cite_start]| password [cite: 243] | [cite_start]Không có ký tự đặc biệt [cite: 243] | [cite_start]`"Truong1235"` [cite: 243] | [cite_start]Lỗi: password chưa đủ mạnh [cite: 243] [cite_start]| isStrongPassword [cite: 243] |
| [cite_start]FE16 [cite: 243] [cite_start]| password [cite: 243] | [cite_start]Không có chữ số [cite: 243] | [cite_start]`"Truong@abc"` [cite: 243] | [cite_start]Lỗi: password chưa đủ mạnh [cite: 243] [cite_start]| isStrongPassword [cite: 243] |
| [cite_start]FE17 [cite: 243] [cite_start]| password [cite: 243] | [cite_start]Hợp lệ [cite: 243] | [cite_start]`"Abc@12345"` [cite: 243] | [cite_start]Không có lỗi [cite: 243] | [cite_start]— [cite: 243] |
| **MULTI-FIELD** | | | | | |
| [cite_start]FE18 [cite: 243] [cite_start]| fullName, email, password [cite: 243] | [cite_start]Bỏ trống cả 3 field [cite: 243] | [cite_start]`""`, `""`, `""` [cite: 243] | [cite_start]Lỗi cả 3 field [cite: 243] [cite_start]| required [cite: 243] |
| [cite_start]FE19 [cite: 243] [cite_start]| email, password [cite: 243] | [cite_start]Bỏ trống email [cite: 243] | [cite_start]`""` + `"Abc@12345"` [cite: 243] | [cite_start]Chỉ lỗi email [cite: 243] [cite_start]| required(email) [cite: 243] |
| [cite_start]FE20 [cite: 243] [cite_start]| email, password [cite: 243] | [cite_start]Bỏ trống password [cite: 243] | [cite_start]`"abc@gmail.com"` + `""` [cite: 243] | [cite_start]Chỉ lỗi password [cite: 243] [cite_start]| required(password) [cite: 243] |
| **OTP** | | | | | |
| [cite_start]FE21 [cite: 243] | [cite_start]OTP [cite: 243] | [cite_start]Bỏ trống [cite: 243] | [cite_start]`""` [cite: 243] | [cite_start]Lỗi: OTP không được để trống [cite: 243] [cite_start]| required [cite: 243] |
| [cite_start]FE22 [cite: 243] | [cite_start]OTP [cite: 243] | [cite_start]Không đủ 6 chữ số [cite: 243] | [cite_start]`"123"` [cite: 243] | [cite_start]Lỗi: OTP phải đủ 6 ký tự [cite: 243] [cite_start]| length(6) [cite: 243] |
| [cite_start]FE23 [cite: 243] | [cite_start]OTP [cite: 243] | [cite_start]Chứa ký tự không phải số [cite: 243] | [cite_start]`"12a456"` [cite: 243] | [cite_start]Lỗi: OTP chỉ được nhập số [cite: 243] [cite_start]| isNumeric [cite: 243] |
| [cite_start]FE24 [cite: 243] | [cite_start]OTP [cite: 243] | [cite_start]Hợp lệ [cite: 243] | [cite_start]`"123456"` [cite: 243] | [cite_start]Không có lỗi [cite: 243] | [cite_start]— [cite: 243] |

#### [cite_start]B. Ghép cặp đối tác trò chuyện [cite: 244]
| TC ID | Test Case | Input (Event) | Expected FE |
| :--- | :--- | :--- | :--- |
| [cite_start]FE25 [cite: 245] | [cite_start]Join queue thành công [cite: 245] [cite_start]| emit join_queue + language [cite: 245] | [cite_start]Hiện "Đang tìm kiếm..." [cite: 245] |
| [cite_start]FE26 [cite: 245] | [cite_start]Join khi chưa chọn language [cite: 245] [cite_start]| emit thiếu language [cite: 245] | [cite_start]Không cho join / báo lỗi [cite: 245] |
| [cite_start]FE27 [cite: 245] | [cite_start]Join lại khi đã trong queue [cite: 245] [cite_start]| emit join_queue lần 2 [cite: 245] | [cite_start]"Bạn đã trong hàng chờ..." [cite: 245] |
| [cite_start]FE28 [cite: 245] | [cite_start]Match thành công [cite: 245] [cite_start]| nhận match_found [cite: 245] | [cite_start]Chuyển sang màn chat [cite: 245] |
| [cite_start]FE29 [cite: 245] | [cite_start]Timeout queue [cite: 245] [cite_start]| nhận queue_timeout [cite: 245] | [cite_start]Hiện thông báo retry [cite: 245] |
| [cite_start]FE30 [cite: 245] | [cite_start]Partner rời phòng [cite: 245] [cite_start]| nhận partner_disconnected [cite: 245] | [cite_start]Hiện thông báo [cite: 245] |
| [cite_start]FE31 [cite: 245] | [cite_start]Leave queue [cite: 245] [cite_start]| emit leave_queue [cite: 245] | [cite_start]Rời hàng chờ [cite: 245] |

#### [cite_start]C. Kết bạn và đánh giá người dùng khác [cite: 246]
| TC ID | Test Case | Input (Action) | Expected FE |
| :--- | :--- | :--- | :--- |
| [cite_start]FE32 [cite: 247] | [cite_start]Gửi lời mời kết bạn [cite: 247] | [cite_start]Click "Add Friend" [cite: 247] | [cite_start]Hiện trạng thái “Đã gửi” [cite: 247] |
| [cite_start]FE33 [cite: 247] | [cite_start]Gửi lời mời khi đã gửi trước đó [cite: 247] | [cite_start]Click lại [cite: 247] | [cite_start]Báo “Đã gửi trước đó” [cite: 247] |
| [cite_start]FE34 [cite: 247] | [cite_start]Chấp nhận lời mời [cite: 247] | [cite_start]Click “Accept” [cite: 247] | [cite_start]Cập nhật thành bạn bè [cite: 247] |
| [cite_start]FE35 [cite: 247] | [cite_start]Từ chối lời mời [cite: 247] | [cite_start]Click “Decline” [cite: 247] | [cite_start]Lời mời biến mất [cite: 247] |
| [cite_start]FE36 [cite: 247] | [cite_start]Xóa bạn bè [cite: 247] | [cite_start]Click “Remove Friend” [cite: 247] | [cite_start]Xóa khỏi danh sách [cite: 247] |
| [cite_start]FE37 [cite: 247] | [cite_start]Xem danh sách bạn [cite: 247] | [cite_start]Mở tab Friend List [cite: 247] | [cite_start]Hiển thị danh sách [cite: 247] |
| [cite_start]FE38 [cite: 247] | [cite_start]Đánh giá user [cite: 247] | [cite_start]Submit review [cite: 247] | [cite_start]Hiện review [cite: 247] |
| [cite_start]FE39 [cite: 247] | [cite_start]Report user [cite: 247] | [cite_start]Submit report + lý do [cite: 247] | [cite_start]Hiện thông báo thành công [cite: 247] |
| [cite_start]FE40 [cite: 247] | [cite_start]Report thiếu lý do [cite: 247] | [cite_start]Submit rỗng [cite: 247] | [cite_start]Báo lỗi validation [cite: 247] |

#### [cite_start]D. Quản trị viên (Admin) [cite: 248]
| TC ID | Test Case | Input / Action | Expected FE |
| :--- | :--- | :--- | :--- |
| [cite_start]FE41 [cite: 249] | [cite_start]Thêm từ khóa nhạy cảm [cite: 249] | [cite_start]Click Add + nhập keyword [cite: 249] | [cite_start]Hiện keyword trong blacklist [cite: 249] |
| [cite_start]FE42 [cite: 249] | [cite_start]Xóa từ khóa [cite: 249] | [cite_start]Click Delete [cite: 249] | [cite_start]Keyword biến mất [cite: 249] |
| [cite_start]FE43 [cite: 249] | [cite_start]Thêm keyword rỗng [cite: 249] | [cite_start]Submit rỗng [cite: 249] | [cite_start]Báo lỗi validation [cite: 249] |
| [cite_start]FE44 [cite: 249] | [cite_start]Bật ngôn ngữ tìm kiếm [cite: 249] | [cite_start]Toggle ON [cite: 249] | [cite_start]Hiện trạng thái active [cite: 249] |
| [cite_start]FE45 [cite: 249] | [cite_start]Tắt ngôn ngữ tìm kiếm [cite: 249] | [cite_start]Toggle OFF [cite: 249] | [cite_start]Hiện trạng thái inactive [cite: 249] |
| [cite_start]FE46 [cite: 249] | [cite_start]Đọc báo cáo user [cite: 249] | [cite_start]Click report item [cite: 249] | [cite_start]Hiện chi tiết tố cáo [cite: 249] |
| [cite_start]FE47 [cite: 249] | [cite_start]Ra quyết định xử lý [cite: 249] | [cite_start]Click approve / reject [cite: 249] | [cite_start]Cập nhật trạng thái [cite: 249] |
| [cite_start]FE48 [cite: 249] | [cite_start]Khóa tài khoản [cite: 249] | [cite_start]Click Suspend [cite: 249] | [cite_start]Hiện status suspended [cite: 249] |
| [cite_start]FE49 [cite: 249] | [cite_start]Mở khóa tài khoản [cite: 249] | [cite_start]Click Activate [cite: 249] | [cite_start]Hiện status active [cite: 249] |

### 4.3.4 Kiểm thử Hộp trắng (White-box Testing)
[cite_start]Áp dụng cho Unit Testing và phân tích tĩnh mã nguồn ở tầng nghiệp vụ (Backend Server)[cite: 251]:
* [cite_start]**Statement Coverage:** Đảm bảo mỗi câu lệnh trong các Service được thực thi ít nhất một lần[cite: 252].
* [cite_start]**Branch Coverage:** Kiểm thử toàn bộ các nhánh rẽ phát sinh trong code[cite: 253].
* [cite_start]**Condition Coverage:** Kiểm thử mọi tổ hợp điều kiện logic có thể xảy ra[cite: 254].
* [cite_start]**Độ phức tạp Cyclomatic (McCabe):** Tính theo công thức $V(G) = E - N + 2P$[cite: 255].

#### [cite_start]A. Đăng nhập [cite: 256]
| TC ID | Test Case | Điều kiện | HTTP Status | Response |
| :--- | :--- | :--- | :--- | :--- |
| [cite_start]BE01 [cite: 257] | [cite_start]Đăng nhập thành công [cite: 257] | [cite_start]User tồn tại, password đúng, account active [cite: 257] | [cite_start]200 [cite: 257] | [cite_start]Token [cite: 257] |
| [cite_start]BE02 [cite: 257] | [cite_start]Email không tồn tại [cite: 257] | [cite_start]`User.findOne` $\rightarrow$ null [cite: 257] | [cite_start]401 [cite: 257] | [cite_start]"Email hoặc mật khẩu không chính xác" [cite: 257] |
| [cite_start]BE03 [cite: 257] | [cite_start]Sai mật khẩu [cite: 257] | [cite_start]`bcrypt.compare` $\rightarrow$ false [cite: 257] | [cite_start]401 [cite: 257] | [cite_start]"Email hoặc mật khẩu không chính xác" [cite: 257] |
| [cite_start]BE04 [cite: 257] | [cite_start]User không có password (Google) [cite: 257] | [cite_start]`user.password = null` [cite: 257] | [cite_start]401 [cite: 257] | [cite_start]"Email hoặc mật khẩu không chính xác" [cite: 257] |
| [cite_start]BE05 [cite: 257] | [cite_start]Tài khoản bị khóa [cite: 257] | [cite_start]`statusAccount = 'banned'` [cite: 257] | [cite_start]403 [cite: 257] | [cite_start]"Tài khoản đã bị khóa" [cite: 257] |
| [cite_start]BE06 [cite: 257] | [cite_start]Lỗi server/DB [cite: 257] | [cite_start]Exception xảy ra [cite: 257] | [cite_start]500 [cite: 257] | [cite_start]"Lỗi server khi đăng nhập" [cite: 257] |

#### [cite_start]B. Lấy lại mật khẩu [cite: 258]
##### [cite_start]Luồng 1: Gửi OTP [cite: 259]
| TC ID | Test Case | Điều kiện | Expected | Nhánh code |
| :--- | :--- | :--- | :--- | :--- |
| [cite_start]BE07 [cite: 260] | [cite_start]Gửi OTP thành công [cite: 260] [cite_start]| email tồn tại [cite: 260] [cite_start]| gửi OTP [cite: 260] [cite_start]| happy path [cite: 260] |
| [cite_start]BE08 [cite: 260] | [cite_start]Email không tồn tại [cite: 260] [cite_start]| user = null [cite: 260] [cite_start]| trả lỗi [cite: 260] [cite_start]| not found [cite: 260] |
| [cite_start]BE09 [cite: 260] | [cite_start]Email không hợp lệ [cite: 260] [cite_start]| invalid format [cite: 260] [cite_start]| reject [cite: 260] [cite_start]| validation [cite: 260] |
| [cite_start]BE10 [cite: 260] | [cite_start]Gửi OTP nhiều lần [cite: 260] [cite_start]| spam request [cite: 260] [cite_start]| giới hạn [cite: 260] [cite_start]| rate limit [cite: 260] |
| [cite_start]BE11 [cite: 260] | [cite_start]Lỗi gửi mail [cite: 260] [cite_start]| mail fail [cite: 260] | [cite_start]500 [cite: 260] [cite_start]| catch [cite: 260] |

##### [cite_start]Luồng 2: Xác thực OTP [cite: 261]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE12 [cite: 262] | [cite_start]OTP đúng [cite: 262] [cite_start]| match OTP [cite: 262] [cite_start]| verify success [cite: 262] |
| [cite_start]BE13 [cite: 262] | [cite_start]OTP sai [cite: 262] [cite_start]| không match [cite: 262] [cite_start]| reject [cite: 262] |
| [cite_start]BE14 [cite: 262] | [cite_start]OTP hết hạn [cite: 262] [cite_start]| expired [cite: 262] [cite_start]| reject [cite: 262] |
| [cite_start]BE15 [cite: 262] | [cite_start]OTP đã dùng [cite: 262] [cite_start]| reused [cite: 262] [cite_start]| reject [cite: 262] |
| [cite_start]BE16 [cite: 262] | [cite_start]Không có OTP [cite: 262] [cite_start]| null [cite: 262] [cite_start]| reject [cite: 262] |

##### [cite_start]Luồng 3: Reset Password [cite: 263]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE17 [cite: 264] | [cite_start]Reset thành công [cite: 264] | [cite_start]OTP hợp lệ [cite: 264] [cite_start]| update password [cite: 264] |
| [cite_start]BE18 [cite: 264] | [cite_start]Password không hợp lệ [cite: 264] | [cite_start]< 8 ký tự hoặc thiếu kí tự đặc biệt/in hoa [cite: 264] [cite_start]| reject [cite: 264] |
| [cite_start]BE19 [cite: 264] | [cite_start]User không tồn tại [cite: 264] [cite_start]| invalid email [cite: 264] [cite_start]| error [cite: 264] |
| [cite_start]BE20 [cite: 264] | [cite_start]Lỗi DB [cite: 264] [cite_start]| exception [cite: 264] | [cite_start]500 [cite: 264] |

#### [cite_start]C. Ghép cặp đối tác trò chuyện [cite: 265]
##### [cite_start]Luồng 1: Join Queue Logic [cite: 266]
| TC ID | Test Case | Điều kiện | Expected | Nhánh code |
| :--- | :--- | :--- | :--- | :--- |
| [cite_start]BE21 [cite: 267] | [cite_start]User đang in-call [cite: 267] [cite_start]| user.status = 'in-call' [cite: 267] [cite_start]| emit error [cite: 267] | [cite_start]`if (user?.status === 'in-call')` [cite: 267] |
| [cite_start]BE22 [cite: 267] | [cite_start]User đã trong queue [cite: 267] [cite_start]| redis.lpos != null [cite: 267] [cite_start]| emit waiting_status [cite: 267] [cite_start]| alreadyInQueue [cite: 267] |
| [cite_start]BE23 [cite: 267] | [cite_start]Không có partner [cite: 267] [cite_start]| queue rỗng [cite: 267] [cite_start]| push vào queue [cite: 267] [cite_start]| else branch [cite: 267] |
| [cite_start]BE24 [cite: 267] | [cite_start]Có partner hợp lệ [cite: 267] [cite_start]| redis.eval trả partnerId [cite: 267] [cite_start]| match thành công [cite: 267] | [cite_start]`if (partnerId)` [cite: 267] |
| [cite_start]BE25 [cite: 267] | [cite_start]Partner = chính mình [cite: 267] [cite_start]| lua trả nil [cite: 267] [cite_start]| không match [cite: 267] [cite_start]| lua self-check [cite: 267] |
| [cite_start]BE26 [cite: 267] | [cite_start]Redis lỗi [cite: 267] [cite_start]| throw error [cite: 267] [cite_start]| emit error [cite: 267] [cite_start]| catch block [cite: 267] |

##### [cite_start]Luồng 2: Matching Flow [cite: 268]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE27 [cite: 269] | [cite_start]Tạo session thành công [cite: 269] [cite_start]| partnerId tồn tại [cite: 269] [cite_start]| tạo MatchSession [cite: 269] |
| [cite_start]BE28 [cite: 269] | [cite_start]Update user status [cite: 269] [cite_start]| match thành công [cite: 269] [cite_start]| status = in-call [cite: 269] |
| [cite_start]BE29 [cite: 269] | [cite_start]Join room [cite: 269] [cite_start]| có socketId [cite: 269] [cite_start]| join room [cite: 269] |
| [cite_start]BE30 [cite: 269] | [cite_start]Partner socket không tồn tại [cite: 269] [cite_start]| redis.get null [cite: 269] [cite_start]| vẫn match 1 phía [cite: 269] |

##### [cite_start]Luồng 3: Queue Timeout [cite: 270]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE31 [cite: 271] | [cite_start]Timeout xảy ra [cite: 271] [cite_start]| sau 60s [cite: 271] [cite_start]| emit queue_timeout [cite: 271] |
| [cite_start]BE32 [cite: 271] | [cite_start]User vẫn trong queue [cite: 271] [cite_start]| redis.lpos != null [cite: 271] [cite_start]| remove khỏi queue [cite: 271] |
| [cite_start]BE33 [cite: 271] | [cite_start]User đã match trước timeout [cite: 271] [cite_start]| queueTimeout cleared [cite: 271] [cite_start]| không trigger [cite: 271] |

##### [cite_start]Luồng 4: Leave / Disconnect [cite: 272]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE34 [cite: 273] | [cite_start]Leave queue khi đang chờ [cite: 273] [cite_start]| emit leave_queue [cite: 273] [cite_start]| remove queue [cite: 273] |
| [cite_start]BE35 [cite: 273] | [cite_start]Disconnect khi đang chat [cite: 273] [cite_start]| có session [cite: 273] [cite_start]| update session completed [cite: 273] |
| [cite_start]BE36 [cite: 273] | [cite_start]Notify partner [cite: 273] [cite_start]| partner tồn tại [cite: 273] [cite_start]| emit partner_disconnected [cite: 273] |
| [cite_start]BE37 [cite: 273] | [cite_start]Partner không có socket [cite: 273] [cite_start]| null socket [cite: 273] [cite_start]| không crash [cite: 273] |
| [cite_start]BE38 [cite: 273] | [cite_start]Cleanup user [cite: 273] [cite_start]| luôn chạy [cite: 273] [cite_start]| status = online [cite: 273] |

#### D. Kết bạn và đánh giá người dùng khác
##### [cite_start]Luồng 1: Friend Request [cite: 274]
| TC ID | Test Case | Điều kiện | Expected | Nhánh code |
| :--- | :--- | :--- | :--- | :--- |
| [cite_start]BE39 [cite: 275] | [cite_start]Gửi lời mời thành công [cite: 275] [cite_start]| chưa là bạn [cite: 275] [cite_start]| tạo request [cite: 275] [cite_start]| create request [cite: 275] |
| [cite_start]BE40 [cite: 275] | [cite_start]Gửi khi đã là bạn [cite: 275] | [cite_start]đã là friend [cite: 275] [cite_start]| reject [cite: 275] [cite_start]| check existing [cite: 275] |
| [cite_start]BE41 [cite: 275] | [cite_start]Gửi trùng request [cite: 275] | [cite_start]đã gửi trước [cite: 275] [cite_start]| reject [cite: 275] [cite_start]| duplicate [cite: 275] |
| [cite_start]BE42 [cite: 275] | [cite_start]Accept lời mời [cite: 275] [cite_start]| request tồn tại [cite: 275] [cite_start]| tạo friendship [cite: 275] [cite_start]| accept branch [cite: 275] |
| [cite_start]BE43 [cite: 275] | [cite_start]Decline lời mời [cite: 275] [cite_start]| request tồn tại [cite: 275] [cite_start]| xóa request [cite: 275] [cite_start]| decline branch [cite: 275] |
| [cite_start]BE44 [cite: 275] | [cite_start]Accept request không tồn tại [cite: 275] [cite_start]| null [cite: 275] [cite_start]| error [cite: 275] [cite_start]| not found [cite: 275] |

##### [cite_start]Luồng 2: Friend List [cite: 276]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE45 [cite: 277] | [cite_start]Lấy danh sách bạn [cite: 277] [cite_start]| user có bạn [cite: 277] [cite_start]| trả list [cite: 277] |
| [cite_start]BE46 [cite: 277] | [cite_start]Không có bạn [cite: 277] [cite_start]| empty [cite: 277] [cite_start]| trả rỗng [cite: 277] |

##### [cite_start]Luồng 3: Review [cite: 278]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE47 [cite: 279] | [cite_start]Submit review hợp lệ [cite: 279] | [cite_start]đủ dữ liệu [cite: 279] [cite_start]| lưu DB [cite: 279] |
| [cite_start]BE48 [cite: 279] | [cite_start]Review thiếu field [cite: 279] [cite_start]| thiếu rating/text [cite: 279] [cite_start]| reject [cite: 279] |
| [cite_start]BE49 [cite: 279] | [cite_start]Review trùng [cite: 279] | [cite_start]đã review trước [cite: 279] [cite_start]| reject [cite: 279] |

##### [cite_start]Luồng 4: Report [cite: 280]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE50 [cite: 281] | [cite_start]Report hợp lệ [cite: 281] [cite_start]| có lý do [cite: 281] [cite_start]| lưu report [cite: 281] |
| [cite_start]BE51 [cite: 281] | [cite_start]Report thiếu lý do [cite: 281] [cite_start]| reason null [cite: 281] [cite_start]| reject [cite: 281] |
| [cite_start]BE52 [cite: 281] | [cite_start]Report user không tồn tại [cite: 281] [cite_start]| invalid id [cite: 281] [cite_start]| error [cite: 281] |

##### [cite_start]Luồng 5: Remove Friend [cite: 282]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE53 [cite: 283] | [cite_start]Xóa bạn [cite: 283] [cite_start]| tồn tại friendship [cite: 283] [cite_start]| remove [cite: 283] |
| [cite_start]BE54 [cite: 283] | [cite_start]Xóa user không phải bạn [cite: 283] [cite_start]| không tồn tại [cite: 283] [cite_start]| error [cite: 283] |

#### [cite_start]E. Quản trị hệ thống [cite: 284]
##### [cite_start]Luồng 1: Quản lý Bộ từ điển đen [cite: 285]
| TC ID | Test Case | Điều kiện | Expected | Nhánh code |
| :--- | :--- | :--- | :--- | :--- |
| [cite_start]BE55 [cite: 286] | [cite_start]Thêm keyword hợp lệ [cite: 286] [cite_start]| keyword mới [cite: 286] [cite_start]| insert DB [cite: 286] [cite_start]| add branch [cite: 286] |
| [cite_start]BE56 [cite: 286] | [cite_start]Thêm keyword trùng [cite: 286] | [cite_start]đã tồn tại [cite: 286] [cite_start]| reject [cite: 286] [cite_start]| duplicate check [cite: 286] |
| [cite_start]BE57 [cite: 286] | [cite_start]Xóa keyword tồn tại [cite: 286] [cite_start]| keyword có trong DB [cite: 286] [cite_start]| delete success [cite: 286] [cite_start]| delete branch [cite: 286] |
| [cite_start]BE58 [cite: 286] | [cite_start]Xóa keyword không tồn tại [cite: 286] [cite_start]| null [cite: 286] [cite_start]| error [cite: 286] [cite_start]| not found [cite: 286] |
| [cite_start]BE59 [cite: 286] | [cite_start]Lỗi DB [cite: 286] [cite_start]| throw exception [cite: 286] | [cite_start]500 [cite: 286] [cite_start]| catch [cite: 286] |

##### [cite_start]Luồng 2: Quản lý danh mục ngôn ngữ [cite: 287]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE60 [cite: 288] | [cite_start]Bật ngôn ngữ [cite: 288] [cite_start]| language tồn tại [cite: 288] [cite_start]| status = active [cite: 288] |
| [cite_start]BE61 [cite: 288] | [cite_start]Tắt ngôn ngữ [cite: 288] [cite_start]| language tồn tại [cite: 288] [cite_start]| status = inactive [cite: 288] |
| [cite_start]BE62 [cite: 288] | [cite_start]Language không tồn tại [cite: 288] [cite_start]| invalid id [cite: 288] [cite_start]| error [cite: 288] |

##### [cite_start]Luồng 3: Đọc tố cáo & xử lý vi phạm [cite: 289]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE63 [cite: 290] | [cite_start]Lấy report list [cite: 290] [cite_start]| có dữ liệu [cite: 290] [cite_start]| trả danh sách [cite: 290] |
| [cite_start]BE64 [cite: 290] | [cite_start]Không có report [cite: 290] [cite_start]| empty [cite: 290] [cite_start]| trả rỗng [cite: 290] |
| [cite_start]BE65 [cite: 290] | [cite_start]Xử lý report hợp lệ [cite: 290] [cite_start]| chọn action [cite: 290] [cite_start]| update report [cite: 290] |
| [cite_start]BE66 [cite: 290] | [cite_start]Report không tồn tại [cite: 290] [cite_start]| invalid id [cite: 290] [cite_start]| error [cite: 290] |

##### [cite_start]Luồng 4: Quản lý người dùng [cite: 291]
| TC ID | Test Case | Điều kiện | Expected |
| :--- | :--- | :--- | :--- |
| [cite_start]BE67 [cite: 292] | [cite_start]Khóa tài khoản [cite: 292] [cite_start]| user active [cite: 292] [cite_start]| status = banned [cite: 292] |
| [cite_start]BE68 [cite: 292] | [cite_start]Tạm ngưng tài khoản [cite: 292] [cite_start]| user active [cite: 292] [cite_start]| status = suspended [cite: 292] |
| [cite_start]BE69 [cite: 292] | [cite_start]Kích hoạt lại [cite: 292] [cite_start]| user suspended [cite: 292] [cite_start]| status = active [cite: 292] |
| [cite_start]BE70 [cite: 292] | [cite_start]User không tồn tại [cite: 292] [cite_start]| invalid id [cite: 292] [cite_start]| error [cite: 292] |
| [cite_start]BE71 [cite: 292] | [cite_start]Không đủ quyền admin [cite: 292] [cite_start]| role != admin [cite: 292] | [cite_start]403 [cite: 292] |

---

## 4.3.5 Bổ sung Test Case cho WebRTC, Realtime và các luồng nghiệp vụ mới
> [cite_start]**Ghi chú:** Các test case dưới đây thuộc nhóm đề xuất bổ sung để gia tăng độ bao phủ đối với các chức năng realtime, video call, notification, popup chat, streak và các nghiệp vụ nâng cao của admin[cite: 294]. [cite_start]Nhóm này không làm thay đổi số liệu pass/fail đã thống kê của hệ thống cốt lõi[cite: 295].

#### [cite_start]A. FE - WebRTC / Video Call [cite: 296]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE50 [cite: 297] | [cite_start]Cho phép camera/mic khi vào MeetingPage [cite: 297] | [cite_start]Local video hiển thị, permission = granted [cite: 297] |
| [cite_start]FE51 [cite: 297] | [cite_start]Từ chối camera/mic [cite: 297] | [cite_start]Hiển thị cảnh báo quyền bị từ chối [cite: 297] |
| [cite_start]FE52 [cite: 297] | [cite_start]Camera lỗi nhưng mic còn dùng được [cite: 297] | [cite_start]Fallback audio-only, không crash [cite: 297] |
| [cite_start]FE53 [cite: 297] | [cite_start]Caller tạo offer WebRTC [cite: 297] | [cite_start]Socket emit webrtc_offer [cite: 297] |
| [cite_start]FE54 [cite: 297] | [cite_start]Callee nhận offer và gửi answer [cite: 297] | [cite_start]Socket emit webrtc_answer [cite: 297] |
| [cite_start]FE55 [cite: 297] | [cite_start]ICE candidate đến trước remote description [cite: 297] | [cite_start]Candidate được queue và xử lý sau [cite: 297] |
| [cite_start]FE56 [cite: 297] | [cite_start]Toggle mute [cite: 297] | [cite_start]Mic track disabled/enabled, UI đổi trạng thái [cite: 297] |
| [cite_start]FE57 [cite: 297] | [cite_start]Toggle camera [cite: 297] | [cite_start]Video track disabled/enabled, UI đổi trạng thái [cite: 297] |
| [cite_start]FE58 [cite: 297] | [cite_start]End call [cite: 297] | [cite_start]Cleanup stream/peer connection, chuyển Review/CallEnded [cite: 297] |
| [cite_start]FE59 [cite: 297] | [cite_start]Partner disconnect [cite: 297] | [cite_start]Nhận partner_disconnected, tự kết thúc call [cite: 297] |

#### [cite_start]B. FE - Direct Call [cite: 298]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE60 [cite: 299] | [cite_start]Gọi trực tiếp bạn bè online [cite: 299] | [cite_start]Người nhận thấy incoming call modal [cite: 299] |
| [cite_start]FE61 [cite: 299] | [cite_start]Người nhận accept direct call [cite: 299] | [cite_start]Cả hai vào MeetingPage [cite: 299] |
| [cite_start]FE62 [cite: 299] | [cite_start]Người nhận reject direct call [cite: 299] | [cite_start]Caller thấy trạng thái bị từ chối [cite: 299] |
| [cite_start]FE63 [cite: 299] | [cite_start]Direct call timeout/no response [cite: 299] | [cite_start]Caller thấy thông báo timeout [cite: 299] |
| [cite_start]FE64 [cite: 299] | [cite_start]Gọi khi bạn offline [cite: 299] | [cite_start]Không cho gọi hoặc báo lỗi phù hợp [cite: 299] |

#### [cite_start]C. FE - Notification Realtime [cite: 300]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE65 [cite: 301] | [cite_start]Nhận new_notification [cite: 301] | [cite_start]Dropdown thêm notification mới, badge tăng [cite: 301] |
| [cite_start]FE66 [cite: 301] | [cite_start]Mark read 1 notification [cite: 301] | [cite_start]Notification chuyển read, unread count giảm 1 [cite: 301] |
| [cite_start]FE67 [cite: 301] | [cite_start]Mark all read [cite: 301] | [cite_start]Tất cả read, unread count = 0 [cite: 301] |
| [cite_start]FE68 [cite: 301] | [cite_start]Friend request notification [cite: 301] | [cite_start]Hiển thị Accept/Reject [cite: 301] |
| [cite_start]FE69 [cite: 301] | [cite_start]Accept friend request từ notification [cite: 301] | [cite_start]Friend list cập nhật [cite: 301] |
| [cite_start]FE70 [cite: 301] | [cite_start]Reject friend request từ notification [cite: 301] | [cite_start]Notification chuyển trạng thái rejected [cite: 301] |
| [cite_start]FE71 [cite: 301] | [cite_start]Nhận friend_accepted notification [cite: 301] | [cite_start]Friend list refetch realtime [cite: 301] |
| [cite_start]FE72 [cite: 301] | [cite_start]Nhận friendship_ended notification [cite: 301] | [cite_start]Friend bị xóa khỏi list realtime [cite: 301] |
| [cite_start]FE73 [cite: 301] | [cite_start]Reconnect socket [cite: 301] | [cite_start]Không duplicate notification listener [cite: 301] |

#### [cite_start]D. FE - Popup Chat / Messages [cite: 302]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE74 [cite: 303] | [cite_start]Tin nhắn đầu tiên từ người khác [cite: 303] | [cite_start]Popup tự mở và hiển thị tin đầu tiên [cite: 303] |
| [cite_start]FE75 [cite: 303] | [cite_start]Popup đang mở nhận message mới [cite: 303] | [cite_start]Message append vào đúng popup [cite: 303] |
| [cite_start]FE76 [cite: 303] | [cite_start]Nhận message trùng _id [cite: 303] | [cite_start]Không hiển thị duplicate [cite: 303] |
| [cite_start]FE77 [cite: 303] | [cite_start]Gửi text khi socket connected [cite: 303] | [cite_start]Message hiển thị optimistic và được confirm [cite: 303] |
| [cite_start]FE78 [cite: 303] | [cite_start]Gửi text khi socket offline [cite: 303] | [cite_start]Message hiện failed [cite: 303] |
| [cite_start]FE79 [cite: 303] | [cite_start]Retry message failed [cite: 303] | [cite_start]Gửi lại thành công hoặc vẫn failed đúng trạng thái [cite: 303] |
| [cite_start]FE80 [cite: 303] | [cite_start]Upload ảnh thành công [cite: 303] | [cite_start]Ảnh hiển thị sent [cite: 303] |
| [cite_start]FE81 [cite: 303] | [cite_start]Upload ảnh thất bại [cite: 303] | [cite_start]Ảnh hiển thị failed [cite: 303] |
| [cite_start]FE82 [cite: 303] | [cite_start]Chat lần đầu chưa có conversationId [cite: 303] [cite_start]| conversationId được cập nhật sau message đầu [cite: 303] |

#### [cite_start]E. FE - Review / Streak [cite: 304]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE83 [cite: 305] | [cite_start]Submit review hợp lệ [cite: 305] | [cite_start]Gửi review, fetch /api/users/me [cite: 305] |
| [cite_start]FE84 [cite: 305] | [cite_start]Submit review thiếu rating [cite: 305] | [cite_start]Disable submit hoặc không gửi [cite: 305] |
| [cite_start]FE85 [cite: 305] | [cite_start]Submit review fail [cite: 305] | [cite_start]Hiển thị lỗi [cite: 305] |
| [cite_start]FE86 [cite: 305] | [cite_start]Nhận streak_update sau call [cite: 305] | [cite_start]ReviewPage show StreakCelebration [cite: 305] |
| [cite_start]FE87 [cite: 305] | [cite_start]Không nhận streak_update [cite: 305] | [cite_start]Không show celebration [cite: 305] |
| [cite_start]FE88 [cite: 305] | [cite_start]Skip review nhưng có streak_update [cite: 305] | [cite_start]Vẫn show celebration [cite: 305] |
| [cite_start]FE89 [cite: 305] | [cite_start]Skip review không có streak_update [cite: 305] | [cite_start]Về Home [cite: 305] |
| [cite_start]FE90 [cite: 305] [cite_start]| learningCalendar dạng array [cite: 305] | [cite_start]Normalize đúng và render calendar [cite: 305] |
| [cite_start]FE91 [cite: 305] [cite_start]| learningCalendar dạng object [cite: 305] | [cite_start]Render đúng calendar [cite: 305] |
| [cite_start]FE92 [cite: 305] | [cite_start]Streak Monday slide [cite: 305] | [cite_start]Animation chuyển tuần đúng [cite: 305] |

#### [cite_start]F. FE - Auth / Route Guard [cite: 306]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE93 [cite: 307] | [cite_start]Chưa login vào /home [cite: 307] | [cite_start]Redirect login [cite: 307] |
| [cite_start]FE94 [cite: 307] | [cite_start]User thường vào /admin [cite: 307] | [cite_start]Logout/redirect đúng [cite: 307] |
| [cite_start]FE95 [cite: 307] | [cite_start]Admin vào route user [cite: 307] | [cite_start]Bị chặn theo role [cite: 307] |
| [cite_start]FE96 [cite: 307] | [cite_start]Token còn hạn khi reload [cite: 307] | [cite_start]AppLoader verify xong vào app [cite: 307] |
| [cite_start]FE97 [cite: 307] | [cite_start]Token hết hạn, refresh thành công [cite: 307] | [cite_start]Request tiếp tục [cite: 307] |
| [cite_start]FE98 [cite: 307] | [cite_start]Refresh token fail [cite: 307] | [cite_start]Logout và về login [cite: 307] |
| [cite_start]FE99 [cite: 307] | [cite_start]Google callback thành công [cite: 307] | [cite_start]Lưu token và vào home/admin đúng role [cite: 307] |
| [cite_start]FE100 [cite: 307] | [cite_start]Google callback lỗi [cite: 307] | [cite_start]Hiển thị lỗi/redirect login [cite: 307] |

#### [cite_start]G. FE - Profile / Settings [cite: 308]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE101 [cite: 309] | [cite_start]Upload avatar hợp lệ [cite: 309] | [cite_start]Avatar cập nhật [cite: 309] |
| [cite_start]FE102 [cite: 309] | [cite_start]Upload file không phải ảnh [cite: 309] | [cite_start]Báo lỗi [cite: 309] |
| [cite_start]FE103 [cite: 309] | [cite_start]Upload ảnh > 2MB [cite: 309] | [cite_start]Báo lỗi [cite: 309] |
| [cite_start]FE104 [cite: 309] | [cite_start]Upload avatar API fail [cite: 309] | [cite_start]Báo lỗi [cite: 309] |
| [cite_start]FE105 [cite: 309] | [cite_start]Đổi theme [cite: 309] | [cite_start]UI đổi theme và sync localStorage/server [cite: 309] |
| [cite_start]FE106 [cite: 309] | [cite_start]Đổi ngôn ngữ UI [cite: 309] | [cite_start]Text/validation đổi theo locale [cite: 309] |
| [cite_start]FE107 [cite: 309] | [cite_start]Đổi mật khẩu thành công [cite: 309] | [cite_start]Toast success [cite: 309] |
| [cite_start]FE108 [cite: 309] | [cite_start]Đổi mật khẩu sai current password [cite: 309] | [cite_start]Báo lỗi [cite: 309] |
| [cite_start]FE109 [cite: 309] | [cite_start]Update profile hợp lệ [cite: 309] | [cite_start]Lưu profile thành công [cite: 309] |

#### [cite_start]H. FE - Admin Hiện Tại [cite: 310]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]FE110 [cite: 311] | [cite_start]Admin login thành công [cite: 311] | [cite_start]Vào dashboard [cite: 311] |
| [cite_start]FE111 [cite: 311] | [cite_start]Tài khoản user login admin [cite: 311] | [cite_start]Báo forbidden [cite: 311] |
| [cite_start]FE112 [cite: 311] | [cite_start]Load dashboard stats [cite: 311] | [cite_start]Hiển thị số liệu [cite: 311] |
| [cite_start]FE113 [cite: 311] | [cite_start]Load users list [cite: 311] | [cite_start]Hiển thị bảng users [cite: 311] |
| [cite_start]FE114 [cite: 311] | [cite_start]Ban user 3/7/30 ngày [cite: 311] | [cite_start]User chuyển banned đúng duration [cite: 311] |
| [cite_start]FE115 [cite: 311] | [cite_start]Ban permanent [cite: 311] | [cite_start]User bị khóa vĩnh viễn [cite: 311] |
| [cite_start]FE116 [cite: 311] | [cite_start]Delete user [cite: 311] | [cite_start]User bị xóa khỏi bảng [cite: 311] |
| [cite_start]FE117 [cite: 311] | [cite_start]Load reports [cite: 311] | [cite_start]Hiển thị danh sách report [cite: 311] |
| [cite_start]FE118 [cite: 311] | [cite_start]Resolve report không ban [cite: 311] | [cite_start]Report chuyển resolved [cite: 311] |
| [cite_start]FE119 [cite: 311] | [cite_start]Resolve report kèm ban [cite: 311] | [cite_start]Report resolved, user banned [cite: 311] |
| [cite_start]FE120 [cite: 311] | [cite_start]Dismiss report [cite: 311] | [cite_start]Report chuyển dismissed [cite: 311] |
| [cite_start]FE121 [cite: 311] | [cite_start]Load appeals [cite: 311] | [cite_start]Hiển thị danh sách appeals [cite: 311] |
| [cite_start]FE122 [cite: 311] | [cite_start]Approve appeal [cite: 311] | [cite_start]Appeal approved, user unbanned [cite: 311] |
| [cite_start]FE123 [cite: 311] | [cite_start]Reject appeal [cite: 311] | [cite_start]Appeal rejected [cite: 311] |
| [cite_start]FE124 [cite: 311] | [cite_start]API admin fail [cite: 311] | [cite_start]Hiển thị error/retry [cite: 311] |

#### [cite_start]I. BE - WebRTC / Socket Signaling [cite: 312]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]BE72 [cite: 313] [cite_start]| webrtc_offer có sessionId [cite: 313] | [cite_start]Forward tới peer trong room [cite: 313] |
| [cite_start]BE73 [cite: 313] [cite_start]| webrtc_answer có sessionId [cite: 313] | [cite_start]Forward tới caller [cite: 313] |
| [cite_start]BE74 [cite: 313] [cite_start]| webrtc_ice_candidate có sessionId [cite: 313] | [cite_start]Forward tới peer [cite: 313] |
| [cite_start]BE75 [cite: 313] | [cite_start]Signal không có sessionId [cite: 313] | [cite_start]Không crash / xử lý tương thích [cite: 313] |
| [cite_start]BE76 [cite: 313] | [cite_start]Peer không trong room [cite: 313] | [cite_start]Không forward sai người [cite: 313] |
| [cite_start]BE77 [cite: 313] | [cite_start]Disconnect trong call [cite: 313] | [cite_start]End session, notify partner [cite: 313] |

#### [cite_start]J. BE - Notification [cite: 314]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]BE78 [cite: 315] | [cite_start]Tạo notification friend_request [cite: 315] | [cite_start]Lưu DB và emit new_notification [cite: 315] |
| [cite_start]BE79 [cite: 315] | [cite_start]Mark read 1 notification [cite: 315] | [cite_start]Chỉ notification đó isRead=true [cite: 315] |
| [cite_start]BE80 [cite: 315] | [cite_start]Mark all read [cite: 315] | [cite_start]Tất cả notification unread thành read [cite: 315] |
| [cite_start]BE81 [cite: 315] | [cite_start]Count unread [cite: 315] | [cite_start]Trả số unread đúng [cite: 315] |
| [cite_start]BE82 [cite: 315] | [cite_start]Notification không thuộc user [cite: 315] | [cite_start]Không cho mark read [cite: 315] |
| [cite_start]BE83 [cite: 315] | [cite_start]Unfriend tạo friendship_ended [cite: 315] | [cite_start]Recipient nhận notification realtime [cite: 315] |

#### [cite_start]K. BE - Streak / Review [cite: 316]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]BE84 [cite: 317] | [cite_start]End call duration > 0 lần đầu trong ngày [cite: 317] | [cite_start]Update streak, emit streak_update [cite: 317] |
| [cite_start]BE85 [cite: 317] | [cite_start]End call lần 2 cùng ngày [cite: 317] | [cite_start]Không tăng streak lần nữa [cite: 317] |
| [cite_start]BE86 [cite: 317] | [cite_start]End call hôm sau liên tiếp [cite: 317] | [cite_start]Streak +1 [cite: 317] |
| [cite_start]BE87 [cite: 317] | [cite_start]End call sau khi mất chuỗi [cite: 317] | [cite_start]Streak reset = 1 [cite: 317] |
| [cite_start]BE88 [cite: 317] | [cite_start]End call duration = 0 [cite: 317] | [cite_start]Không update streak [cite: 317] |
| [cite_start]BE89 [cite: 317] | [cite_start]Submit review duplicate [cite: 317] | [cite_start]Reject [cite: 317] |
| [cite_start]BE90 [cite: 317] | [cite_start]Review không thuộc session user [cite: 317] | [cite_start]Reject [cite: 317] |

#### [cite_start]L. BE - Auth / Security [cite: 318]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]BE91 [cite: 319] | [cite_start]API thiếu token [cite: 319] | [cite_start]401 [cite: 319] |
| [cite_start]BE92 [cite: 319] | [cite_start]Token invalid [cite: 319] | [cite_start]401 [cite: 319] |
| [cite_start]BE93 [cite: 319] | [cite_start]Token expired refresh thành công [cite: 319] | [cite_start]Cấp access token mới [cite: 319] |
| [cite_start]BE94 [cite: 319] | [cite_start]Refresh token invalid [cite: 319] | [cite_start]401/logout [cite: 319] |
| [cite_start]BE95 [cite: 319] | [cite_start]User bị ban login [cite: 319] | [cite_start]403 [cite: 319] |
| [cite_start]BE96 [cite: 319] | [cite_start]OTP spam request [cite: 319] | [cite_start]Rate limit [cite: 319] |
| [cite_start]BE97 [cite: 319] | [cite_start]OTP reused [cite: 319] | [cite_start]Reject [cite: 319] |
| [cite_start]BE98 [cite: 319] | [cite_start]Password weak [cite: 319] | [cite_start]Reject [cite: 319] |

#### [cite_start]M. BE - Friend / Chat [cite: 320]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]BE99 [cite: 321] | [cite_start]Gửi friend request cho chính mình [cite: 321] | [cite_start]Reject [cite: 321] |
| [cite_start]BE100 [cite: 321] | [cite_start]Accept request không phải recipient [cite: 321] | [cite_start]403 [cite: 321] |
| [cite_start]BE101 [cite: 321] | [cite_start]Unfriend thành công [cite: 321] | [cite_start]Delete friendship, conversation non-permanent [cite: 321] |
| [cite_start]BE102 [cite: 321] | [cite_start]Unfriend người không phải bạn [cite: 321] | [cite_start]404/error [cite: 321] |
| [cite_start]BE103 [cite: 321] | [cite_start]Send message cho non-friend nếu không trong match [cite: 321] | [cite_start]Reject [cite: 321] |
| [cite_start]BE104 [cite: 321] | [cite_start]Send image quá size/sai MIME [cite: 321] | [cite_start]Reject [cite: 321] |
| [cite_start]BE105 [cite: 321] | [cite_start]Conversation đầu tiên [cite: 321] | [cite_start]Tạo conversationId đúng [cite: 321] |

#### [cite_start]N. BE - Admin / Appeals [cite: 322]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]BE106 [cite: 323] | [cite_start]Admin dashboard stats [cite: 323] | [cite_start]Trả đủ metrics [cite: 323] |
| [cite_start]BE107 [cite: 323] | [cite_start]Ban user duration [cite: 323] | [cite_start]Lưu banUntil đúng [cite: 323] |
| [cite_start]BE108 [cite: 323] | [cite_start]Ban permanent [cite: 323] | [cite_start]Không có expired date hoặc flag permanent [cite: 323] |
| [cite_start]BE109 [cite: 323] | [cite_start]Delete user không tồn tại [cite: 323] | [cite_start]404 [cite: 323] |
| [cite_start]BE110 [cite: 323] | [cite_start]Resolve report [cite: 323] | [cite_start]Update status + admin notes [cite: 323] |
| [cite_start]BE111 [cite: 323] | [cite_start]Resolve report kèm ban [cite: 323] | [cite_start]User bị ban [cite: 323] |
| [cite_start]BE112 [cite: 323] | [cite_start]Approve appeal [cite: 323] | [cite_start]User unbanned, appeal approved [cite: 323] |
| [cite_start]BE113 [cite: 323] | [cite_start]Reject appeal [cite: 323] | [cite_start]Appeal rejected [cite: 323] |
| [cite_start]BE114 [cite: 323] | [cite_start]User role gọi admin API [cite: 323] | [cite_start]403 [cite: 323] |

---

## [cite_start]4.3.6 Bổ sung Test Case End-to-End (E2E) cho luồng nghiệp vụ chính [cite: 324]
| TC ID | Test Case | Expected |
| :--- | :--- | :--- |
| [cite_start]E2E01 [cite: 325] | [cite_start]Register $\rightarrow$ login $\rightarrow$ home [cite: 325] | [cite_start]User vào home thành công [cite: 325] |
| [cite_start]E2E02 [cite: 325] | [cite_start]Forgot password full flow [cite: 325] | [cite_start]Reset password và login bằng password mới [cite: 325] |
| [cite_start]E2E03 [cite: 325] | [cite_start]User A/B matching $\rightarrow$ meeting $\rightarrow$ review [cite: 325] | [cite_start]Hoàn tất call và review [cite: 325] |
| [cite_start]E2E04 [cite: 325] | [cite_start]Call có streak update [cite: 325] | [cite_start]Celebration xuất hiện [cite: 325] |
| [cite_start]E2E05 [cite: 325] | [cite_start]Add friend sau review $\rightarrow$ accept notification [cite: 325] | [cite_start]Hai bên thành bạn bè realtime [cite: 325] |
| [cite_start]E2E06 [cite: 325] | [cite_start]Friend chat popup [cite: 325] | [cite_start]Message đầu tiên mở popup và hiển thị [cite: 325] |
| [cite_start]E2E07 [cite: 325] | [cite_start]Unfriend realtime [cite: 325] | [cite_start]Bên kia nhận notification và friend list cập nhật [cite: 325] |
| [cite_start]E2E08 [cite: 325] | [cite_start]Report user $\rightarrow$ admin resolve [cite: 325] | [cite_start]Report chuyển trạng thái đúng [cite: 325] |
| [cite_start]E2E09 [cite: 325] | [cite_start]Ban user $\rightarrow$ appeal $\rightarrow$ admin approve [cite: 325] | [cite_start]User được mở khóa [cite: 325] |
| [cite_start]E2E10 [cite: 325] | [cite_start]Socket reconnect trong chat [cite: 325] | [cite_start]Không mất message, không duplicate listener [cite: 325] |
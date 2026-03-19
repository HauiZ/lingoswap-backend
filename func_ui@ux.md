@Function
Nhóm A: Quản lý người dùng 
1. Đăng ký/Đăng nhập/Đổi mật khẩu/Quên mật khẩu: Hỗ trợ xác thực qua Email/OTP. 

2. Hồ sơ cá nhân: Thiết lập ảnh đại diện, ngôn ngữ sở trường, ngôn ngữ mục tiêu và trình độ (Beginner/Intermediate/Advanced). Có thể setting giao diện hệ thống sáng/tối hoặc ngôn ngữ hệ thống.

3. Danh sách bạn bè: Thêm, xóa, tìm kiếm, quản lý bạn học và chat real-time.
Pipeline: Sau khi ghép cặp hiển thị gợi ý kết bạn, cũng như lưu lại toàn bộ chat trong lúc giao tiếp. Nếu cả 2 chấp nhận kết bạn đoạn chat có thể tiếp tục vĩnh viễn cho đến khi hủy kết bạn/ Nếu không kết bạn thì đoạn chat sẽ dừng lại cho đến khi matching kết thúc.

4. Cơ chế báo cáo: Chặn hoặc báo cáo người dùng vi phạm quy tắc cộng đồng hoặc .
Pipeline: Trong lúc giao tiếp nếu phát hiện người A có hành vi không đúng mực trong lúc giao tiếp hoặc lời lẽ văng tục có thể báo cáo để admin xử lý(khóa tài khoản)

5. Quản lý, theo dõi và thống kê.
Pipeline: Có dashboard thống kê số phiên, tổng giờ hoạt động, chuỗi ngày online(streak), số lượt matching để đánh giá.

Nhóm B: Hệ thống Ghép cặp (Matching System)
Lọc đối tác: Tìm người theo cặp ngôn ngữ.
Hàng chờ thông minh: Tự động ghép cặp những người đang trực tuyến.

Nhóm C: Giao tiếp thời gian thực (Real-time Communication)
Video Call: Giao tiếp Face-to-Face qua WebRTC, hỗ trợ bật/tắt Cam và Mic.
Gợi ý TOpic để giao tiếp: dựa trên sở thích hoặc ngẫu nhiên.
Chat song song: Nhắn tin và gửi emoji ngay trong phòng gọi.
Trạng thái tin nhắn: Hiển thị "Đã gửi/Đã nhận" và bộ đếm thời gian phiên học.
Sửa lỗi chính tả/gợi ý từ trong chat.
Rating cho đối tác sau khi kết thúc

"Ice-Breaker Mini Games" (Trò chơi phá băng)
Trong khi Video Call, nếu hai người thấy ngại ngùng, họ có thể bật chế độ mini-game.
Trò chơi "Taboo/Quick Draw": * Hệ thống hiện một từ (ví dụ: "Apple").
Người A phải dùng tiếng Anh để mô tả (không được nói từ Apple) cho người B đoán.
Hoặc người A vẽ lên màn hình (Canvas chung) cho người B đoán từ.

Nhóm D: Quản lý cho admin
1. Quản lý người dùng: khóa/kích hoạt/xóa tài khoản vĩnh viễn, xem thông tin người dùng, kiểm tra trình độ người dùng.
2. Xử lý báo cáo & tố cáo từ người dùng: hiển thị danh sách báo cáo, xem bằng chứng(đoạn chat), ra quyết định.
3. Quản lý ngôn ngữ & bộ lọc từ cấm: thêm/sửa/xóa danh mục(keyword).
4. Dashboard báo cáo/thống kê số lượt matching/hoạt động của hệ thống.

@UI/UX
I. Phân hệ Public & Guest (Người lạ chưa đăng nhập)
1. Landing Page (Trang chủ): Giới thiệu tính năng, thống kê số người dùng, các đánh giá (testimonials).
2. Pricing/Plans: Giới thiệu các gói (dù là miễn phí nhưng nên có trang này để show khả năng thiết kế UI Card).
3. About Us: Thông tin về nhóm 3 thành viên và mục tiêu của đề tài "Nền tảng trao đổi ngôn ngữ".
4. FAQ & Support: Các câu hỏi thường gặp và form gửi liên hệ hỗ trợ, các điều khoản về hệ thống.

II. Phân hệ Authentication & Onboarding (Đăng nhập & Khởi tạo)
5.  Login Page: Form đăng nhập truyền thống và Social Login (Google/Facebook).
6.  Sign Up Page: Chia làm 3 bước (Stepper UI):
* Bước 1: Thông tin tài khoản (Email, mật khẩu).
* Bước 2: Xác thực OTP gửi qua Email.
* Bước 3: Thiết lập ngôn ngữ mẹ đẻ, ngôn ngữ muốn học và trình độ.
7.  Forgot Password Page: Trang nhập email và trang đổi mật khẩu mới.

III. Phân hệ Core Application (Trang dành cho người dùng chính)
8.  User Dashboard: Bảng điều khiển tổng quan.
* Hiển thị Streak (lửa), số giờ học, số phiên đã tham gia.
* Gợi ý bạn học "Hot" đang online.
9.  Matching Room (Radar View): Trang hiển thị khi người dùng nhấn "Find Partner". Nên có hiệu ứng radar quét vòng tròn và các icon ảnh đại diện bay quanh để tăng tính thẩm mỹ.
10. Video Call & Chat Hub (Màn hình chính):
* Khung Video chia đôi (Split screen) hoặc người gọi nhỏ ở góc.
* Cửa sổ Chat trượt từ phải qua.
* Nút "Báo cáo" nhanh và "Yêu cầu kết bạn" ngay trên giao diện.
11. Conversation History: Danh sách các cuộc trò chuyện cũ.
* Tiếp tục chat: Nếu đã là bạn bè.
* ReadOnly: Nếu chỉ là match qua đường và chưa kết bạn.
12. Friends List: Trang quản lý bạn bè, chia theo tab (Tất cả, Đang online, Lời mời kết bạn).

IV. Phân hệ Profile & Settings (Cá nhân hóa)
14. User Profile (Public): Giao diện người khác nhìn thấy (Avatar, Bio, Thành tích).
15. Edit Profile (Private): Nơi cập nhật lại trình độ, ngôn ngữ hoặc đổi ảnh đại diện.
16. System Settings: Trang cấu hình giao diện Sáng/Tối (Light/Dark mode) và ngôn ngữ hệ thống.

V. Phân hệ Admin Dashboard (Quản trị viên)
17. Admin Statistics: Tổng quan số User, số cuộc gọi đang diễn ra, biểu đồ báo cáo vi phạm.
18. User Management: Danh sách tất cả người dùng với nút "Khóa tài khoản" hoặc "Cảnh cáo".
19. Report Center: Trang hiển thị các đơn tố cáo.
* Khi click vào một báo cáo: Xem được lý do, thời gian, và lịch sử chat đi kèm để đối soát.
20. Content Moderation: Cấu hình từ khóa cấm (Blacklist keywords) cho hệ thống chat.


# TOEICSpace LMS Frontend

Ứng dụng React, TypeScript và Vite cho trung tâm TOEIC. Admin quản lý lớp, giáo viên, phòng và ghi danh. Giáo viên quản lý buổi học và điểm danh trong lớp được phân công. Học viên xem lớp đã ghi danh, lịch tuần, xung đột lịch, Google Meet và lịch sử điểm danh.

## Chạy local

Dùng Node 22 và npm 10 theo .nvmrc. Khởi chạy gateway của toeic-space-lms-be ở cổng 15050. Trong thư mục frontend chạy:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Mở http://127.0.0.1:15173. Dùng hostname này riêng cho LMS để tách cookie khỏi ứng dụng khác chạy trên localhost. Vite chuyển tiếp các prefix /identity, /classroom, /assessment, /content và /payment tới gateway LMS. Khi triển khai, dùng hostname riêng, phục vụ dist với SPA fallback và chuyển tiếp năm prefix tới gateway LMS trước fallback. Mặc định HTTP client dùng cùng origin và gửi cookie. Cấu hình OAuth callback/redirect và cookie trên môi trường LMS tương ứng trước khi thử Google Meet.

## Kiểm tra

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Bàn giao nghiệp vụ

| Vai trò | Điểm vào                                               | Quyền thực thi                                                                                          |
| ------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Admin   | /admin, /admin/classes/list                            | Ghi danh trực tiếp, quản lý vòng đời, phòng, lịch định kỳ, buổi, kiểm tra xung đột, audit và retry Meet |
| Teacher | /teacher/classes, /teacher/schedule, /teacher/settings | Lớp được phân công, buổi học, điểm danh và kết nối Google                                               |
| User    | /my-classes, /my-classes/:id                           | Classroom xác định danh tính từ token và kiểm quyền đọc lớp, buổi và Meet                               |

Trang lớp chỉ tải nội dung khi API enrolled/{id} thành công. Lịch sử tài khoản lấy từ GET /classroom/api/v1/students/me/attendance. Trong lớp, FE đọc chi tiết từng ID buổi duy nhất trong lịch sử, đối chiếu classId trước khi lọc trạng thái và chia trang 10 bản ghi. Một lần đọc buổi thất bại sẽ hiển thị lỗi. Với tài khoản có lịch sử dài, nên bổ sung endpoint điểm danh theo lớp có tổng bản ghi và phân trang phía server.

## Bàn giao Student Portal

Học viên có role `User`. Sau đăng nhập và khi mở `/`, đích mặc định là `/my-classes` với tab **Lớp học của tôi**. Có thể liên kết trực tiếp bằng `?tab=calendar`, `?tab=classes`, `?tab=attendance` và `/my-classes/:id`. Identity dùng chung cho cả ba vai trò.

Khi xây Student Portal theo Microsoft Teams for Education, tái sử dụng ba tab trong `src/modules/student`, calendar và Meet dùng chung, cùng các hook đọc lớp theo tài khoản. Giữ deep link, trạng thái tìm kiếm, bộ lọc và kiểm quyền Classroom trước khi hiển thị chi tiết. Màn học liệu, bài tập và thông báo cần contract riêng trước khi thêm vào portal.

## Học phí

Admin mở /admin/tuition để tạo khoản thu từ classId, studentId, số tiền VND và classEnrollmentId tùy chọn. Đường dẫn /tuition/:id dùng paymentOrderId. Trong phạm vi FE hiện tại, chỉ Admin mở sao kê. Sao kê hiển thị tiền đã trả, miễn giảm, dư nợ, thông tin chuyển khoản và các bút toán. Có thể thu tiền mặt hoặc miễn giảm từng phần. Giữ nguyên ID khi thử lại cùng biểu mẫu. SePay cập nhật qua webhook BE, nút cập nhật đọc lại sao kê. Sau tất toán, Admin thực hiện ghi danh trong Classroom khi cần.

Payment developer tiếp quản màn đối soát qua GET /payment/api/v1/admin/payment-reconciliation/transactions, tra cứu học viên/lớp bằng tên, danh sách khoản thu, khôi phục thao tác chưa xác định kết quả sau khi tải lại trang và xử lý hoàn tiền. Danh sách sao kê theo người học, bảng giá lớp và xác thực liên kết ghi danh cần contract BE. Tự động ghi danh cần hợp đồng Classroom có idempotency và cơ chế retry.

## Phần dành cho giai đoạn sau

- Tài liệu lớp cần metadata, liên kết tài liệu–lớp và kiểm quyền tải theo ghi danh.
- Bài tập và bài nộp cần liên kết lớp với test/practice set và kiểm quyền làm bài.
- Thông báo cần sự kiện nghiệp vụ, người nhận, trạng thái gửi và retry.
- Báo cáo và quản lý học phí nâng cao cần API tổng hợp theo lớp, kỳ và trạng thái.
- Trợ lý Admin cần rà soát hành động theo các tài nguyên LMS trước khi đưa lại vào menu.

Kiểm thử deployment cần tài khoản thật cho cả ba vai trò: mở deep link lớp của người khác, kiểm tra học viên ngoài lớp, xác nhận lịch sinh buổi, preview xung đột, kết nối Google, thử lại provisioning bằng Admin và đối chiếu thanh toán qua SePay.

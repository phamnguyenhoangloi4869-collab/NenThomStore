# The Aura Candle — bản GitHub Pages

Đây là gói website tĩnh được chuẩn bị từ dự án NenThomStore để triển khai trên **GitHub Pages**.

## 1. Triển khai lên GitHub Pages

### Cách A — tải ZIP lên GitHub (dễ nhất)

1. Giải nén `NenThomStore_GitHubPages.zip` trên máy tính.
2. Mở GitHub và tạo một repository mới, ví dụ `the-aura-candle`.
   - Chọn **Public** nếu muốn dùng GitHub Pages miễn phí.
   - Không cần thêm README, `.gitignore` hoặc License vì gói này đã có sẵn file cần thiết.
3. Vào repository vừa tạo → **Add file** → **Upload files**.
4. Mở thư mục đã giải nén trên máy tính, chọn **toàn bộ file và thư mục bên trong** (đặc biệt phải có `index.html`, `css`, `js`, `images`, `data`, `lib`) rồi kéo vào GitHub.
   - Lưu ý: `index.html` phải nằm ngay ở thư mục gốc repository, không nằm trong một thư mục con.
5. Kéo xuống cuối trang, nhập commit message, ví dụ `Upload website`, rồi bấm **Commit changes**.
6. Vào **Settings → Pages**.
7. Trong **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
   - Bấm **Save**.
8. Đợi GitHub hoàn tất triển khai. Đường dẫn website thường có dạng:
   `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`

### Cách B — dùng Git trên máy tính

Giải nén ZIP, mở Terminal/PowerShell tại thư mục có `index.html`, sau đó chạy:

```bash
git init
git add .
git commit -m "Deploy The Aura Candle"
git branch -M main
git remote add origin https://github.com/TEN-TAI-KHOAN/TEN-REPOSITORY.git
git push -u origin main
```

Thay `TEN-TAI-KHOAN` và `TEN-REPOSITORY` bằng thông tin repository của bạn. Nếu repository đã có remote hoặc đã được khởi tạo Git, không chạy lại `git init`/`git remote add`.

Sau đó bật GitHub Pages theo bước 6–7 ở Cách A.

## 2. Website có những gì?

- Giao diện cửa hàng, trang sản phẩm, danh mục, tìm kiếm và chi tiết sản phẩm.
- Dữ liệu sản phẩm, danh mục, số liệu và đánh giá được đọc từ `data/store.json`.
- Hình ảnh sản phẩm nằm trong `images/products/`.
- Giỏ hàng, đăng ký/đăng nhập demo, hồ sơ, đơn hàng và phần quản trị được mô phỏng bằng JavaScript.
- Trạng thái phát sinh được lưu trong `localStorage` của trình duyệt đang sử dụng website.

## 3. Giới hạn quan trọng của GitHub Pages

GitHub Pages chỉ lưu trữ và chạy website tĩnh; nó **không chạy ASP.NET Core, không kết nối trực tiếp SQL Server và không cung cấp Backend dùng chung**.

Do đó, bản GitHub Pages là bản mô phỏng phía trình duyệt:

- Tài khoản, giỏ hàng, đơn hàng, đánh giá và thao tác quản trị chỉ lưu trên trình duyệt của người đang dùng.
- Chủ cửa hàng không nhận được đơn đặt hàng từ khách qua một database chung.
- Dữ liệu khách tự tạo không tự đồng bộ giữa các thiết bị hoặc người dùng.
- Không có thanh toán trực tuyến thực tế.
- Không dùng bản demo này để xử lý đơn hàng hoặc thông tin thanh toán thật.

Muốn nhận đơn thật từ mọi khách truy cập, cần triển khai Backend ASP.NET Core và SQL Server lên một máy chủ/hosting riêng, sau đó cấu hình Frontend gọi API đó. Không đưa mật khẩu database, JWT secret hoặc thông tin đăng nhập quản trị thật lên repository công khai.

## 4. Tài khoản demo

Bản mô phỏng có các tài khoản sau (mật khẩu phân biệt chữ hoa/chữ thường):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@demo.vn` | `Demo1234` |
| Quản lý | `manager@demo.vn` | `Demo1234` |
| Khách hàng | `customer@demo.vn` | `Demo1234` |

Đây chỉ là tài khoản thử nghiệm được mô phỏng trong mã JavaScript, **không phải tài khoản bảo mật**. Không tái sử dụng mật khẩu thật.

## 5. Cập nhật sản phẩm và hình ảnh

Hiện tại website lấy dữ liệu từ `data/store.json`. Khi muốn cập nhật nội dung, bạn cần cập nhật JSON và bảo đảm các ảnh tương ứng có mặt trong `images/products/`, sau đó commit/push lại repository.

Gói GitHub Pages này không thể tự đọc database localhost. Muốn xuất dữ liệu mới trực tiếp từ database, hãy chạy dự án Backend ở môi trường phát triển và dùng quy trình export của dự án gốc trước khi cập nhật `data/store.json` cùng ảnh.

## 6. Nếu website không hiển thị đúng

1. Kiểm tra `index.html` có nằm ở thư mục gốc repository không.
2. Kiểm tra GitHub Pages đang chọn branch `main` và folder `/(root)`.
3. Đợi quá trình Deployments hoàn tất.
4. Mở website bằng `Ctrl + F5` hoặc cửa sổ ẩn danh.
5. Nếu sản phẩm không tải, kiểm tra file `data/store.json` đã được upload và không bị đổi tên.
6. Nếu ảnh sản phẩm bị lỗi, kiểm tra các file ảnh tương ứng trong `images/products/`.
7. Mở Developer Tools (F12) → Console để xem lỗi JavaScript hoặc đường dẫn file.

---
Bản triển khai tĩnh được tách riêng; mã nguồn ASP.NET Core/SQL Server của dự án localhost không nằm trong gói GitHub Pages này.

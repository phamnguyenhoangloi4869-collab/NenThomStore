# Đưa The Aura Candle lên GitHub Pages (giống hệt localhost)

GitHub Pages chỉ chạy được file tĩnh, **không chạy được Backend ASP.NET + SQL Server**.
Vì vậy bản trên GitHub dùng một "ảnh chụp" dữ liệu của localhost:

| Thành phần | Nơi lưu |
|---|---|
| Giao diện (`index.html`, `css/`, `js/app.js`, `lib/`) | y hệt `NenThomStore.Web/wwwroot` |
| Sản phẩm, danh mục, đánh giá, số liệu | `data/store.json` (xuất từ database localhost) |
| Ảnh sản phẩm | `images/products/*.jpg` (đã thu nhỏ để tải nhanh) |
| Giả lập Backend trong trình duyệt | `js/static-api.js` |

## Mỗi lần thêm/sửa sản phẩm trên localhost

1. Chạy `NenThomStore.Api` (đang chạy ở http://localhost:5080).
2. Mở PowerShell tại thư mục gốc dự án và chạy:
   ```powershell
   .\scripts\export-for-github.ps1
   ```
   (nếu PowerShell báo bị chặn script: `Set-ExecutionPolicy -Scope Process Bypass` rồi chạy lại)
3. Đẩy lên GitHub:
   ```powershell
   git add .
   git commit -m "Cap nhat du lieu"
   git push
   ```
4. Đợi ~1 phút, mở trang và nhấn **Ctrl + F5**.

## Lưu ý
- Giỏ hàng, đơn hàng, tài khoản, đánh giá trên bản GitHub chỉ lưu **trong trình duyệt của từng khách**,
  chủ cửa hàng **không nhận được đơn**. Muốn nhận đơn thật cần chạy Backend trên một máy chủ.
- Tài khoản thử (chỉ có tác dụng trong trình duyệt): `admin@demo.vn`, `manager@demo.vn`, `customer@demo.vn` – mật khẩu `Demo1234`.
- Bản localhost (`NenThomStore.Web`) không bị thay đổi gì.

## Cách nhanh nhất để GitHub giống hệt localhost
1. Chạy `NenThomStore.Api` (cửa sổ phải đang mở).
2. Bấm đúp file **`DONG-BO-GITHUB.bat`** ở thư mục gốc: nó xuất dữ liệu + ảnh từ localhost rồi `git push`.
3. Đợi ~1 phút, mở trang GitHub và nhấn Ctrl + F5.

Trên GitHub, phần admin vẫn chạy được (thêm/sửa/ẩn sản phẩm, tải ảnh, sửa số liệu) nhưng chỉ lưu trong trình duyệt của người đang dùng.

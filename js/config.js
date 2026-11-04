// Cấu hình Frontend. Sửa file này để đổi địa chỉ Backend và thông tin thương hiệu.
window.APP_CONFIG = {
  apiBase: '',                               // GitHub Pages không có Backend -> dùng dữ liệu tĩnh bên dưới (js/static-api.js)
  staticData: 'data/store.json',             // dữ liệu cửa hàng xuất từ localhost (scripts/export-for-github.ps1)
  brand: {
    name: 'The Aura Candle',
    tagline: 'Hương thơm bừng lên phong cách sống',
    about: '',          // đoạn giới thiệu thương hiệu (để trống sẽ dùng nội dung mặc định)
    phone: '0123456798',
    email: 'theaura.cauracd@gmail.com',
    address: 'Hỗ trợ khách hàng trực tuyến trên toàn quốc',
    facebook: '',                               // dán link fanpage Facebook vào đây để tên fanpage bấm được
    facebookName: 'The Aura Candle',
    tiktok: '@the.aura.candle0',
    replyHours: 'Thứ 2–Thứ 7, 08:00–20:00 (trừ ngày lễ).',
    shippingPolicy: 'Xử lý đơn trong 1–2 ngày làm việc. Thời gian giao hàng dự kiến 2–5 ngày làm việc tùy khu vực. Phí vận chuyển được thông báo khi xác nhận đơn. Khách có thể kiểm tra thông tin kiện hàng khi nhận; vui lòng quay video mở hộp nếu phát hiện hư hỏng. Hiện hỗ trợ thanh toán khi nhận hàng (COD).',
    returnPolicy: 'Vui lòng liên hệ trong vòng 3 ngày kể từ khi nhận hàng nếu sản phẩm bị bể vỡ, giao sai hoặc có lỗi do vận chuyển/sản xuất. Sản phẩm cần giữ nguyên hiện trạng và bao bì; cung cấp mã đơn cùng hình ảnh hoặc video để được hỗ trợ. Không áp dụng đổi trả với sản phẩm đã sử dụng, đốt thử, hư hỏng do bảo quản/sử dụng không đúng hoặc thay đổi ý định, trừ trường hợp pháp luật quy định khác. Sau khi xác minh, cửa hàng sẽ hướng dẫn đổi sản phẩm hoặc hoàn tiền phù hợp; phí vận chuyển do cửa hàng chịu nếu lỗi thuộc cửa hàng.'
  }
};

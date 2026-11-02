(() => {
'use strict';
const CFG = window.APP_CONFIG || {}, B = CFG.brand || {};
const API = (CFG.apiBase || '').replace(/\/$/, '');
const PLACEHOLDER = CFG.placeholder || 'images/placeholder-product.svg';
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: k => { try { localStorage.removeItem(k); } catch {} } };
const parse = s => { try { return JSON.parse(s); } catch { return null; } };
const S = { token: store.get('aura_token'), user: parse(store.get('aura_user')), cats: [], cartCount: 0, stats: null };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnd = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + '₫';
const num = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
const fdate = d => new Date(d).toLocaleString('vi-VN');
const qs = o => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v); }); const s = p.toString(); return s ? '?' + s : ''; };
const img = u => !u ? PLACEHOLDER : (/^(https?:|data:)/.test(u) ? u : API + u);
const roles = () => S.user?.roles || [];
const isStaff = () => roles().includes('Admin') || roles().includes('Manager');
const isAdmin = () => roles().includes('Admin');
const STATUS = { Pending: ['Chờ xử lý', 'warning text-dark'], Confirmed: ['Đã xác nhận', 'info text-dark'], Shipping: ['Đang giao', 'primary'], Delivered: ['Đã giao', 'success'], Cancelled: ['Đã hủy', 'secondary'] };
const badge = s => { const x = STATUS[s] || ['Không xác định', 'secondary']; return `<span class="badge bg-${x[1]}">${x[0]}</span>`; };
const PAY = { Unpaid: 'Chưa thanh toán', Paid: 'Đã thanh toán' };
const stars = n => { const r = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return '★'.repeat(r) + '☆'.repeat(5 - r); };
const spinner = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><div class="mt-2 text-muted">Đang tải...</div></div>';
const empty = m => `<div class="text-center text-muted py-5">${esc(m)}</div>`;
const go = p => { location.hash = '#' + p; };

// ---------- API ----------
async function api(method, path, body, isForm) {
  if (window.DEMO_API) return window.DEMO_API(method, path, body, S);
  const h = {};
  if (S.token) h.Authorization = 'Bearer ' + S.token;
  if (body && !isForm) h['Content-Type'] = 'application/json';
  let res;
  try { res = await fetch(API + path, { method, headers: h, body: body ? (isForm ? body : JSON.stringify(body)) : undefined }); }
  catch { throw new Error('Không kết nối được máy chủ. Hãy kiểm tra Backend đang chạy và cấu hình apiBase trong js/config.js.'); }
  if (res.status === 401 && S.token) { setAuth(null); toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'warning'); }
  const text = await res.text(); const data = text ? parse(text) : null;
  if (!res.ok) {
    const ve = data?.errors && Object.values(data.errors).flat()[0];
    throw new Error(data?.detail || ve || data?.title || (res.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : 'Có lỗi xảy ra (' + res.status + ').'));
  }
  return data;
}
function setAuth(a) {
  S.token = a?.token || null; S.user = a?.user || null;
  if (a) { store.set('aura_token', a.token); store.set('aura_user', JSON.stringify(a.user)); } else { store.del('aura_token'); store.del('aura_user'); S.cartCount = 0; }
  renderNav();
}
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(msg)}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  $('#toasts').appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3500 }); t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
async function refreshCart() {
  if (!S.user) { S.cartCount = 0; } else { try { const c = await api('GET', '/api/cart'); S.cartCount = c.items.reduce((a, i) => a + i.quantity, 0); } catch { } }
  const b = $('#cartBadge'); if (b) { b.textContent = S.cartCount; b.classList.toggle('d-none', !S.cartCount); }
}

// ---------- Layout ----------
function renderNav() {
  const u = S.user;
  $('#nav').innerHTML = `<nav class="navbar navbar-expand-lg sticky-top aura-nav"><div class="container">
    <a class="navbar-brand" href="#/"><img src="images/logo/logo-aura-candle.png" alt="The Aura Candle" height="46"></a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navc" aria-label="Menu"><span class="navbar-toggler-icon"></span></button>
    <div id="navc" class="collapse navbar-collapse">
      <ul class="navbar-nav me-auto"><li class="nav-item"><a class="nav-link" href="#/">Trang chủ</a></li><li class="nav-item"><a class="nav-link" href="#/products">Sản phẩm</a></li></ul>
      <form class="d-flex me-lg-3 my-2 my-lg-0" data-form="navSearch"><input class="form-control rounded-pill me-2" name="q" placeholder="Tìm nến..." aria-label="Tìm kiếm"><button class="btn btn-outline-brand" type="submit">Tìm</button></form>
      <a class="btn btn-outline-brand position-relative me-lg-2 my-1" href="#/cart">Giỏ hàng <span id="cartBadge" class="badge rounded-pill bg-danger ${S.cartCount ? '' : 'd-none'}">${S.cartCount}</span></a>
      ${u ? `<div class="dropdown my-1"><button class="btn btn-brand dropdown-toggle" data-bs-toggle="dropdown">${esc((u.fullName || u.email || 'Tài khoản').trim().split(' ').pop())}</button><ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#/profile">Tài khoản của tôi</a></li><li><a class="dropdown-item" href="#/orders">Đơn hàng của tôi</a></li>
          ${isStaff() ? '<li><a class="dropdown-item" href="#/admin">Trang quản trị</a></li>' : ''}
          <li><hr class="dropdown-divider"></li><li><button class="dropdown-item" data-act="logout">Đăng xuất</button></li></ul></div>`
      : '<a class="btn btn-brand my-1" href="#/login">Đăng nhập</a><a class="btn btn-link my-1" href="#/register">Đăng ký</a>'}
    </div></div></nav>`;
}
function renderFooter() {
  const phone = B.phone || '0768724134';
  const email = B.email || 'PHAMNGUYENHOANGLOI4869@GMAIL.COM';
  const shipping = B.shippingPolicy || 'Xử lý đơn trong 1–2 ngày làm việc; giao hàng dự kiến 2–5 ngày làm việc tùy khu vực. Phí vận chuyển được thông báo khi xác nhận đơn. Hiện hỗ trợ thanh toán COD.';
  const returns = B.returnPolicy || 'Liên hệ trong vòng 3 ngày nếu hàng bị hư hỏng, giao sai hoặc có lỗi. Vui lòng giữ bao bì và gửi mã đơn kèm ảnh/video. Sản phẩm đã sử dụng hoặc đốt thử không áp dụng đổi trả, trừ trường hợp pháp luật quy định.';
  $('#footer').innerHTML = `<div class="footer-aura"><div class="container"><div class="row g-4 align-items-start">
    <div class="col-12 col-md-4"><img src="images/logo/logo-square.jpg" alt="Logo The Aura Candle" height="76" class="rounded-3 mb-2"><div class="fw-bold fs-5">${esc(B.name || 'The Aura Candle')}</div><div>${esc(B.tagline || 'Hương thơm bừng lên phong cách sống')}</div><p class="small mt-2 mb-0">Nến thơm và quà tặng giúp không gian thêm ấm áp. Cảm ơn bạn đã lựa chọn chúng tôi.</p></div>
    <div class="col-12 col-md-4"><h5 class="text-white">Liên hệ</h5><div class="mb-2"><b>Điện thoại:</b> <a href="tel:${esc(phone)}">${esc(phone)}</a></div><div class="mb-2"><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a></div><div class="mb-2"><b>Hỗ trợ:</b> ${esc(B.address || 'Hỗ trợ khách hàng trực tuyến trên toàn quốc')}</div>${B.facebook ? `<div><a href="${esc(B.facebook)}" target="_blank" rel="noopener noreferrer">Fanpage chính thức</a></div>` : ''}<div class="small mt-2">Thời gian phản hồi: Thứ 2–Thứ 7, 8:00–17:00 (trừ ngày lễ).</div></div>
    <div class="col-12 col-md-4"><h5 class="text-white">Chính sách mua hàng</h5><details class="footer-policy mb-2"><summary>Giao hàng & thanh toán</summary><p class="mt-2 mb-0">${esc(shipping)}</p></details><details class="footer-policy mb-2"><summary>Đổi trả & hoàn tiền</summary><p class="mt-2 mb-0">${esc(returns)}</p></details><div class="small mt-2">Đặt hàng đồng nghĩa với việc khách hàng đã đọc và đồng ý các chính sách áp dụng tại thời điểm mua hàng.</div></div>
  </div><hr class="border-light opacity-25"><div class="d-flex flex-column flex-sm-row justify-content-between gap-2 text-center small opacity-75"><span>© ${new Date().getFullYear()} ${esc(B.name || 'The Aura Candle')}. Bảo lưu mọi quyền.</span>${S.stats ? `<span>Lượt truy cập: <b>${num(S.stats.visits)}</b> · Lượt mua hàng: <b>${num(S.stats.purchases)}</b></span>` : ''}<span>Website bán nến thơm · Thanh toán COD</span></div></div></div>`;
}

// ---------- Components ----------
function card(p) {
  const sale = p.salePrice && p.salePrice < p.price;
  return `<div class="col-6 col-md-4 col-lg-3"><div class="card product-card h-100 position-relative">
    ${sale ? `<span class="badge-sale">-${Math.round((1 - p.salePrice / p.price) * 100)}%</span>` : ''}${p.isNew && !sale ? '<span class="badge-new">Mới</span>' : ''}
    <a href="#/product/${p.id}" class="ratio ratio-1x1 pimg"><img src="${esc(img(p.imageUrl))}" alt="${esc(p.name)}" loading="lazy"></a>
    <div class="card-body d-flex flex-column"><a href="#/product/${p.id}" class="text-decoration-none fw-bold text-dark">${esc(p.name)}</a>
      <div class="small text-muted">${esc(p.scent || p.categoryName)}</div>
      <div class="mt-1"><span class="price">${vnd(p.effectivePrice)}</span>${sale ? `<span class="price-old">${vnd(p.price)}</span>` : ''}</div>
      <div class="mt-auto pt-2">${p.stock > 0 ? `<button class="btn btn-brand btn-sm w-100" data-act="addCart" data-id="${p.id}">Thêm vào giỏ</button>` : '<button class="btn btn-secondary btn-sm w-100" disabled>Hết hàng</button>'}</div></div></div></div>`;
}
const statsBand = () => S.stats ? `<div class="stats-band row g-3 text-center mt-3"><div class="col-6"><div class="stat-box"><b>${num(S.stats.visits)}</b><small>Lượt truy cập</small></div></div><div class="col-6"><div class="stat-box"><b>${num(S.stats.purchases)}</b><small>Lượt mua hàng</small></div></div></div>` : '';
const section = (title, items, link) => items.length ? `<div class="section-title"><h2>${title}</h2>${link ? `<a href="${link}" class="fw-bold">Xem tất cả →</a>` : ''}</div><div class="row g-3">${items.map(card).join('')}</div>` : '';
function pager(total, page, size, mk) {
  const n = Math.ceil(total / size); if (n <= 1) return '';
  let h = '<nav class="mt-4"><ul class="pagination justify-content-center flex-wrap">';
  for (let i = 1; i <= n; i++) h += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" ${mk(i)}>${i}</a></li>`;
  return h + '</ul></nav>';
}
const field = (n, l, v = '', t = 'text', extra = '') => `<div class="mb-3"><label class="form-label fw-bold">${l}</label><input class="form-control" name="${n}" type="${t}" value="${esc(v)}" ${extra}></div>`;

// ---------- Customer views ----------
async function home() {
  const get = p => api('GET', '/api/products' + qs(p)).then(r => r.items);
  const [feat, news, sale, best] = await Promise.all([get({ featured: true, pageSize: 4 }), get({ isNew: true, pageSize: 4 }), get({ onSale: true, pageSize: 4 }), get({ sort: 'best', pageSize: 4 })]);
  const cats = S.cats;
  return `<img class="hero-img w-100" src="images/banner/banner-wide.jpg" alt="The Aura Candle – ${esc(B.tagline)}">
    <div class="text-center mt-3"><a href="#/products" class="btn btn-brand btn-lg">Khám phá nến thơm</a></div>
    ${statsBand()}
    ${cats.length ? `<div class="section-title"><h2>Danh mục</h2></div><div>${cats.map(c => `<a class="chip" href="#/products?categoryId=${c.id}">${esc(c.name)}</a>`).join('')}</div>` : ''}
    ${section('Sản phẩm nổi bật', feat, '#/products?featured=true')}${section('Sản phẩm mới', news, '#/products?isNew=true')}
    ${section('Đang khuyến mãi', sale, '#/products?onSale=true')}${section('Bán chạy', best.filter(p => p.sold > 0), '#/products?sort=best')}
    <div class="section-title"><h2>Về ${esc(B.name || 'The Aura Candle')}</h2></div>
    <div class="row g-4 align-items-center"><div class="col-md-6"><img class="hero-img w-100" src="images/brand/mascot-beach-1.jpg" alt="Linh vật sao biển của The Aura Candle"></div>
      <div class="col-md-6"><p class="fs-5 fw-bold text-danger mb-2">${esc(B.tagline)}</p><p>${esc(B.about || 'Mỗi cây nến là một khoảnh khắc thư giãn: ánh lửa nhỏ, hương thơm dịu và không gian của riêng bạn. Chúng tôi chọn những mùi hương tươi mát, gợi nhớ biển, nắng và những ngày nghỉ.')}</p><a href="#/products" class="btn btn-outline-brand">Xem sản phẩm</a></div></div>
    <div class="section-title"><h2>Hướng dẫn sử dụng & bảo quản nến</h2></div>
    <div class="info-band"><div class="row g-3">${[
      ['Cắt bấc', 'Cắt bấc còn khoảng 5mm trước mỗi lần thắp để ngọn lửa đều và ít khói.'],
      ['Lần đốt đầu', 'Để nến cháy 2–3 giờ cho bề mặt sáp tan đều, tránh nến bị lõm giữa.'],
      ['Thắp an toàn', 'Đặt nến trên mặt phẳng chịu nhiệt, xa vật dễ cháy, trẻ em và thú cưng. Không đốt quá 4 giờ liên tục.'],
      ['Bảo quản', 'Đậy nắp khi không dùng, để nơi khô mát, tránh ánh nắng trực tiếp.']
    ].map((s, i) => `<div class="col-md-6 d-flex gap-3"><span class="step-num">${i + 1}</span><div><b>${s[0]}</b><div>${s[1]}</div></div></div>`).join('')}</div></div>`;
}

async function products(params) {
  const page = Math.max(1, +params.page || 1), size = 12;
  const q = { search: params.search, categoryId: params.categoryId, minPrice: params.minPrice, maxPrice: params.maxPrice, inStock: params.inStock, featured: params.featured, onSale: params.onSale, isNew: params.isNew, sort: params.sort, page, pageSize: size };
  const r = await api('GET', '/api/products' + qs(q));
  const sel = (v, c) => String(v || '') === String(c) ? 'selected' : '';
  return `<h1 class="h3 mb-3">Sản phẩm</h1><div class="row g-4"><div class="col-lg-3"><form class="panel" data-form="filter">
      ${field('search', 'Tìm theo tên', params.search || '', 'search')}
      <div class="mb-3"><label class="form-label fw-bold">Danh mục</label><select class="form-select" name="categoryId"><option value="">Tất cả</option>${S.cats.map(c => `<option value="${c.id}" ${sel(params.categoryId, c.id)}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="row g-2"><div class="col-6">${field('minPrice', 'Giá từ', params.minPrice || '', 'number', 'min="0" step="1000"')}</div><div class="col-6">${field('maxPrice', 'đến', params.maxPrice || '', 'number', 'min="0" step="1000"')}</div></div>
      <div class="form-check mb-3"><input class="form-check-input" type="checkbox" name="inStock" id="inStock" ${params.inStock ? 'checked' : ''}><label class="form-check-label" for="inStock">Chỉ còn hàng</label></div>
      <div class="mb-3"><label class="form-label fw-bold">Sắp xếp</label><select class="form-select" name="sort"><option value="">Mới nhất</option><option value="price_asc" ${sel(params.sort, 'price_asc')}>Giá tăng dần</option><option value="price_desc" ${sel(params.sort, 'price_desc')}>Giá giảm dần</option><option value="name" ${sel(params.sort, 'name')}>Tên A–Z</option><option value="best" ${sel(params.sort, 'best')}>Bán chạy</option></select></div>
      <button class="btn btn-brand w-100" type="submit">Lọc</button></form></div>
    <div class="col-lg-9"><div class="text-muted mb-2">${r.total} sản phẩm</div>${r.items.length ? `<div class="row g-3">${r.items.map(card).join('')}</div>` : empty('Không tìm thấy sản phẩm phù hợp.')}
    ${pager(r.total, page, size, i => `href="#/products${qs({ ...q, page: i, pageSize: '' })}"`)}</div></div>`;
}

async function productDetail(id) {
  const p = await api('GET', '/api/products/' + id);
  const revs = await api('GET', '/api/reviews' + qs({ productId: id }));
  const sale = p.salePrice && p.salePrice < p.price;
  const imgs = p.images.length ? p.images : [{ url: null }];
  return `<nav class="small mb-3"><a href="#/products">Sản phẩm</a> / ${esc(p.categoryName)}</nav><div class="row g-4">
    <div class="col-md-6"><div class="ratio ratio-1x1 pimg rounded-4 overflow-hidden"><img id="mainImg" src="${esc(img(imgs[0].url))}" alt="${esc(p.name)}"></div>
      <div class="d-flex gap-2 mt-2 flex-wrap">${imgs.length > 1 ? imgs.map(i => `<img class="thumb" data-act="thumb" data-src="${esc(img(i.url))}" src="${esc(img(i.url))}" alt="Ảnh sản phẩm ${esc(p.name)}">`).join('') : ''}</div></div>
    <div class="col-md-6"><h1 class="h2">${esc(p.name)}</h1>
      <div class="mb-2"><span class="stars">${stars(p.rating)}</span> <span class="small text-muted">${p.reviewCount ? p.rating + '/5 (' + p.reviewCount + ' đánh giá)' : 'Chưa có đánh giá'}</span></div>
      <div class="fs-3"><span class="price">${vnd(p.effectivePrice)}</span>${sale ? `<span class="price-old">${vnd(p.price)}</span>` : ''}</div>
      <p class="mt-3" style="white-space:pre-line">${esc(p.description || '')}</p>
      <table class="table table-sm w-auto"><tbody>
        ${p.scent ? `<tr><th class="pe-4">Mùi hương</th><td>${esc(p.scent)}</td></tr>` : ''}${p.volume ? `<tr><th>Dung tích / khối lượng</th><td>${esc(p.volume)}</td></tr>` : ''}
        ${p.burnTimeHours ? `<tr><th>Thời gian cháy</th><td>~${p.burnTimeHours} giờ</td></tr>` : ''}<tr><th>Tình trạng</th><td>${p.stock > 0 ? (p.stock <= 5 ? `Sắp hết (còn ${p.stock})` : 'Còn hàng') : 'Hết hàng'}${p.isActive ? '' : ' – ngừng kinh doanh'}</td></tr></tbody></table>
      ${p.stock > 0 && p.isActive ? `<div class="d-flex gap-2 align-items-center"><input id="qty" type="number" class="form-control" style="width:90px" min="1" max="${Math.min(p.stock, 99)}" value="1"><button class="btn btn-brand" data-act="addCart" data-id="${p.id}" data-qty="#qty">Thêm vào giỏ</button></div>` : '<div class="alert alert-secondary">Sản phẩm hiện không thể đặt mua.</div>'}</div></div>
    <div class="section-title"><h2>Đánh giá</h2></div>
    ${S.user ? `<form class="panel mb-3" data-form="review"><input type="hidden" name="productId" value="${p.id}"><div class="row g-2 align-items-end"><div class="col-md-3"><label class="form-label fw-bold">Số sao</label><select class="form-select" name="rating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} ★</option>`).join('')}</select></div>
      <div class="col-md-7"><label class="form-label fw-bold">Nhận xét</label><input class="form-control" name="comment" maxlength="1000" placeholder="Chia sẻ cảm nhận của bạn"></div><div class="col-md-2"><button class="btn btn-brand w-100" type="submit">Gửi</button></div></div><div class="form-text">Chỉ khách đã nhận hàng thành công mới đánh giá được.</div></form>` : '<div class="alert alert-light border">Đăng nhập để đánh giá sản phẩm đã mua.</div>'}
    ${revs.length ? revs.map(r => `<div class="panel mb-2"><div class="d-flex justify-content-between"><b>${esc(r.userName)}</b><span class="small text-muted">${fdate(r.createdAt)}</span></div><span class="stars">${stars(r.rating)}</span><div>${esc(r.comment || '')}</div>${r.isMine ? `<button class="btn btn-sm btn-link text-danger p-0" data-act="delReview" data-id="${r.id}">Xóa đánh giá của tôi</button>` : ''}</div>`).join('') : empty('Chưa có đánh giá nào.')}`;
}

async function cart() {
  if (!S.user) return needLogin();
  const c = await api('GET', '/api/cart');
  if (!c.items.length) return `<h1 class="h3">Giỏ hàng</h1>${empty('Giỏ hàng đang trống.')}<div class="text-center"><a class="btn btn-brand" href="#/products">Tiếp tục mua sắm</a></div>`;
  const bad = c.items.some(i => !i.available);
  return `<h1 class="h3 mb-3">Giỏ hàng</h1><div class="panel table-responsive"><table class="table align-middle"><thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th style="width:110px">Số lượng</th><th>Thành tiền</th><th></th></tr></thead><tbody>
    ${c.items.map(i => `<tr><td><div class="d-flex align-items-center gap-2"><img src="${esc(img(i.imageUrl))}" width="56" height="56" class="rounded-3" style="object-fit:cover" alt=""><div><a href="#/product/${i.productId}" class="fw-bold text-decoration-none">${esc(i.name)}</a>${i.available ? '' : `<div class="small text-danger">Không đủ hàng hoặc ngừng kinh doanh (còn ${i.stock})</div>`}</div></div></td>
      <td>${vnd(i.unitPrice)}</td><td><input type="number" class="form-control form-control-sm" min="1" max="99" value="${i.quantity}" data-change="cartQty" data-id="${i.productId}"></td><td class="fw-bold">${vnd(i.lineTotal)}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-act="cartRemove" data-id="${i.productId}">Xóa</button></td></tr>`).join('')}</tbody></table>
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div class="fs-5">Tạm tính: <span class="price">${vnd(c.subtotal)}</span></div>${bad ? '<span class="text-danger">Vui lòng điều chỉnh các sản phẩm không đủ hàng.</span>' : '<a class="btn btn-brand" href="#/checkout">Tiến hành đặt hàng</a>'}</div></div>`;
}

let checkoutKey = null, checkoutDiscount = 0;
async function checkout() {
  if (!S.user) return needLogin();
  const [c, me] = await Promise.all([api('GET', '/api/cart'), api('GET', '/api/account/me')]);
  if (!c.items.length) return `<h1 class="h3">Đặt hàng</h1>${empty('Giỏ hàng đang trống.')}`;
  checkoutKey = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); checkoutDiscount = 0;
  return `<h1 class="h3 mb-3">Đặt hàng</h1><div class="row g-4"><div class="col-lg-7"><form class="panel" data-form="checkout">
    ${field('receiverName', 'Họ tên người nhận', me.fullName, 'text', 'required maxlength="120"')}${field('phone', 'Số điện thoại', me.phone || '', 'tel', 'required placeholder="0901234567"')}
    ${field('address', 'Địa chỉ giao hàng', me.address || '', 'text', 'required maxlength="300"')}<div class="mb-3"><label class="form-label fw-bold">Ghi chú</label><textarea class="form-control" name="note" rows="2" maxlength="500"></textarea></div>
    <div class="mb-3"><label class="form-label fw-bold">Mã giảm giá</label><div class="input-group"><input class="form-control" name="voucherCode" id="voucherCode" placeholder="Nhập mã nếu có"><button class="btn btn-outline-brand" type="button" data-act="applyVoucher">Áp dụng</button></div><div id="voucherMsg" class="form-text"></div></div>
    <div class="mb-3"><label class="form-label fw-bold">Phương thức thanh toán</label><div class="form-check"><input class="form-check-input" type="radio" checked id="cod"><label class="form-check-label" for="cod">Thanh toán khi nhận hàng (COD)</label></div><div class="form-text">Thanh toán trực tuyến chưa được tích hợp.</div></div>
    <button class="btn btn-brand btn-lg w-100" type="submit">Xác nhận đặt hàng</button></form></div>
    <div class="col-lg-5"><div class="panel"><h2 class="h5">Đơn hàng của bạn</h2>${c.items.map(i => `<div class="d-flex justify-content-between small py-1"><span>${esc(i.name)} × ${i.quantity}</span><span>${vnd(i.lineTotal)}</span></div>`).join('')}<hr>
      <div class="d-flex justify-content-between"><span>Tạm tính</span><span id="sumSub" data-v="${c.subtotal}">${vnd(c.subtotal)}</span></div><div class="d-flex justify-content-between text-success"><span>Giảm giá</span><span id="sumDisc">0₫</span></div>
      <div class="d-flex justify-content-between fs-5 fw-bold mt-1"><span>Tổng cộng</span><span class="price" id="sumTotal">${vnd(c.subtotal)}</span></div><div class="form-text">Tổng tiền cuối cùng do hệ thống xác nhận khi đặt hàng.</div></div></div></div>`;
}

async function orders() {
  if (!S.user) return needLogin();
  const list = await api('GET', '/api/orders');
  return `<h1 class="h3 mb-3">Đơn hàng của tôi</h1>${list.length ? `<div class="panel table-responsive"><table class="table align-middle"><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>
    ${list.map(o => `<tr><td class="fw-bold">${esc(o.code)}</td><td>${fdate(o.createdAt)}</td><td>${vnd(o.total)}</td><td>${badge(o.status)}</td><td><a class="btn btn-sm btn-outline-brand" href="#/order/${o.id}">Chi tiết</a></td></tr>`).join('')}</tbody></table></div>` : empty('Bạn chưa có đơn hàng nào.')}`;
}

async function orderDetail(id) {
  if (!S.user) return needLogin();
  const o = await api('GET', '/api/orders/' + id);
  return `<a href="#/orders">← Đơn hàng của tôi</a><div class="panel mt-2"><div class="d-flex justify-content-between flex-wrap gap-2"><h1 class="h4 mb-0">Đơn ${esc(o.code)}</h1>${badge(o.status)}</div>
    <div class="small text-muted mb-3">Đặt lúc ${fdate(o.createdAt)} · ${PAY[o.paymentStatus]} · Thanh toán khi nhận hàng (COD)</div>
    <div class="row"><div class="col-md-6"><b>Người nhận:</b> ${esc(o.receiverName)}<br><b>Điện thoại:</b> ${esc(o.phone)}<br><b>Địa chỉ:</b> ${esc(o.address)}${o.note ? `<br><b>Ghi chú:</b> ${esc(o.note)}` : ''}</div></div>
    <div class="table-responsive mt-3"><table class="table"><thead><tr><th>Sản phẩm</th><th>Giá lúc mua</th><th>SL</th><th class="text-end">Thành tiền</th></tr></thead><tbody>${o.details.map(d => `<tr><td><a href="#/product/${d.productId}" class="text-decoration-none">${esc(d.productName)}</a></td><td>${vnd(d.unitPrice)}</td><td>${d.quantity}</td><td class="text-end">${vnd(d.lineTotal)}</td></tr>`).join('')}</tbody></table></div>
    <div class="text-end">Tạm tính: ${vnd(o.subtotal)}<br>${o.discount ? `Giảm giá${o.voucherCode ? ' (' + esc(o.voucherCode) + ')' : ''}: -${vnd(o.discount)}<br>` : ''}<span class="fs-5 fw-bold">Tổng: <span class="price">${vnd(o.total)}</span></span></div>
    ${o.status === 'Pending' ? `<button class="btn btn-outline-danger mt-3" data-act="cancelOrder" data-id="${o.id}">Hủy đơn hàng</button>` : ''}</div>`;
}

function needLogin() { go('/login?next=' + encodeURIComponent(location.hash.slice(1))); return null; }
const authForm = reg => `<div class="row justify-content-center"><div class="col-md-6 col-lg-5"><form class="panel" data-form="${reg ? 'register' : 'login'}"><h1 class="h4 mb-3">${reg ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h1>
  ${reg ? field('fullName', 'Họ tên', '', 'text', 'required maxlength="120"') + field('phone', 'Số điện thoại', '', 'tel') : ''}${field('email', 'Email', '', 'email', 'required')}${field('password', 'Mật khẩu', '', 'password', 'required minlength="8" autocomplete="' + (reg ? 'new' : 'current') + '-password"')}
  ${reg ? '<div class="form-text mb-3">Tối thiểu 8 ký tự, có chữ hoa và chữ số.</div>' : ''}<button class="btn btn-brand w-100" type="submit">${reg ? 'Đăng ký' : 'Đăng nhập'}</button>
  <div class="text-center mt-3 small">${reg ? 'Đã có tài khoản? <a href="#/login">Đăng nhập</a>' : 'Chưa có tài khoản? <a href="#/register">Đăng ký</a>'}</div>${window.DEMO_API && !reg ? window.DEMO_API.hint : ''}</form></div></div>`;
const login = () => authForm(false), register = () => authForm(true);

async function profile() {
  if (!S.user) return needLogin();
  const me = await api('GET', '/api/account/me');
  return `<h1 class="h3 mb-3">Tài khoản của tôi</h1><div class="row g-4"><div class="col-md-6"><form class="panel" data-form="profile"><h2 class="h5">Thông tin cá nhân</h2>${field('email', 'Email', me.email, 'text', 'disabled')}${field('fullName', 'Họ tên', me.fullName, 'text', 'required maxlength="120"')}${field('phone', 'Số điện thoại', me.phone || '', 'tel')}${field('address', 'Địa chỉ nhận hàng', me.address || '', 'text', 'maxlength="300"')}<button class="btn btn-brand" type="submit">Lưu thay đổi</button></form></div>
    <div class="col-md-6"><form class="panel" data-form="password"><h2 class="h5">Đổi mật khẩu</h2>${field('currentPassword', 'Mật khẩu hiện tại', '', 'password', 'required')}${field('newPassword', 'Mật khẩu mới', '', 'password', 'required minlength="8"')}<button class="btn btn-brand" type="submit">Đổi mật khẩu</button></form></div></div>`;
}

// ---------- Generic modal form ----------
function formModal(title, fields, vals, submit, size = '') {
  const id = 'm' + Date.now();
  const inp = f => {
    const v = vals[f.n] ?? f.def ?? '', t = f.t || 'text';
    if (t === 'checkbox') return `<div class="form-check mb-3"><input class="form-check-input" type="checkbox" name="${f.n}" id="${id}${f.n}" ${v ? 'checked' : ''}><label class="form-check-label" for="${id}${f.n}">${f.l}</label></div>`;
    let c;
    if (t === 'textarea') c = `<textarea class="form-control" name="${f.n}" rows="3">${esc(v)}</textarea>`;
    else if (t === 'select') c = `<select class="form-select" name="${f.n}">${f.opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    else if (t === 'file') c = `<input class="form-control" type="file" name="${f.n}" accept="image/png,image/jpeg,image/webp" multiple>`;
    else c = `<input class="form-control" type="${t}" name="${f.n}" value="${esc(t === 'date' && v ? String(v).slice(0, 10) : v)}" ${f.req ? 'required' : ''} ${t === 'number' ? 'step="any"' : ''} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>`;
    return `<div class="mb-3"><label class="form-label fw-bold">${f.l}</label>${c}${f.hint ? `<div class="form-text">${f.hint}</div>` : ''}</div>`;
  };
  $('#modalHost').innerHTML = `<div class="modal fade" id="${id}" tabindex="-1"><div class="modal-dialog modal-dialog-scrollable ${size}"><form class="modal-content"><div class="modal-header"><h5 class="modal-title">${title}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">${fields.map(inp).join('')}<div class="text-danger small modal-error"></div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Đóng</button><button type="submit" class="btn btn-brand">Lưu</button></div></form></div></div>`;
  const el = $('#' + id), modal = new bootstrap.Modal(el); modal.show();
  el.addEventListener('hidden.bs.modal', () => el.remove());
  el.querySelector('form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const f = ev.target, data = {}, files = [];
    fields.forEach(x => {
      const e = f.elements[x.n], t = x.t || 'text';
      if (t === 'checkbox') data[x.n] = e.checked;
      else if (t === 'file') files.push(...e.files);
      else if (t === 'number') data[x.n] = e.value === '' ? null : Number(e.value);
      else if (t === 'date') data[x.n] = e.value ? new Date(e.value + 'T23:59:59').toISOString() : null;
      else if (t === 'select') data[x.n] = (x.opts.find(o => String(o[0]) === e.value) || [e.value])[0];
      else data[x.n] = e.value.trim() === '' && !x.req ? null : e.value.trim();
    });
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try { await submit(data, files); modal.hide(); route(); }
    catch (err) { el.querySelector('.modal-error').textContent = err.message; btn.disabled = false; }
  });
  return modal;
}
function infoModal(title, html) {
  const id = 'm' + Date.now();
  $('#modalHost').innerHTML = `<div class="modal fade" id="${id}" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${title}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">${html}</div></div></div></div>`;
  const el = $('#' + id), m = new bootstrap.Modal(el); m.show(); el.addEventListener('hidden.bs.modal', () => el.remove()); return m;
}

// ---------- Admin ----------
const AD = { products: { page: 1, search: '' }, orders: { page: 1, search: '', status: '' }, users: { page: 1, search: '' }, period: 'day' };
const TABS = [['dashboard', 'Tổng quan'], ['products', 'Sản phẩm'], ['categories', 'Danh mục'], ['orders', 'Đơn hàng'], ['users', 'Tài khoản'], ['vouchers', 'Mã giảm giá'], ['reviews', 'Đánh giá'], ['audit', 'Nhật ký']];
const ADMIN_ONLY_TABS = ['categories', 'vouchers', 'audit'];
const shell = (tab, inner) => `<h1 class="h3 mb-3">Quản trị</h1><ul class="nav nav-pills mb-3 flex-wrap gap-1">${TABS.filter(t => !ADMIN_ONLY_TABS.includes(t[0]) || isAdmin()).map(t => `<li class="nav-item"><a class="nav-link ${t[0] === tab ? 'active' : ''}" href="#/admin/${t[0]}">${t[1]}</a></li>`).join('')}</ul>${inner}`;
const onoff = v => v ? '<span class="badge bg-success">Hoạt động</span>' : '<span class="badge bg-secondary">Ngừng</span>';
const apager = (total, page, size) => pager(total, page, size, i => `href="#" data-act="apage" data-page="${i}"`);
const searchBar = (tab, extra = '') => `<form class="d-flex gap-2 mb-3 flex-wrap" data-form="aSearch" data-tab="${tab}"><input class="form-control" style="max-width:280px" name="search" placeholder="Tìm kiếm..." value="${esc(AD[tab].search)}">${extra}<button class="btn btn-outline-brand" type="submit">Tìm</button></form>`;

async function admin(tab) {
  if (!S.user) return needLogin();
  if (!isStaff()) return '<div class="alert alert-danger">Bạn không có quyền truy cập trang quản trị.</div>';
  tab = tab || 'dashboard';
  if (ADMIN_ONLY_TABS.includes(tab) && !isAdmin()) return '<div class="alert alert-danger">Chỉ Admin được quản lý mục này.</div>';
  const v = ADMIN[tab]; if (!v) return empty('Không tìm thấy mục quản trị.');
  return shell(tab, await v());
}
const ADMIN = {
  async dashboard() {
    const d = await api('GET', '/api/admin/dashboard' + qs({ period: AD.period }));
    const max = Math.max(...d.series.map(s => s.revenue), 1), any = d.series.some(s => s.revenue > 0);
    return `<div class="row g-3 mb-4">${[['Tổng doanh thu (đơn đã giao)', vnd(d.totalRevenue)], ['Tổng số đơn (không tính đã hủy)', d.totalOrders], ['Đơn chờ xử lý', d.pendingOrders], ['Sản phẩm đang kinh doanh', d.activeProducts], ['Sản phẩm sắp hết hàng', d.lowStockProducts]].map(s => `<div class="col-6 col-lg"><div class="stat"><small class="text-muted">${s[0]}</small><b>${s[1]}</b></div></div>`).join('')}</div>
    <div class="panel mb-3"><div class="d-flex justify-content-between flex-wrap gap-2 mb-2"><h2 class="h5 mb-0">Doanh thu</h2><div class="btn-group btn-group-sm">${[['day', 'Theo ngày'], ['month', 'Theo tháng'], ['year', 'Theo năm']].map(p => `<button class="btn btn-${AD.period === p[0] ? 'brand' : 'outline-brand'}" data-act="period" data-p="${p[0]}">${p[1]}</button>`).join('')}</div></div>
    ${any ? `<div class="bars">${d.series.map(s => `<div class="bar-col" title="${s.label}: ${vnd(s.revenue)} (${s.orders} đơn)"><div class="bar" style="height:${Math.round(s.revenue / max * 100)}%"></div><div class="bar-lbl">${s.label}</div></div>`).join('')}</div>` : empty('Chưa có doanh thu từ đơn hàng đã giao trong khoảng thời gian này.')}</div>
    <div class="panel"><h2 class="h5">Sản phẩm sắp hết hàng (≤ 5)</h2>${d.lowStockList.length ? `<ul class="mb-0">${d.lowStockList.map(p => `<li>${esc(p.name)} – còn <b>${p.stock}</b></li>`).join('')}</ul>` : '<div class="text-muted">Không có.</div>'}</div>`;
  },
  async products() {
    const st = AD.products;
    const r = await api('GET', '/api/products' + qs({ includeInactive: true, search: st.search, page: st.page, pageSize: 10, sort: 'newest' }));
    return `<div class="d-flex justify-content-between flex-wrap gap-2"><div>${searchBar('products')}</div>${isAdmin() ? '<div><button class="btn btn-brand" data-act="prodAdd">+ Thêm sản phẩm</button></div>' : '<div class="text-muted small">Nhân viên chỉ được xem tồn kho và thông tin sản phẩm.</div>'}</div>
    <div class="panel table-responsive"><table class="table table-sm align-middle"><thead><tr><th></th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Tồn</th><th>Trạng thái</th><th></th></tr></thead><tbody>
    ${r.items.map(p => `<tr><td><img src="${esc(img(p.imageUrl))}" width="44" height="44" class="rounded" style="object-fit:cover" alt=""></td><td class="fw-bold">${esc(p.name)}${p.isFeatured ? ' <span class="badge bg-warning text-dark">Nổi bật</span>' : ''}</td><td>${esc(p.categoryName)}</td>
      <td>${vnd(p.effectivePrice)}${p.salePrice ? `<div class="small text-muted text-decoration-line-through">${vnd(p.price)}</div>` : ''}</td><td class="${p.stock <= 5 ? 'text-danger fw-bold' : ''}">${p.stock}</td><td>${onoff(p.isActive)}</td>
      <td class="text-nowrap">${isAdmin() ? `<button class="btn btn-sm btn-outline-brand" data-act="prodEdit" data-id="${p.id}">Sửa</button> <button class="btn btn-sm btn-outline-secondary" data-act="prodImages" data-id="${p.id}">Ảnh</button> <button class="btn btn-sm btn-outline-${p.isActive ? 'danger' : 'success'}" data-act="prodToggle" data-id="${p.id}">${p.isActive ? 'Ngừng bán' : 'Bán lại'}</button>` : '<span class="text-muted small">Chỉ xem</span>'}</td></tr>`).join('')}</tbody></table>
    ${r.items.length ? '' : empty('Chưa có sản phẩm.')}${apager(r.total, st.page, 10)}</div>`;
  },
  categories: () => crudView('categories'),
  async orders() {
    const st = AD.orders;
    const r = await api('GET', '/api/admin/orders' + qs({ search: st.search, status: st.status, page: st.page, pageSize: 10 }));
    return searchBar('orders', `<select class="form-select" style="max-width:180px" name="status"><option value="">Mọi trạng thái</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${st.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`) +
      `<div class="panel table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Mã đơn</th><th>Khách</th><th>Ngày</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${r.items.map(o => `<tr><td class="fw-bold">${esc(o.code)}</td><td>${esc(o.receiverName)}<div class="small text-muted">${esc(o.customerEmail || '')}</div></td><td>${fdate(o.createdAt)}</td><td>${vnd(o.total)}</td><td>${PAY[o.paymentStatus]}</td><td>${badge(o.status)}</td><td><button class="btn btn-sm btn-outline-brand" data-act="orderOpen" data-id="${o.id}">Chi tiết</button></td></tr>`).join('')}</tbody></table>
      ${r.items.length ? '' : empty('Không có đơn hàng.')}${apager(r.total, st.page, 10)}</div>`;
  },
  async users() {
    const st = AD.users;
    const r = await api('GET', '/api/admin/users' + qs({ search: st.search, page: st.page }));
    return `<div class="d-flex justify-content-between flex-wrap gap-2"><div>${searchBar('users')}</div>${isAdmin() ? '<div><button class="btn btn-brand" data-act="staffAdd">+ Tạo tài khoản Nhân viên</button></div>' : ''}</div>
    <div class="panel table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead><tbody>
    ${r.items.map(u => { const me = u.id === S.user.id, locked = u.isLocked, canLock = !me && (isAdmin() || u.roles.includes('Customer')); return `<tr><td>${esc(u.fullName)}</td><td>${esc(u.email)}</td><td>${isAdmin() && !me ? `<select class="form-select form-select-sm" data-change="role" data-id="${u.id}">${[['Customer', 'Khách hàng'], ['Manager', 'Nhân viên'], ['Admin', 'Admin']].map(o => `<option value="${o[0]}" ${u.roles.includes(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>` : esc(u.roles.join(', '))}</td>
      <td>${locked ? '<span class="badge bg-danger">Đã khóa</span>' : '<span class="badge bg-success">Hoạt động</span>'}</td><td>${canLock ? `<button class="btn btn-sm btn-outline-${locked ? 'success' : 'danger'}" data-act="userLock" data-id="${u.id}" data-lock="${!locked}">${locked ? 'Mở khóa' : 'Khóa'}</button>` : ''}</td></tr>`; }).join('')}</tbody></table>${apager(r.total, st.page, 20)}</div>`;
  },
  vouchers: () => crudView('vouchers'),
  async reviews() {
    const list = await api('GET', '/api/reviews/admin');
    return `<div class="panel table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Sản phẩm</th><th>Khách</th><th>Sao</th><th>Nhận xét</th><th>Trạng thái</th><th></th></tr></thead><tbody>${list.map(r => `<tr><td>${esc(r.productName)}</td><td>${esc(r.userName)}</td><td class="stars">${stars(r.rating)}</td><td>${esc(r.comment || '')}</td><td>${r.isHidden ? '<span class="badge bg-secondary">Đã ẩn</span>' : '<span class="badge bg-success">Hiển thị</span>'}</td>
      <td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary" data-act="revHide" data-id="${r.id}" data-hide="${!r.isHidden}">${r.isHidden ? 'Hiện' : 'Ẩn'}</button> ${isAdmin() ? `<button class="btn btn-sm btn-outline-danger" data-act="revDel" data-id="${r.id}">Xóa</button>` : ''}</td></tr>`).join('')}</tbody></table>${list.length ? '' : empty('Chưa có đánh giá.')}</div>`;
  },
  async audit() {
    if (!isAdmin()) return '<div class="alert alert-danger">Chỉ Admin được xem nhật ký thao tác.</div>';
    const list = await api('GET', '/api/admin/audit-logs');
    return `<div class="panel table-responsive"><table class="table table-sm"><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th><th>Chi tiết</th></tr></thead><tbody>${list.map(l => `<tr><td>${fdate(l.createdAt)}</td><td>${esc(l.userEmail || '')}</td><td>${esc(l.action)}</td><td>${esc(l.detail)}</td></tr>`).join('')}</tbody></table>${list.length ? '' : empty('Chưa có thao tác nào.')}</div>`;
  }
};

const CRUD = {
  categories: { list: '/api/categories?all=true', base: '/api/categories', title: 'danh mục', cols: [['Tên', c => `<b>${esc(c.name)}</b>`], ['Mô tả', c => esc(c.description || '')], ['Sản phẩm', c => c.productCount], ['Trạng thái', c => onoff(c.isActive)]],
    fields: [{ n: 'name', l: 'Tên danh mục', req: 1 }, { n: 'description', l: 'Mô tả', t: 'textarea' }, { n: 'isActive', l: 'Đang hoạt động', t: 'checkbox', def: true }] },
  vouchers: { list: '/api/vouchers', base: '/api/vouchers', title: 'mã giảm giá', cols: [['Mã', v => `<b>${esc(v.code)}</b>`], ['Giảm', v => v.discountPercent ? v.discountPercent + '%' : vnd(v.discountAmount)], ['Đơn tối thiểu', v => vnd(v.minOrder)], ['Đã dùng', v => v.usedCount + (v.maxUses ? '/' + v.maxUses : '')], ['Hết hạn', v => v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('vi-VN') : '—'], ['Trạng thái', v => onoff(v.isActive)]],
    fields: [{ n: 'code', l: 'Mã', req: 1 }, { n: 'discountPercent', l: 'Giảm theo %', t: 'number', hint: 'Chọn một trong hai: % hoặc số tiền' }, { n: 'discountAmount', l: 'Giảm số tiền (₫)', t: 'number' }, { n: 'minOrder', l: 'Đơn tối thiểu (₫)', t: 'number', def: 0 }, { n: 'maxUses', l: 'Số lượt dùng tối đa', t: 'number' }, { n: 'expiresAt', l: 'Ngày hết hạn', t: 'date' }, { n: 'isActive', l: 'Đang hoạt động', t: 'checkbox', def: true }] }
};
const CUR = {};
async function crudView(key) {
  const c = CRUD[key], items = await api('GET', c.list); CUR[key] = items;
  return `<div class="mb-3"><button class="btn btn-brand" data-act="crudAdd" data-key="${key}">+ Thêm ${c.title}</button></div><div class="panel table-responsive"><table class="table table-sm align-middle"><thead><tr>${c.cols.map(x => `<th>${x[0]}</th>`).join('')}<th></th></tr></thead><tbody>
    ${items.map(i => `<tr>${c.cols.map(x => `<td>${x[1](i)}</td>`).join('')}<td class="text-nowrap"><button class="btn btn-sm btn-outline-brand" data-act="crudEdit" data-key="${key}" data-id="${i.id}">Sửa</button> <button class="btn btn-sm btn-outline-danger" data-act="crudDel" data-key="${key}" data-id="${i.id}">Xóa</button></td></tr>`).join('')}</tbody></table>${items.length ? '' : empty('Chưa có dữ liệu.')}</div>`;
}

// ---------- Actions ----------
const A = {
  logout() { setAuth(null); go('/'); toast('Đã đăng xuất.'); },
  thumb(el) { $('#mainImg').src = el.dataset.src; },
  async addCart(el) {
    if (!S.user) return needLogin();
    const q = el.dataset.qty ? Math.max(1, +$(el.dataset.qty).value || 1) : 1;
    await api('POST', '/api/cart/items', { productId: +el.dataset.id, quantity: q });
    await refreshCart(); toast('Đã thêm vào giỏ hàng.');
  },
  async cartRemove(el) { await api('DELETE', '/api/cart/items/' + el.dataset.id); await refreshCart(); route(); },
  async applyVoucher() {
    const code = $('#voucherCode').value.trim(), msg = $('#voucherMsg'), sub = +$('#sumSub').dataset.v;
    if (!code) { msg.textContent = ''; return; }
    try { const r = await api('GET', '/api/vouchers/validate' + qs({ code, subtotal: sub })); msg.className = 'form-text text-success'; msg.textContent = 'Đã áp dụng mã ' + r.code; $('#sumDisc').textContent = '-' + vnd(r.discount); $('#sumTotal').textContent = vnd(r.total); }
    catch (e) { msg.className = 'form-text text-danger'; msg.textContent = e.message; $('#sumDisc').textContent = '0₫'; $('#sumTotal').textContent = vnd(sub); }
  },
  async cancelOrder(el) { if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return; await api('POST', `/api/orders/${el.dataset.id}/cancel`); toast('Đã hủy đơn hàng.'); route(); },
  async delReview(el) { if (!confirm('Xóa đánh giá của bạn?')) return; await api('DELETE', '/api/reviews/' + el.dataset.id); route(); },
  period(el) { AD.period = el.dataset.p; route(); },
  apage(el) { const t = location.hash.split('/')[2] || 'dashboard'; AD[t].page = +el.dataset.page; route(); },
  // sản phẩm
  async prodAdd() { prodForm(null); },
  async prodEdit(el) { prodForm(await api('GET', '/api/products/' + el.dataset.id)); },
  async prodToggle(el) {
    const p = await api('GET', '/api/products/' + el.dataset.id);
    if (p.isActive) { if (!confirm('Ngừng kinh doanh sản phẩm này? Lịch sử đơn hàng vẫn được giữ.')) return; await api('DELETE', '/api/products/' + p.id); }
    else await api('PUT', '/api/products/' + p.id, { ...p, isActive: true });
    toast('Đã cập nhật.'); route();
  },
  async prodImages(el) {
    const p = await api('GET', '/api/products/' + el.dataset.id);
    infoModal('Ảnh sản phẩm: ' + esc(p.name), `<div class="d-flex flex-wrap gap-3 mb-3">${p.images.length ? p.images.map(i => `<div class="text-center"><img src="${esc(img(i.url))}" width="110" height="110" class="rounded" style="object-fit:cover" alt=""><div><button class="btn btn-sm btn-link text-danger" data-act="imgDel" data-id="${i.id}">Xóa</button></div></div>`).join('') : '<div class="text-muted">Chưa có ảnh. Sản phẩm đang hiển thị ảnh placeholder.</div>'}</div>
      <form data-form="imgUpload" data-id="${p.id}"><input class="form-control mb-2" type="file" name="files" accept="image/png,image/jpeg,image/webp" multiple required><div class="form-text mb-2">JPG, PNG hoặc WEBP, tối đa 5MB mỗi ảnh, tối đa 8 ảnh.</div><button class="btn btn-brand" type="submit">Tải lên</button></form>`);
  },
  async imgDel(el) { if (!confirm('Xóa ảnh này?')) return; await api('DELETE', '/api/products/images/' + el.dataset.id); bootstrap.Modal.getInstance($('.modal'))?.hide(); toast('Đã xóa ảnh.'); route(); },
  // CRUD chung
  crudAdd(el) { crudForm(el.dataset.key, null); },
  crudEdit(el) { crudForm(el.dataset.key, CUR[el.dataset.key].find(i => i.id == el.dataset.id)); },
  async crudDel(el) { if (!confirm('Xác nhận xóa?')) return; await api('DELETE', `${CRUD[el.dataset.key].base}/${el.dataset.id}`); toast('Đã xóa.'); route(); },
  // đơn hàng
  async orderOpen(el) {
    const o = await api('GET', '/api/orders/' + el.dataset.id);
    infoModal('Đơn ' + esc(o.code), `<div class="mb-2">${badge(o.status)} · ${PAY[o.paymentStatus]} · COD</div><div class="small mb-2"><b>Người nhận:</b> ${esc(o.receiverName)} · ${esc(o.phone)}<br><b>Địa chỉ:</b> ${esc(o.address)}${o.note ? `<br><b>Ghi chú:</b> ${esc(o.note)}` : ''}</div>
      <table class="table table-sm"><thead><tr><th>Sản phẩm</th><th>Giá lúc mua</th><th>SL</th><th class="text-end">Thành tiền</th></tr></thead><tbody>${o.details.map(d => `<tr><td>${esc(d.productName)}</td><td>${vnd(d.unitPrice)}</td><td>${d.quantity}</td><td class="text-end">${vnd(d.lineTotal)}</td></tr>`).join('')}</tbody></table>
      <div class="text-end mb-3">${o.discount ? `Giảm giá: -${vnd(o.discount)}<br>` : ''}<b>Tổng: ${vnd(o.total)}</b></div>
      <div class="d-flex flex-wrap gap-2">${o.nextStatuses.map(s => `<button class="btn btn-sm btn-${s === 'Cancelled' ? 'outline-danger' : 'brand'}" data-act="orderStatus" data-id="${o.id}" data-s="${s}">${s === 'Cancelled' ? 'Hủy đơn' : '→ ' + STATUS[s][0]}</button>`).join('')}
      ${o.status !== 'Cancelled' ? `<button class="btn btn-sm btn-outline-secondary" data-act="orderPay" data-id="${o.id}" data-s="${o.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}">Đánh dấu ${o.paymentStatus === 'Paid' ? 'chưa thanh toán' : 'đã thanh toán'}</button>` : ''}</div>`);
  },
  async orderStatus(el) { if (el.dataset.s === 'Cancelled' && !confirm('Hủy đơn hàng này? Tồn kho sẽ được hoàn lại.')) return; await api('PUT', `/api/admin/orders/${el.dataset.id}/status`, { status: el.dataset.s }); bootstrap.Modal.getInstance($('.modal'))?.hide(); toast('Đã cập nhật trạng thái đơn.'); route(); },
  async orderPay(el) { await api('PUT', `/api/admin/orders/${el.dataset.id}/payment`, { status: el.dataset.s }); bootstrap.Modal.getInstance($('.modal'))?.hide(); toast('Đã cập nhật thanh toán.'); route(); },
  async userLock(el) { await api('PUT', `/api/admin/users/${el.dataset.id}/lock`, { locked: el.dataset.lock === 'true' }); toast('Đã cập nhật tài khoản.'); route(); },
  staffAdd() { formModal('Tạo tài khoản Nhân viên', [{ n: 'fullName', l: 'Họ tên', req: 1 }, { n: 'email', l: 'Email', t: 'email', req: 1 }, { n: 'password', l: 'Mật khẩu ban đầu', t: 'password', req: 1, hint: 'Tối thiểu 8 ký tự, có chữ hoa và chữ số.' }], {}, d => api('POST', '/api/admin/staff', d)); },
  async revHide(el) { await api('PUT', `/api/reviews/${el.dataset.id}/visibility`, { isHidden: el.dataset.hide === 'true' }); route(); },
  async revDel(el) { if (!confirm('Xóa đánh giá này?')) return; await api('DELETE', '/api/reviews/' + el.dataset.id); route(); }
};
async function prodForm(p) {
  const cats = await api('GET', '/api/categories?all=true');
  const fields = [{ n: 'name', l: 'Tên sản phẩm', req: 1 }, { n: 'categoryId', l: 'Danh mục', t: 'select', opts: cats.map(c => [c.id, c.name]) }, { n: 'price', l: 'Giá bán (₫)', t: 'number', req: 1 }, { n: 'salePrice', l: 'Giá khuyến mãi (₫)', t: 'number', hint: 'Để trống nếu không khuyến mãi; phải nhỏ hơn giá bán.' },
    { n: 'stock', l: 'Tồn kho', t: 'number', req: 1 }, { n: 'scent', l: 'Mùi hương' }, { n: 'volume', l: 'Dung tích / khối lượng', ph: 'vd: 200g' }, { n: 'burnTimeHours', l: 'Thời gian cháy (giờ)', t: 'number' },
    { n: 'description', l: 'Mô tả', t: 'textarea' }, { n: 'isActive', l: 'Đang kinh doanh', t: 'checkbox', def: true }, { n: 'isFeatured', l: 'Sản phẩm nổi bật', t: 'checkbox' }];
  if (!p) fields.push({ n: 'images', l: 'Ảnh sản phẩm', t: 'file', hint: 'Có thể thêm sau trong mục "Ảnh".' });
  formModal(p ? 'Sửa sản phẩm' : 'Thêm sản phẩm', fields, p || {}, async (d, files) => {
    const saved = await api(p ? 'PUT' : 'POST', '/api/products' + (p ? '/' + p.id : ''), d);
    for (const f of files) { const fd = new FormData(); fd.append('file', f); await api('POST', `/api/products/${saved.id}/images`, fd, true); }
    toast('Đã lưu sản phẩm.');
  }, 'modal-lg');
}
function crudForm(key, item) {
  const c = CRUD[key];
  formModal((item ? 'Sửa ' : 'Thêm ') + c.title, c.fields, item || {}, async d => { await api(item ? 'PUT' : 'POST', c.base + (item ? '/' + item.id : ''), d); toast('Đã lưu.'); });
}

// ---------- Forms / change handlers ----------
const F = {
  navSearch(f) { go('/products' + qs({ search: f.elements.q.value.trim() })); $('#navc')?.classList.remove('show'); },
  filter(f) { const g = n => f.elements[n].value; go('/products' + qs({ search: g('search').trim(), categoryId: g('categoryId'), minPrice: g('minPrice'), maxPrice: g('maxPrice'), inStock: f.elements.inStock.checked, sort: g('sort') })); },
  async login(f) {
    const a = await api('POST', '/api/account/login', { email: f.elements.email.value.trim(), password: f.elements.password.value });
    setAuth(a); await refreshCart(); toast('Xin chào ' + a.user.fullName + '!');
    const next = new URLSearchParams(location.hash.split('?')[1] || '').get('next'); go(next && next.startsWith('/') ? next : '/');
  },
  async register(f) {
    const a = await api('POST', '/api/account/register', { fullName: f.elements.fullName.value.trim(), email: f.elements.email.value.trim(), password: f.elements.password.value, phone: f.elements.phone.value.trim() || null });
    setAuth(a); toast('Đăng ký thành công!'); go('/');
  },
  async profile(f) { const me = await api('PUT', '/api/account/me', { fullName: f.elements.fullName.value.trim(), phone: f.elements.phone.value.trim() || null, address: f.elements.address.value.trim() || null }); setAuth({ token: S.token, user: me }); toast('Đã lưu thông tin.'); },
  async password(f) { await api('POST', '/api/account/change-password', { currentPassword: f.elements.currentPassword.value, newPassword: f.elements.newPassword.value }); f.reset(); toast('Đã đổi mật khẩu.'); },
  async review(f) { await api('POST', '/api/reviews', { productId: +f.elements.productId.value, rating: +f.elements.rating.value, comment: f.elements.comment.value.trim() || null }); toast('Cảm ơn bạn đã đánh giá!'); route(); },
  async checkout(f) {
    const o = await api('POST', '/api/orders', { receiverName: f.elements.receiverName.value.trim(), phone: f.elements.phone.value.trim(), address: f.elements.address.value.trim(), note: f.elements.note.value.trim() || null, voucherCode: f.elements.voucherCode.value.trim() || null, paymentMethod: 'Cod', idempotencyKey: checkoutKey });
    checkoutKey = null; await refreshCart(); loadStats(false).then(renderFooter); toast('Đặt hàng thành công! Mã đơn: ' + o.code); go('/order/' + o.id);
  },
  aSearch(f) { const t = f.dataset.tab; AD[t].search = f.elements.search.value.trim(); if (f.elements.status) AD[t].status = f.elements.status.value; AD[t].page = 1; route(); },
  async imgUpload(f) {
    for (const file of f.elements.files.files) { const fd = new FormData(); fd.append('file', file); await api('POST', `/api/products/${f.dataset.id}/images`, fd, true); }
    bootstrap.Modal.getInstance($('.modal'))?.hide(); toast('Đã tải ảnh lên.'); route();
  }
};
const CH = {
  async cartQty(el) { try { await api('PUT', '/api/cart/items/' + el.dataset.id, { quantity: Math.max(1, +el.value || 1) }); await refreshCart(); } catch (e) { toast(e.message, 'danger'); } route(); },
  async role(el) { try { await api('PUT', `/api/admin/users/${el.dataset.id}/role`, { role: el.value }); toast('Đã đổi vai trò.'); } catch (e) { toast(e.message, 'danger'); } route(); }
};
document.addEventListener('click', async e => {
  const routeLink = e.target.closest('#nav .navbar-collapse a[href^="#/"]');
  const navCollapse = document.getElementById('navc');
  if (routeLink && navCollapse && navCollapse.classList.contains('show') && window.bootstrap?.Collapse) bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
  const el = e.target.closest('[data-act]'); if (!el || !A[el.dataset.act]) return;
  if (el.tagName === 'A') e.preventDefault();
  if (el.dataset.busy) return; el.dataset.busy = 1;
  try { await A[el.dataset.act](el); } catch (err) { toast(err.message, 'danger'); } finally { delete el.dataset.busy; }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f || !F[f.dataset.form]) return;
  e.preventDefault(); const btn = f.querySelector('[type=submit]'); if (btn) btn.disabled = true;
  try { await F[f.dataset.form](f); } catch (err) { toast(err.message, 'danger'); } finally { if (btn) btn.disabled = false; }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CH[el.dataset.change]) CH[el.dataset.change](el); });
document.addEventListener('error', e => { const t = e.target; if (t.tagName === 'IMG' && !t.dataset.fb && t.src !== PLACEHOLDER) { t.dataset.fb = 1; t.src = PLACEHOLDER; } }, true);

// ---------- Router ----------
const routes = [[/^\/$/, home], [/^\/products$/, products], [/^\/product\/(\d+)$/, productDetail], [/^\/cart$/, cart], [/^\/checkout$/, checkout], [/^\/orders$/, orders], [/^\/order\/(\d+)$/, orderDetail],
  [/^\/login$/, login], [/^\/register$/, register], [/^\/profile$/, profile], [/^\/admin(?:\/(\w+))?$/, admin]];
let seq = 0;
async function route() {
  const my = ++seq, h = location.hash.slice(1) || '/', [path, query = ''] = h.split('?'), params = Object.fromEntries(new URLSearchParams(query));
  const app = $('#app');
  document.title = 'The Aura Candle – ' + (B.tagline || '');
  bootstrap.Collapse.getInstance($('#navc'))?.hide();
  for (const [re, fn] of routes) {
    const m = path.match(re); if (!m) continue;
    if (!document.querySelector('.modal.show')) app.innerHTML = spinner;
    try {
      const html = await fn(...m.slice(1), params);
      if (my !== seq || html == null) return;
      app.innerHTML = html;
    } catch (err) { if (my === seq) app.innerHTML = `<div class="alert alert-danger">${esc(err.message)}</div>`; }
    return;
  }
  app.innerHTML = empty('Không tìm thấy trang.');
}
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); route(); });

// Thống kê hiển thị: lượt truy cập được ghi nhận 1 lần cho mỗi phiên trình duyệt (sessionStorage), lỗi thì bỏ qua và ẩn phần thống kê.
async function loadStats(countVisit = true) {
  let first = false;
  if (countVisit) { try { first = !sessionStorage.getItem('aura_visited'); } catch { first = false; } }
  try {
    S.stats = first ? await api('POST', '/api/stats/visit') : await api('GET', '/api/stats');
    if (first) { try { sessionStorage.setItem('aura_visited', '1'); } catch { } }
  } catch { }
}

(async function init() {
  renderNav(); renderFooter();
  try { S.cats = await api('GET', '/api/categories'); } catch { }
  await loadStats(); renderFooter();
  if (S.user) { try { await api('GET', '/api/account/me'); } catch { } await refreshCart(); }
  route();
})();
})();

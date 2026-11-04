// ====== BẢN DEMO ======: giả lập Backend trong trình duyệt để xem giao diện. KHÔNG dùng cho bản chạy thật.
(function () {
  const day = 864e5, eff = p => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
  const E = m => { throw new Error(m); };
  const cats = [[6, "Nến decor", null], [3, "Nến hộp thiếc", "Nến hộp thiếc nhỏ gọn, tiện mang theo khi đi du lịch hoặc làm quà nhỏ."], [2, "Nến hũ thủy tinh", "Nến hũ thủy tinh nắp đậy dung tích lớn, thời gian cháy dài, hợp phòng khách."], [1, "Nến ly", "Nến thơm đổ ly dung tích 100g–200g, dễ dùng, phù hợp phòng ngủ, bàn làm việc."], [5, "Phụ kiện nến", "Kéo cắt bấc, dụng cụ tắt nến, đế nến và các phụ kiện đi kèm."], [4, "Set quà tặng", "Combo nến đóng hộp, hợp tặng sinh nhật, tân gia, quà tri ân."]].map(c => ({ id: c[0], name: c[1], description: c[2], isActive: true }));
  const mk = (id, name, c, price, sale, scent, vol, burn, stock, _x, feat, ago, description, images) => ({ id, name, description, price, salePrice: sale, scent, volume: vol, burnTimeHours: burn, stock, isActive: true, isFeatured: feat, categoryId: c, createdAt: Date.now() - ago * day, images });
  let products = [
    mk(32, "Đèn đốt nến thơm", 5, 150000, 139999, "", "", null, 45, 0, false, 0, null, [{"id": 1, "url": "images/products/32-1.jpg"}, {"id": 2, "url": "images/products/32-2.jpg"}]),
    mk(31, "Sao Biển Xanh Ngọc", 6, 80000, null, "", "300g", null, 25, 0, false, 1, null, [{"id": 3, "url": "images/products/31-1.jpg"}]),
    mk(30, "Hộp Quà Giấc Mơ Tiên Cá", 4, 350000, null, "", "800g", null, 5, 0, true, 2, "Set quà nến thơm mang cả đại dương mát lành về góc phòng của bạn. Sự kết hợp tinh tế giữa sáp gel xanh ngọc trong vắt, khay gốm sao biển, vỏ ốc cùng tiểu cảnh nàng tiên cá mang hương gió biển và muối mặn thanh khiết, giúp xoa dịu căng thẳng và thắp sáng năng lượng bình yên mùa hạ.  \nSet quà bao gồm: \n01 Nến gel khay gốm sao biển xanh ngọc đính vỏ ốc và hạt cườm lấp lánh   \n01 Nến gel khay gốm vỏ ốc xoắn màu trắng tinh tế   \n01 Nến ly thủy tinh gel xanh biển (tùy chọn mẫu tiểu cảnh nàng tiên cá hoặc rải sỏi đá tự nhiên)   \n01 Phao bơi mini sọc xanh trắng decor xinh xắn   San hô khô và các mảnh vỏ sò tự nhiên trang trí kèm   \n01 Thiệp chúc mừng đi kèm (hỗ trợ viết lời chúc theo yêu cầu)\nHộp quà giấy kraft mộc mạc, chỉn chu kèm lót bảo vệ chống vỡ", [{"id": 4, "url": "images/products/30-1.jpg"}]),
    mk(28, "Ốc Biển Xanh Ngọc", 6, 80000, null, "", "150", null, 35, 0, true, 3, null, [{"id": 5, "url": "images/products/28-1.jpg"}]),
    mk(22, "Ốc Đảo Biển Sâu", 2, 40000, null, "Coastal Sun & Coconut Water", "200g", null, 8, 0, false, 4, null, [{"id": 6, "url": "images/products/22-1.jpg"}]),
    mk(21, "Tiểu Tiên Cá Biển Xanh", 4, 150000, null, "Ocean Breeze & Sea Salt", "300g", 0, 20, 0, true, 5, null, [{"id": 7, "url": "images/products/21-1.jpg"}]),
    mk(20, "SET 3 HŨ NẾN THƠM HƯƠNG BIỂN", 2, 150000, 120000, "Aquatic", "800g", null, 100, 0, true, 6, null, [{"id": 8, "url": "images/products/20-1.jpg"}]),
    mk(14, "Set quà Mùa Hè (3 nến thiếc)", 4, 249000, 219000, "Tuyển chọn 3 mùi", "3 x 50g", 36, 34, 0, true, 7, "Hộp quà gồm 3 nến thiếc 50g: Cam bergamot, Chanh sả, Dừa.", [{"id": 9, "url": "images/products/14-1.jpg"}]),
    mk(1, "Nến ly Biển Xanh 100g", 1, 119000, null, "Muối biển & rong biển", "100g", 25, 79, 0, true, 8, "Nến ly hương biển tươi mát, gợi cảm giác gió muối và nắng sớm.", [{"id": 10, "url": "images/products/1-1.jpg"}]),
    mk(3, "Nến ly Dừa Nắng 100g", 1, 109000, null, "Dừa & vani", "100g", 25, 89, 0, true, 9, "Hương dừa non ngọt dịu, hậu vani ấm áp.", [{"id": 11, "url": "images/products/3-1.jpg"}]),
    mk(11, "Nến thiếc Cam Bergamot 50g", 3, 69000, null, "Cam bergamot", "50g", 12, 119, 0, false, 10, "Hộp thiếc nhỏ gọn, hương cam bergamot tươi sáng.", [{"id": 12, "url": "images/products/11-1.jpg"}]),
    mk(10, "Nến hũ Quế Táo 300g", 2, 319000, null, "Quế & táo đỏ", "300g", 65, 29, 0, false, 11, "Hương quế và táo ấm áp, hợp những ngày se lạnh.", [{"id": 13, "url": "images/products/10-1.jpg"}]),
    mk(15, "Set quà Thư Giãn (nến ly + kéo cắt bấc)", 4, 329000, null, "Oải hương", "200g + phụ kiện", 45, 24, 0, true, 12, "Gồm 1 nến ly 200g Oải hương và kéo cắt bấc.", [{"id": 14, "url": "images/products/15-1.jpg"}]),
    mk(5, "Nến ly Hoa Sứ 100g", 1, 119000, null, "Hoa sứ & hoa nhài", "100g", 25, 69, 0, false, 13, "Hương hoa sứ, hoa nhài thanh nhẹ và nữ tính.", [{"id": 15, "url": "images/products/5-1.jpg"}]),
    mk(16, "Set quà Cao Cấp (2 nến hũ + dụng cụ tắt nến)", 4, 599000, 549000, "Gỗ đàn hương & trà trắng", "2 x 250g", 110, 19, 0, true, 14, "Gồm 2 nến hũ 250g (Gỗ đàn hương, Trà trắng) và dụng cụ tắt nến.", [{"id": 16, "url": "images/products/16-1.jpg"}, {"id": 17, "url": "images/products/16-2.jpg"}, {"id": 18, "url": "images/products/16-3.jpg"}]),
    mk(8, "Nến hũ Gỗ Đàn Hương 250g", 2, 289000, 259000, "Gỗ đàn hương & hổ phách", "250g", 55, 40, 0, true, 15, "Hương gỗ đàn hương ấm, trầm, sang trọng; hũ thủy tinh có nắp đậy.", [{"id": 19, "url": "images/products/8-1.jpg"}]),
    mk(13, "Nến thiếc Vani 80g", 3, 89000, null, "Vani & caramel", "80g", 20, 95, 0, false, 16, "Hương vani ngọt nhẹ, hộp thiếc tiện mang đi du lịch.", [{"id": 20, "url": "images/products/13-1.jpg"}]),
    mk(7, "Nến ly Oải Hương 200g", 1, 209000, null, "Oải hương (lavender)", "200g", 45, 45, 0, true, 57, "Hương oải hương êm dịu, thích hợp thắp trước giờ ngủ.", [{"id": 21, "url": "images/products/7-1.jpg"}]),
    mk(19, "Đế đặt nến thủy tinh", 5, 79000, null, "", "1 cái", null, 45, 0, false, 58, "Đế thủy tinh chịu nhiệt, bảo vệ mặt bàn khi thắp nến.", []),
    mk(4, "Nến ly Dừa Nắng 200g", 1, 189000, 169000, "Dừa & vani", "200g", 45, 55, 0, false, 59, "Dừa và vani dung tích 200g, phù hợp không gian thư giãn.", []),
    mk(9, "Nến hũ Trà Trắng 250g", 2, 279000, null, "Trà trắng & xạ hương", "250g", 55, 50, 0, false, 60, "Hương trà trắng thanh khiết, tinh tế, dễ dùng hằng ngày.", []),
    mk(6, "Nến ly Chanh Sả 100g", 1, 99000, 79000, "Chanh & sả", "100g", 25, 100, 0, false, 61, "Hương chanh sả sảng khoái, giúp không gian thông thoáng, dễ chịu.", []),
    mk(12, "Nến thiếc Bạc Hà 80g", 3, 89000, 69000, "Bạc hà & tràm", "80g", 20, 110, 0, false, 62, "Hương bạc hà mát lạnh, giúp tỉnh táo khi làm việc.", []),
    mk(18, "Dụng cụ tắt nến", 5, 119000, null, "", "1 cái", null, 50, 0, false, 63, "Dụng cụ tắt nến dạng chuông, tắt lửa nhẹ nhàng, hạn chế khói và sáp bắn.", []),
    mk(17, "Kéo cắt bấc nến", 5, 99000, null, "", "1 cái", null, 60, 0, false, 64, "Kéo cắt bấc inox, giữ bấc dài khoảng 5mm để nến cháy đều, ít khói.", [])];
  const users = [{ id: 'u1', email: 'admin@demo.vn', fullName: 'Quản trị viên Demo', roles: ['Admin'] }, { id: 'u2', email: 'manager@demo.vn', fullName: 'Quản lý Demo', roles: ['Manager'] }, { id: 'u3', email: 'customer@demo.vn', fullName: 'Khách hàng Demo', roles: ['Customer'] }].map(u => ({ ...u, pw: 'demo', locked: false, phone: null, address: null, createdAt: new Date().toISOString() }));
  // Lượt truy cập demo được nhớ trong trình duyệt (localStorage) để F5 / mở lại vẫn giữ và tăng dần
  let visits = 2499;
  try { visits = Number(localStorage.getItem('aura_demo_visits')) || 2499; } catch { }
  const carts = {}; let orders = [], reviews = [], seq = { o: 1, p: 100, c: 10, v: 10, r: 1, u: 10 };
  let vouchers = [{ id: 1, code: 'WELCOME10', discountPercent: 10, discountAmount: null, minOrder: 150000, maxUses: null, usedCount: 0, expiresAt: null, isActive: true }];
  const FLOW = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Shipping', 'Cancelled'], Shipping: ['Delivered'], Delivered: [], Cancelled: [] };
  const catName = id => (cats.find(c => c.id === id) || {}).name || '';
  const SOLD_BASE = {"14": 1, "1": 1, "3": 1, "11": 1, "10": 1, "15": 1, "5": 1, "16": 1};  // số lượng đã bán sẵn có (lấy từ dữ liệu thật)
  const sold = id => (SOLD_BASE[id] || 0) + orders.filter(o => o.status !== 'Cancelled').reduce((a, o) => a + o.details.filter(d => d.productId === id).reduce((x, d) => x + d.quantity, 0), 0);
  const pdto = p => { const rv = reviews.filter(r => r.productId === p.id && !r.isHidden); return { ...p, effectivePrice: eff(p), categoryName: catName(p.categoryId), imageUrl: p.images && p.images[0] ? p.images[0].url : null, rating: rv.length ? Math.round(rv.reduce((a, r) => a + r.rating, 0) / rv.length * 10) / 10 : 0, reviewCount: rv.length, isNew: Date.now() - p.createdAt < 30 * day, sold: sold(p.id) }; };
  const odto = o => { const { userId, key, ...r } = o; return { ...r, nextStatuses: FLOW[o.status] }; };
  const prof = u => ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, address: u.address, roles: u.roles });
  const udto = u => ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, roles: u.roles, isLocked: u.locked, createdAt: u.createdAt });
  const page = (arr, pg, size) => ({ items: arr.slice((pg - 1) * size, pg * size), total: arr.length, page: pg, pageSize: size });
  const cartDto = uid => { const items = (carts[uid] || []).map(i => { const p = products.find(x => x.id === i.productId), c = cats.find(x => x.id === p.categoryId); return { productId: p.id, name: p.name, imageUrl: p.images && p.images[0] ? p.images[0].url : null, unitPrice: eff(p), quantity: i.quantity, stock: p.stock, available: p.isActive && c.isActive && p.stock >= i.quantity, lineTotal: eff(p) * i.quantity }; }); return { items, subtotal: items.reduce((a, i) => a + i.lineTotal, 0) }; };
  const vcheck = (code, sub) => { const v = vouchers.find(x => x.code === String(code).trim().toUpperCase()); if (!v) E('Mã giảm giá không tồn tại.'); if (!v.isActive) E('Mã giảm giá đã ngừng hoạt động.'); if (v.expiresAt && new Date(v.expiresAt) < new Date()) E('Mã giảm giá đã hết hạn.'); if (v.maxUses && v.usedCount >= v.maxUses) E('Mã giảm giá đã hết lượt sử dụng.'); if (sub < v.minOrder) E('Đơn hàng tối thiểu ' + new Intl.NumberFormat('vi-VN').format(v.minOrder) + '₫ để dùng mã này.'); const d = Math.min(sub, v.discountPercent ? Math.round(sub * v.discountPercent / 100) : v.discountAmount || 0); return { v, d }; };
  const restock = o => o.details.forEach(d => { products.find(p => p.id === d.productId).stock += d.quantity; });
  const auth = u => ({ token: 'demo:' + u.id, user: prof(u) });

  async function handle(method, path, body, S) {
    await new Promise(r => setTimeout(r, 40));
    const url = new URL(path, 'http://x'), p = url.pathname, q = Object.fromEntries(url.searchParams), M = method + ' ' + p; let m;
    const me = S.token ? users.find(u => 'demo:' + u.id === S.token) : null;
    const need = () => me || E('Bạn cần đăng nhập.');
    const staff = () => { need(); if (!me.roles.some(r => r === 'Admin' || r === 'Manager')) E('Bạn không có quyền thực hiện thao tác này.'); };
    const isStaff = !!me && me.roles.some(r => r === 'Admin' || r === 'Manager');
    const num = k => (q[k] === undefined || q[k] === '' ? null : Number(q[k]));
    const flag = k => q[k] === 'true';

    if (M === 'POST /api/stats/visit') { visits++; try { localStorage.setItem('aura_demo_visits', visits); } catch { } return { visits, purchases: 1775 + orders.filter(o => o.status !== 'Cancelled').length }; }
    if (M === 'GET /api/stats') return { visits, purchases: 1775 + orders.filter(o => o.status !== 'Cancelled').length };
    if (M === 'GET /api/categories') return cats.filter(c => (flag('all') && isStaff) || c.isActive).map(c => ({ ...c, productCount: products.filter(x => x.categoryId === c.id && x.isActive).length }));
    if (M === 'GET /api/products') {
      let l = products.filter(x => (flag('includeInactive') && isStaff) || (x.isActive && cats.find(c => c.id === x.categoryId).isActive));
      if (q.search) l = l.filter(x => (x.name + ' ' + x.scent).toLowerCase().includes(q.search.toLowerCase()));
      if (q.categoryId) l = l.filter(x => x.categoryId === +q.categoryId);
      if (num('minPrice') != null) l = l.filter(x => eff(x) >= num('minPrice')); if (num('maxPrice') != null) l = l.filter(x => eff(x) <= num('maxPrice'));
      if (flag('inStock')) l = l.filter(x => x.stock > 0); if (flag('featured')) l = l.filter(x => x.isFeatured); if (flag('onSale')) l = l.filter(x => x.salePrice && x.salePrice < x.price); if (flag('isNew')) l = l.filter(x => Date.now() - x.createdAt < 30 * day);
      const s = q.sort, cmp = { price_asc: (a, b) => eff(a) - eff(b), price_desc: (a, b) => eff(b) - eff(a), name: (a, b) => a.name.localeCompare(b.name, 'vi'), best: (a, b) => sold(b.id) - sold(a.id) }[s] || ((a, b) => b.createdAt - a.createdAt);
      l = [...l].sort(cmp); const r = page(l, +q.page || 1, Math.min(+q.pageSize || 12, 60)); r.items = r.items.map(pdto); return r;
    }
    if ((m = p.match(/^\/api\/products\/(\d+)$/)) && method === 'GET') { const x = products.find(i => i.id === +m[1]); if (!x || (!x.isActive && !isStaff)) E('Không tìm thấy sản phẩm.'); return pdto(x); }
    if (M === 'POST /api/products' || (m = p.match(/^\/api\/products\/(\d+)$/)) && method === 'PUT') {
      staff(); const d = body, isNew = method === 'POST';
      if (!d.name || !(d.price > 0)) E('Tên và giá bán là bắt buộc.'); if (d.salePrice != null && (d.salePrice <= 0 || d.salePrice >= d.price)) E('Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc.');
      const t = isNew ? { id: ++seq.p, createdAt: Date.now(), images: [] } : products.find(i => i.id === +m[1]) || E('Không tìm thấy sản phẩm.');
      Object.assign(t, { name: d.name, description: d.description, price: d.price, salePrice: d.salePrice, scent: d.scent || '', volume: d.volume || '', burnTimeHours: d.burnTimeHours, stock: d.stock, isActive: d.isActive, isFeatured: d.isFeatured, categoryId: d.categoryId });
      if (isNew) products.unshift(t); return pdto(t);
    }
    if ((m = p.match(/^\/api\/products\/(\d+)$/)) && method === 'DELETE') { staff(); (products.find(i => i.id === +m[1]) || E('Không tìm thấy.')).isActive = false; return null; }
    if (/^\/api\/products\/\d+\/images$/.test(p)) E('Tải ảnh lên chỉ hoạt động ở bản chạy thật (Backend ASP.NET Core).');

    if (M === 'POST /api/account/login') { const u = users.find(x => x.email === String(body.email).trim().toLowerCase()); if (u && u.locked) E('Tài khoản đang bị khóa. Vui lòng liên hệ cửa hàng.'); if (!u || u.pw !== body.password) E('Email hoặc mật khẩu không đúng.'); return auth(u); }
    if (M === 'POST /api/account/register') {
      const em = String(body.email).trim().toLowerCase(); if (users.some(x => x.email === em)) E('Email này đã được sử dụng.');
      if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(body.password)) E('Mật khẩu tối thiểu 8 ký tự, có chữ hoa và chữ số.');
      const u = { id: 'u' + ++seq.u, email: em, fullName: body.fullName, roles: ['Customer'], pw: body.password, locked: false, phone: body.phone, address: null, createdAt: new Date().toISOString() }; users.push(u); return auth(u);
    }
    if (M === 'GET /api/account/me') return prof(need());
    if (M === 'PUT /api/account/me') { need(); Object.assign(me, { fullName: body.fullName, phone: body.phone, address: body.address }); return prof(me); }
    if (M === 'POST /api/account/change-password') { need(); if (me.pw !== body.currentPassword) E('Mật khẩu hiện tại không đúng.'); me.pw = body.newPassword; return null; }

    if (M === 'GET /api/cart') return cartDto(need().id);
    if (M === 'POST /api/cart/items') {
      need(); const pr = products.find(x => x.id === body.productId); if (!pr || !pr.isActive) E('Sản phẩm không còn kinh doanh.');
      const l = carts[me.id] = carts[me.id] || [], it = l.find(i => i.productId === pr.id), nq = (it ? it.quantity : 0) + body.quantity;
      if (nq > pr.stock) E('Chỉ còn ' + pr.stock + ' sản phẩm trong kho.'); if (it) it.quantity = nq; else l.push({ productId: pr.id, quantity: nq }); return cartDto(me.id);
    }
    if ((m = p.match(/^\/api\/cart\/items\/(\d+)$/))) {
      need(); const l = carts[me.id] = carts[me.id] || [], pid = +m[1];
      if (method === 'PUT') { const it = l.find(i => i.productId === pid) || E('Sản phẩm không có trong giỏ.'), pr = products.find(x => x.id === pid); if (body.quantity > pr.stock) E('Chỉ còn ' + pr.stock + ' sản phẩm trong kho.'); it.quantity = body.quantity; }
      else carts[me.id] = l.filter(i => i.productId !== pid);
      return cartDto(me.id);
    }
    if (M === 'GET /api/vouchers/validate') { need(); const r = vcheck(q.code, +q.subtotal); return { code: r.v.code, discount: r.d, total: +q.subtotal - r.d }; }

    if (M === 'POST /api/orders') {
      need(); const dup = body.idempotencyKey && orders.find(o => o.userId === me.id && o.key === body.idempotencyKey); if (dup) return odto(dup);
      const items = carts[me.id] || []; if (!items.length) E('Giỏ hàng đang trống.');
      if (!/^(\+?84|0)\d{9,10}$/.test(body.phone)) E('Số điện thoại không hợp lệ.');
      items.forEach(i => { const pr = products.find(x => x.id === i.productId); if (!pr.isActive) E('Sản phẩm "' + pr.name + '" hiện ngừng kinh doanh.'); if (pr.stock < i.quantity) E('Sản phẩm "' + pr.name + '" chỉ còn ' + pr.stock + ' sản phẩm.'); });
      const sub = items.reduce((a, i) => a + eff(products.find(x => x.id === i.productId)) * i.quantity, 0); let disc = 0, vc = null;
      if (body.voucherCode) { const r = vcheck(body.voucherCode, sub); disc = r.d; vc = r.v; vc.usedCount++; }
      const details = items.map(i => { const pr = products.find(x => x.id === i.productId); pr.stock -= i.quantity; return { productId: pr.id, productName: pr.name, unitPrice: eff(pr), quantity: i.quantity, lineTotal: eff(pr) * i.quantity }; });
      const o = { id: seq.o++, code: 'AC' + new Date().toISOString().replace(/\D/g, '').slice(2, 14) + String(10 + Math.floor(Math.random() * 89)), status: 'Pending', paymentMethod: 'Cod', paymentStatus: 'Unpaid', receiverName: body.receiverName, phone: body.phone, address: body.address, note: body.note, subtotal: sub, discount: disc, total: sub - disc, voucherCode: vc && vc.code, createdAt: new Date().toISOString(), customerEmail: me.email, details, userId: me.id, key: body.idempotencyKey };
      orders.unshift(o); carts[me.id] = []; return odto(o);
    }
    if (M === 'GET /api/orders') return orders.filter(o => o.userId === need().id).map(odto);
    if ((m = p.match(/^\/api\/orders\/(\d+)$/))) { need(); const o = orders.find(x => x.id === +m[1]); if (!o || (!isStaff && o.userId !== me.id)) E('Không tìm thấy đơn hàng.'); return odto(o); }
    if ((m = p.match(/^\/api\/orders\/(\d+)\/cancel$/))) { need(); const o = orders.find(x => x.id === +m[1] && x.userId === me.id) || E('Không tìm thấy đơn hàng.'); if (o.status !== 'Pending') E('Chỉ có thể hủy đơn đang chờ xử lý.'); restock(o); o.status = 'Cancelled'; return odto(o); }

    if (M === 'GET /api/reviews') return reviews.filter(r => r.productId === +q.productId && !r.isHidden).map(r => ({ ...r, productName: null, isMine: !!me && r.userId === me.id }));
    if (M === 'POST /api/reviews') {
      need(); if (!orders.some(o => o.userId === me.id && o.status === 'Delivered' && o.details.some(d => d.productId === body.productId))) E('Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng thành công.');
      if (reviews.some(r => r.userId === me.id && r.productId === body.productId)) E('Bạn đã đánh giá sản phẩm này rồi.');
      const r = { id: seq.r++, productId: body.productId, userId: me.id, userName: me.fullName, rating: body.rating, comment: body.comment, isHidden: false, createdAt: new Date().toISOString() }; reviews.push(r); return r;
    }
    if (M === 'GET /api/reviews/admin') { staff(); return reviews.map(r => ({ ...r, productName: catName(0) || (products.find(x => x.id === r.productId) || {}).name })); }
    if ((m = p.match(/^\/api\/reviews\/(\d+)(\/visibility)?$/))) {
      need(); const r = reviews.find(x => x.id === +m[1]) || E('Không tìm thấy đánh giá.');
      if (m[2]) { staff(); r.isHidden = body.isHidden; } else if (method === 'DELETE') { if (r.userId !== me.id && !isStaff) E('Không tìm thấy đánh giá.'); reviews = reviews.filter(x => x !== r); } return null;
    }

    if (M === 'GET /api/admin/dashboard') {
      staff(); const dv = orders.filter(o => o.status === 'Delivered'), per = q.period || 'day', now = new Date(), series = [];
      const sum = f => { const s = dv.filter(o => f(new Date(o.createdAt))); return [s.reduce((a, o) => a + o.total, 0), s.length]; };
      if (per === 'year') [...new Set(dv.map(o => new Date(o.createdAt).getFullYear()))].sort().forEach(y => { const [r, c] = sum(d => d.getFullYear() === y); series.push({ label: String(y), revenue: r, orders: c }); });
      else if (per === 'month') for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1), [r, c] = sum(x => x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth()); series.push({ label: String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(), revenue: r, orders: c }); }
      else for (let i = 29; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), [r, c] = sum(x => x.toDateString() === d.toDateString()); series.push({ label: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'), revenue: r, orders: c }); }
      const low = products.filter(x => x.isActive && x.stock <= 5);
      return { totalRevenue: dv.reduce((a, o) => a + o.total, 0), totalOrders: orders.filter(o => o.status !== 'Cancelled').length, pendingOrders: orders.filter(o => o.status === 'Pending').length, activeProducts: products.filter(x => x.isActive).length, lowStockProducts: low.length, lowStockList: low.sort((a, b) => a.stock - b.stock).slice(0, 10).map(x => ({ id: x.id, name: x.name, stock: x.stock })), series };
    }
    if (M === 'GET /api/admin/orders') { staff(); let l = orders; if (q.status) l = l.filter(o => o.status === q.status); if (q.search) { const s = q.search.toLowerCase(); l = l.filter(o => (o.code + o.receiverName + o.customerEmail).toLowerCase().includes(s)); } const r = page(l, +q.page || 1, +q.pageSize || 20); r.items = r.items.map(odto); return r; }
    if ((m = p.match(/^\/api\/admin\/orders\/(\d+)\/status$/))) { staff(); const o = orders.find(x => x.id === +m[1]) || E('Không tìm thấy đơn hàng.'); if (!FLOW[o.status].includes(body.status)) E('Không thể chuyển đơn từ ' + o.status + ' sang ' + body.status + '.'); if (body.status === 'Cancelled') restock(o); if (body.status === 'Delivered') o.paymentStatus = 'Paid'; o.status = body.status; return odto(o); }
    if ((m = p.match(/^\/api\/admin\/orders\/(\d+)\/payment$/))) { staff(); const o = orders.find(x => x.id === +m[1]) || E('Không tìm thấy đơn hàng.'); o.paymentStatus = body.status; return odto(o); }
    if (M === 'GET /api/admin/users') { staff(); let l = users; if (q.search) l = l.filter(u => (u.email + u.fullName).toLowerCase().includes(q.search.toLowerCase())); const r = page(l, +q.page || 1, 20); r.items = r.items.map(udto); return r; }
    if ((m = p.match(/^\/api\/admin\/users\/([^/]+)\/(lock|role)$/))) {
      staff(); const t = users.find(u => u.id === m[1]) || E('Không tìm thấy tài khoản.'); if (t.id === me.id) E('Không thể thao tác trên chính tài khoản của mình.');
      if (m[2] === 'lock') { if (!me.roles.includes('Admin') && t.roles.some(r => r !== 'Customer')) E('Bạn không có quyền thao tác trên tài khoản này.'); t.locked = body.locked; }
      else { if (!me.roles.includes('Admin')) E('Bạn không có quyền thực hiện thao tác này.'); t.roles = [body.role]; } return udto(t);
    }
    if (M === 'POST /api/admin/staff') { if (!need().roles.includes('Admin')) E('Bạn không có quyền thực hiện thao tác này.'); if (users.some(u => u.email === body.email.toLowerCase())) E('Email này đã được sử dụng.'); const u = { id: 'u' + ++seq.u, email: body.email.toLowerCase(), fullName: body.fullName, roles: ['Manager'], pw: body.password, locked: false, createdAt: new Date().toISOString() }; users.push(u); return udto(u); }
    if (M === 'GET /api/admin/audit-logs') return [];

    if (M === 'POST /api/categories' || ((m = p.match(/^\/api\/categories\/(\d+)$/)) && method !== 'GET')) {
      staff(); if (method === 'DELETE') { const id = +m[1]; if (products.some(x => x.categoryId === id)) E('Danh mục vẫn còn sản phẩm. Hãy chuyển sản phẩm sang danh mục khác hoặc chuyển danh mục sang trạng thái ngừng hoạt động.'); cats.splice(cats.findIndex(c => c.id === id), 1); return null; }
      if (cats.some(c => c.name === body.name && (!m || c.id !== +m[1]))) E('Tên danh mục đã tồn tại.');
      const t = m ? cats.find(c => c.id === +m[1]) : (cats.push({ id: ++seq.c }), cats[cats.length - 1]); Object.assign(t, { name: body.name, description: body.description, isActive: body.isActive }); return { ...t, productCount: products.filter(x => x.categoryId === t.id && x.isActive).length };
    }
    if (M === 'GET /api/vouchers') { staff(); return vouchers; }
    if (M === 'POST /api/vouchers' || ((m = p.match(/^\/api\/vouchers\/(\d+)$/)) && method !== 'GET')) {
      staff(); if (method === 'DELETE') { const v = vouchers.find(x => x.id === +m[1]); if (v.usedCount > 0) E('Mã đã được sử dụng, hãy chuyển sang ngừng hoạt động thay vì xóa.'); vouchers = vouchers.filter(x => x !== v); return null; }
      if ((body.discountPercent == null) === (body.discountAmount == null)) E('Chọn một trong hai: giảm theo % hoặc giảm số tiền cố định.');
      const code = body.code.trim().toUpperCase(); if (vouchers.some(v => v.code === code && (!m || v.id !== +m[1]))) E('Mã giảm giá đã tồn tại.');
      const t = m ? vouchers.find(v => v.id === +m[1]) : (vouchers.unshift({ id: ++seq.v, usedCount: 0 }), vouchers[0]); Object.assign(t, { code, discountPercent: body.discountPercent, discountAmount: body.discountAmount, minOrder: body.minOrder || 0, maxUses: body.maxUses, expiresAt: body.expiresAt, isActive: body.isActive }); return t;
    }
    E('Chức năng này chưa có trong bản demo.');
  }
  handle.hint = '<div class="alert alert-warning mt-3 small mb-0"><b>Bản demo</b> – tài khoản thử (mật khẩu: <code>demo</code>):<br><code>admin@demo.vn</code> · <code>manager@demo.vn</code> · <code>customer@demo.vn</code></div>';
  window.DEMO_API = handle;
})();

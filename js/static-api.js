// ====== BẢN TĨNH CHO GITHUB PAGES ======
// Giả lập Backend trong trình duyệt. Dữ liệu sản phẩm/danh mục/đánh giá được đọc từ data/store.json
// (xuất từ database localhost bằng scripts/export-for-github.ps1). Giỏ hàng, đơn, tài khoản được lưu trong trình duyệt của từng khách.
(function () {
  const day = 864e5, eff = p => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
  const E = m => { throw new Error(m); };
  // ----- dữ liệu nạp từ data/store.json -----
  const FALLBACK = { categories: [], products: [], reviews: [], stats: { visits: 2499, purchases: 1775 },
    vouchers: [{ id: 1, code: 'WELCOME10', discountPercent: 10, discountAmount: null, minOrder: 150000, maxUses: null, usedCount: 0, expiresAt: null, isActive: true }] };
  let cats = [], products = [], vouchers = [], reviews = [], visits = 0, purchBase = 0, baseStamp = '';
  // /uploads/products/abc.png (đường dẫn của Backend) -> images/products/abc.jpg (file đã tối ưu, đi kèm repo)
  const fixUrl = u => { if (!u) return null; const m = String(u).match(/^\/?uploads\/products\/([^/?#]+?)(\.[a-z0-9]+)?$/i); return m ? 'images/products/' + m[1] + '.jpg' : u; };
  function loadBase(d) {
    const stamp = d.generatedAt ? Date.parse(d.generatedAt) || Date.now() : Date.now();
    cats = (d.categories || []).map(c => ({ id: c.id, name: c.name, description: c.description, isActive: c.isActive !== false }));
    products = (d.products || []).map((p, i) => {
      const imgs = (p.images || []).map(x => ({ id: x.id, url: fixUrl(x.url), isPrimary: !!x.isPrimary }));
      return { id: p.id, name: p.name, description: p.description, price: p.price, salePrice: p.salePrice, scent: p.scent || '', volume: p.volume || '', burnTimeHours: p.burnTimeHours,
        stock: p.stock, isActive: p.isActive !== false, isFeatured: !!p.isFeatured, categoryId: p.categoryId, createdAt: stamp - i, snapNew: !!p.isNew,
        soldBase: p.sold || 0, snapRating: p.rating || 0, snapReviews: p.reviewCount || 0, imageUrl: fixUrl(p.imageUrl) || (imgs[0] && imgs[0].url) || null, images: imgs };
    });
    vouchers = (d.vouchers || FALLBACK.vouchers).map(v => ({ ...v }));   // không xuất mã giảm giá -> dùng WELCOME10 mặc định
    reviews = (d.reviews || []).map(r => ({ id: r.id, productId: r.productId, userId: 'snap', userName: r.userName, rating: r.rating, comment: r.comment, isHidden: !!r.isHidden, createdAt: r.createdAt }));
    visits = (d.stats && d.stats.visits) || 0; purchBase = (d.stats && d.stats.purchases) || 0;
    seq.p = Math.max(100, ...products.map(p => p.id)); seq.c = Math.max(10, ...cats.map(c => c.id)); seq.v = Math.max(10, ...vouchers.map(v => v.id)); seq.r = Math.max(1, ...reviews.map(r => r.id + 1));
    baseStamp = d.generatedAt || 'none';
  }
  const users = [{ id: 'u1', email: 'admin@demo.vn', fullName: 'Quản trị viên Demo', roles: ['Admin'] }, { id: 'u2', email: 'manager@demo.vn', fullName: 'Quản lý Demo', roles: ['Manager'] }, { id: 'u3', email: 'customer@demo.vn', fullName: 'Khách hàng Demo', roles: ['Customer'] }].map(u => ({ ...u, pw: 'Demo1234', locked: false, phone: null, address: null, createdAt: new Date().toISOString() }));
  const carts = {}; let orders = [], seq = { o: 1, p: 100, c: 10, v: 10, r: 1, u: 10 };
  const FLOW = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Shipping', 'Cancelled'], Shipping: ['Delivered'], Delivered: [], Cancelled: [] };
  const catName = id => (cats.find(c => c.id === id) || {}).name || '';
  const soldNow = id => orders.filter(o => o.status !== 'Cancelled').reduce((a, o) => a + o.details.filter(d => d.productId === id).reduce((x, d) => x + d.quantity, 0), 0);
  const sold = id => ((products.find(x => x.id === id) || {}).soldBase || 0) + soldNow(id);
  const pdto = p => { const rv = reviews.filter(r => r.productId === p.id && !r.isHidden); const { soldBase, snapNew, snapRating, snapReviews, session, ...pub } = p; return { ...pub, effectivePrice: eff(p), categoryName: catName(p.categoryId), imageUrl: p.imageUrl || (p.images[0] && p.images[0].url) || null, rating: rv.length ? Math.round(rv.reduce((a, r) => a + r.rating, 0) / rv.length * 10) / 10 : (snapRating || 0), reviewCount: rv.length || snapReviews || 0, isNew: session ? Date.now() - p.createdAt < 30 * day : !!snapNew, sold: sold(p.id) }; };
  const odto = o => { const { userId, key, ...r } = o; return { ...r, nextStatuses: FLOW[o.status] }; };
  const prof = u => ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, address: u.address, roles: u.roles });
  const udto = u => ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, roles: u.roles, isLocked: u.locked, createdAt: u.createdAt });
  const page = (arr, pg, size) => ({ items: arr.slice((pg - 1) * size, pg * size), total: arr.length, page: pg, pageSize: size });
  const cartDto = uid => { const items = (carts[uid] || []).map(i => { const p = products.find(x => x.id === i.productId), c = cats.find(x => x.id === p.categoryId); return { productId: p.id, name: p.name, imageUrl: p.imageUrl || (p.images[0] && p.images[0].url) || null, unitPrice: eff(p), quantity: i.quantity, stock: p.stock, available: p.isActive && c.isActive && p.stock >= i.quantity, lineTotal: eff(p) * i.quantity }; }); return { items, subtotal: items.reduce((a, i) => a + i.lineTotal, 0) }; };
  const vcheck = (code, sub) => { const v = vouchers.find(x => x.code === String(code).trim().toUpperCase()); if (!v) E('Mã giảm giá không tồn tại.'); if (!v.isActive) E('Mã giảm giá đã ngừng hoạt động.'); if (v.expiresAt && new Date(v.expiresAt) < new Date()) E('Mã giảm giá đã hết hạn.'); if (v.maxUses && v.usedCount >= v.maxUses) E('Mã giảm giá đã hết lượt sử dụng.'); if (sub < v.minOrder) E('Đơn hàng tối thiểu ' + new Intl.NumberFormat('vi-VN').format(v.minOrder) + '₫ để dùng mã này.'); const d = Math.min(sub, v.discountPercent ? Math.round(sub * v.discountPercent / 100) : v.discountAmount || 0); return { v, d }; };
  const restock = o => o.details.forEach(d => { products.find(p => p.id === d.productId).stock += d.quantity; });
  const auth = u => ({ token: 'demo:' + u.id, user: prof(u) });

  // Thu nhỏ ảnh admin tải lên (tối đa 800px, JPEG) rồi lưu trong trình duyệt - bản tĩnh không có máy chủ để lưu file
  const shrink = file => new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const s = Math.min(1, 800 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.78)); }; im.onerror = () => no(new Error('Không đọc được ảnh.')); im.src = u; });
  async function handle(method, path, body, S) {
    await ready;
    await new Promise(r => setTimeout(r, 40));
    try { return await route(method, path, body, S); } finally { if (method !== 'GET' || path === '/api/stats') save(); }
  }
  async function route(method, path, body, S) {
    const url = new URL(path, 'http://x'), p = url.pathname, q = Object.fromEntries(url.searchParams), M = method + ' ' + p; let m;
    const me = S.token ? users.find(u => 'demo:' + u.id === S.token) : null;
    const need = () => me || E('Bạn cần đăng nhập.');
    const staff = () => { need(); if (!me.roles.some(r => r === 'Admin' || r === 'Manager')) E('Bạn không có quyền thực hiện thao tác này.'); };
    const isStaff = !!me && me.roles.some(r => r === 'Admin' || r === 'Manager');
    const num = k => (q[k] === undefined || q[k] === '' ? null : Number(q[k]));
    const flag = k => q[k] === 'true';

    if (M === 'POST /api/stats/visit') { visits++; return { visits, purchases: purchBase + orders.filter(o => o.status !== 'Cancelled').length }; }
    if (M === 'PUT /api/stats') { if (!need().roles.includes('Admin')) E('Bạn không có quyền thực hiện thao tác này.'); const v = Math.round(+body.visits), pu = Math.round(+body.purchases); if (!(v >= 0) || !(pu >= 0)) E('Số liệu không được âm.'); const real = orders.filter(o => o.status !== 'Cancelled').length; visits = v; purchBase = Math.max(0, pu - real); return { visits, purchases: purchBase + real }; }
    if (M === 'GET /api/stats') return { visits, purchases: purchBase + orders.filter(o => o.status !== 'Cancelled').length };
    if (M === 'GET /api/categories') return cats.filter(c => (flag('all') && isStaff) || c.isActive).map(c => ({ ...c, productCount: products.filter(x => x.categoryId === c.id && x.isActive).length }));
    if (M === 'GET /api/products') {
      let l = products.filter(x => (flag('includeInactive') && isStaff) || (x.isActive && cats.find(c => c.id === x.categoryId).isActive));
      if (q.search) l = l.filter(x => (x.name + ' ' + x.scent).toLowerCase().includes(q.search.toLowerCase()));
      if (q.categoryId) l = l.filter(x => x.categoryId === +q.categoryId);
      if (num('minPrice') != null) l = l.filter(x => eff(x) >= num('minPrice')); if (num('maxPrice') != null) l = l.filter(x => eff(x) <= num('maxPrice'));
      if (flag('inStock')) l = l.filter(x => x.stock > 0); if (flag('featured')) l = l.filter(x => x.isFeatured); if (flag('onSale')) l = l.filter(x => x.salePrice && x.salePrice < x.price); if (flag('isNew')) l = l.filter(x => pdto(x).isNew);
      const s = q.sort, cmp = { price_asc: (a, b) => eff(a) - eff(b), price_desc: (a, b) => eff(b) - eff(a), name: (a, b) => a.name.localeCompare(b.name, 'vi'), best: (a, b) => sold(b.id) - sold(a.id) }[s] || ((a, b) => b.createdAt - a.createdAt);
      l = [...l].sort(cmp); const r = page(l, +q.page || 1, Math.min(+q.pageSize || 12, 60)); r.items = r.items.map(pdto); return r;
    }
    if ((m = p.match(/^\/api\/products\/(\d+)$/)) && method === 'GET') { const x = products.find(i => i.id === +m[1]); if (!x || (!x.isActive && !isStaff)) E('Không tìm thấy sản phẩm.'); return pdto(x); }
    if (M === 'POST /api/products' || (m = p.match(/^\/api\/products\/(\d+)$/)) && method === 'PUT') {
      staff(); const d = body, isNew = method === 'POST';
      if (!d.name || !(d.price > 0)) E('Tên và giá bán là bắt buộc.'); if (d.salePrice != null && (d.salePrice <= 0 || d.salePrice >= d.price)) E('Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc.');
      const t = isNew ? { id: ++seq.p, createdAt: Date.now(), session: true, images: [] } : products.find(i => i.id === +m[1]) || E('Không tìm thấy sản phẩm.');
      Object.assign(t, { name: d.name, description: d.description, price: d.price, salePrice: d.salePrice, scent: d.scent || '', volume: d.volume || '', burnTimeHours: d.burnTimeHours, stock: d.stock, isActive: d.isActive, isFeatured: d.isFeatured, categoryId: d.categoryId });
      if (isNew) products.unshift(t); return pdto(t);
    }
    if ((m = p.match(/^\/api\/products\/(\d+)$/)) && method === 'DELETE') { staff(); (products.find(i => i.id === +m[1]) || E('Không tìm thấy.')).isActive = false; return null; }
    if ((m = p.match(/^\/api\/products\/(\d+)\/images$/)) && method === 'POST') {
      staff(); const t = products.find(i => i.id === +m[1]) || E('Không tìm thấy sản phẩm.'); if (t.images.length >= 8) E('Mỗi sản phẩm tối đa 8 ảnh.');
      const file = body && body.get && body.get('file'); if (!file) E('Vui lòng chọn ảnh.'); if (file.size > 5e6) E('Ảnh tối đa 5MB.');
      const im = { id: seq.i = Math.max(1000, seq.i || 0) + 1, url: await shrink(file), isPrimary: !t.images.length }; t.images.push(im); if (!t.imageUrl) t.imageUrl = im.url; return im;
    }
    if ((m = p.match(/^\/api\/products\/images\/(\d+)$/)) && method === 'DELETE') {
      staff(); for (const t of products) { const k = t.images.findIndex(i => i.id === +m[1]); if (k >= 0) { const was = t.images[k].url; t.images.splice(k, 1); if (t.imageUrl === was) t.imageUrl = t.images[0] ? t.images[0].url : null; return null; } } E('Không tìm thấy ảnh.');
    }

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
  handle.hint = '';   // bản công khai: không phô tài khoản thử trên trang đăng nhập (giống bản localhost)

  // ----- lưu trạng thái vào trình duyệt của từng khách (giỏ hàng, đơn, tài khoản, đánh giá...) -----
  const KEY = 'aura_static_state_v1';
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ base: baseStamp, cats, products, vouchers, reviews, users, carts, orders, seq, visits, purchBase })); } catch { }
  }
  function restore() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!d || d.base !== baseStamp) return;          // dữ liệu cửa hàng đã được cập nhật -> bỏ trạng thái cũ
      cats = d.cats; products = d.products; vouchers = d.vouchers; reviews = d.reviews; orders = d.orders; seq = d.seq; visits = d.visits; if (d.purchBase != null) purchBase = d.purchBase;
      users.splice(0, users.length, ...d.users); Object.keys(carts).forEach(k => delete carts[k]); Object.assign(carts, d.carts);
    } catch { }
  }
  const ready = (async () => {
    let d = FALLBACK;
    try {
      const r = await fetch((window.APP_CONFIG && window.APP_CONFIG.staticData) || 'data/store.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      d = await r.json();
    } catch (e) { console.warn('Không đọc được data/store.json, dùng dữ liệu rỗng.', e); }
    loadBase(d); restore();
  })();
  window.DEMO_API = handle;
})();

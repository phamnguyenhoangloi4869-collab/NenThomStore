namespace NenThomStore.Api.Services;

public class OrderService(AppDbContext db, AuditService audit)
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> Flow = new()
    {
        [OrderStatus.Pending] = new[] { OrderStatus.Confirmed, OrderStatus.Cancelled },
        [OrderStatus.Confirmed] = new[] { OrderStatus.Shipping, OrderStatus.Cancelled },
        [OrderStatus.Shipping] = new[] { OrderStatus.Delivered },
        [OrderStatus.Delivered] = Array.Empty<OrderStatus>(),
        [OrderStatus.Cancelled] = Array.Empty<OrderStatus>()
    };

    public async Task<OrderDto> CheckoutAsync(string userId, CheckoutRequest r)
    {
        // Chống gửi đơn lặp: cùng IdempotencyKey sẽ trả về đơn đã tạo
        if (!string.IsNullOrWhiteSpace(r.IdempotencyKey))
        {
            var existing = await FindByKeyAsync(userId, r.IdempotencyKey);
            if (existing != null) return ToDto(existing);
        }

        var cart = await db.Carts.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null || cart.Items.Count == 0) throw new BusinessException("Giỏ hàng đang trống.");

        foreach (var i in cart.Items)
        {
            var p = i.Product;
            if (!p.IsActive || !p.Category.IsActive) throw new BusinessException($"Sản phẩm \"{p.Name}\" hiện ngừng kinh doanh.");
            if (p.Stock < i.Quantity) throw new BusinessException($"Sản phẩm \"{p.Name}\" chỉ còn {p.Stock} sản phẩm.");
        }

        // Giá luôn lấy từ database, không tin dữ liệu từ Frontend
        var subtotal = cart.Items.Sum(i => i.Product.EffectivePrice * i.Quantity);
        Voucher? voucher = null; decimal discount = 0;
        if (!string.IsNullOrWhiteSpace(r.VoucherCode))
        {
            var code = r.VoucherCode.Trim().ToUpperInvariant();
            voucher = await db.Vouchers.FirstOrDefaultAsync(v => v.Code == code);
            var err = voucher == null ? "Mã giảm giá không tồn tại." : voucher.Validate(subtotal);
            if (err != null) throw new BusinessException(err);
            discount = voucher!.Calculate(subtotal);
        }

        await using var tx = await db.Database.BeginTransactionAsync();

        // Trừ kho nguyên tử: câu lệnh UPDATE có điều kiện Stock >= số lượng, tránh bán vượt khi đặt đồng thời
        foreach (var i in cart.Items)
        {
            var pid = i.ProductId; var qty = i.Quantity;
            var affected = await db.Products.Where(p => p.Id == pid && p.Stock >= qty)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - qty));
            if (affected == 0) throw new BusinessException($"Sản phẩm \"{i.Product.Name}\" vừa hết hàng hoặc không đủ số lượng.");
        }
        if (voucher != null)
        {
            var vid = voucher.Id;
            var ok = await db.Vouchers.Where(v => v.Id == vid && (v.MaxUses == null || v.UsedCount < v.MaxUses))
                .ExecuteUpdateAsync(s => s.SetProperty(v => v.UsedCount, v => v.UsedCount + 1));
            if (ok == 0) throw new BusinessException("Mã giảm giá đã hết lượt sử dụng.");
        }

        var order = new Order
        {
            Code = $"AC{DateTime.UtcNow:yyMMddHHmmss}{Random.Shared.Next(10, 99)}",
            UserId = userId, ReceiverName = r.ReceiverName.Trim(), Phone = r.Phone.Trim(), Address = r.Address.Trim(), Note = r.Note?.Trim(),
            Subtotal = subtotal, Discount = discount, Total = subtotal - discount, VoucherCode = voucher?.Code,
            PaymentMethod = PaymentMethod.Cod, PaymentStatus = PaymentStatus.Unpaid,
            IdempotencyKey = string.IsNullOrWhiteSpace(r.IdempotencyKey) ? null : r.IdempotencyKey,
            Details = cart.Items.Select(i => new OrderDetail
            {
                ProductId = i.ProductId, ProductName = i.Product.Name, UnitPrice = i.Product.EffectivePrice, Quantity = i.Quantity
            }).ToList()
        };
        order.Payments.Add(new Payment { Method = PaymentMethod.Cod, Status = PaymentStatus.Unpaid, Amount = order.Total });
        db.Orders.Add(order);
        db.CartItems.RemoveRange(cart.Items);

        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) when (order.IdempotencyKey != null)
        {
            db.ChangeTracker.Clear();
            var dup = await FindByKeyAsync(userId, order.IdempotencyKey);
            if (dup != null) return ToDto(dup);
            throw;
        }
        await tx.CommitAsync();
        return ToDto(order);
    }

    public async Task<List<OrderDto>> MineAsync(string userId)
    {
        var orders = await db.Orders.AsNoTracking().Include(o => o.Details).Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt).Take(100).ToListAsync();
        return orders.Select(ToDto).ToList();
    }

    /// Trả null nếu không tồn tại hoặc không thuộc về người dùng (chống IDOR).
    public async Task<OrderDto?> GetAsync(int id, string userId, bool isStaff)
    {
        var o = await db.Orders.AsNoTracking().Include(x => x.Details).Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
        if (o == null || (!isStaff && o.UserId != userId)) return null;
        return ToDto(o);
    }

    public async Task<PagedResult<OrderDto>> ListAsync(OrderListQuery q)
    {
        var query = db.Orders.AsNoTracking().Include(o => o.Details).Include(o => o.User).AsQueryable();
        if (q.Status.HasValue) query = query.Where(o => o.Status == q.Status);
        if (q.From.HasValue) query = query.Where(o => o.CreatedAt >= q.From);
        if (q.To.HasValue) { var to = q.To.Value.Date.AddDays(1); query = query.Where(o => o.CreatedAt < to); }
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(o => o.Code.Contains(s) || o.ReceiverName.Contains(s) || o.User.Email!.Contains(s) || o.User.FullName.Contains(s));
        }
        var total = await query.CountAsync();
        var page = Math.Max(1, q.Page); var size = Math.Clamp(q.PageSize, 1, 100);
        var list = await query.OrderByDescending(o => o.CreatedAt).Skip((page - 1) * size).Take(size).ToListAsync();
        return new PagedResult<OrderDto>(list.Select(ToDto).ToList(), total, page, size);
    }

    public async Task<OrderDto> UpdateStatusAsync(int id, OrderStatus next, string actorId)
    {
        var o = await db.Orders.Include(x => x.Details).Include(x => x.Payments).Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new BusinessException("Không tìm thấy đơn hàng.", 404);
        if (!Flow[o.Status].Contains(next)) throw new BusinessException($"Không thể chuyển đơn từ {o.Status} sang {next}.");

        await using var tx = await db.Database.BeginTransactionAsync();
        if (next == OrderStatus.Cancelled) await RestockAsync(o);
        if (next == OrderStatus.Delivered)
        {
            o.PaymentStatus = PaymentStatus.Paid;     // COD: thu tiền khi giao thành công
            foreach (var p in o.Payments) { p.Status = PaymentStatus.Paid; p.PaidAt = DateTime.UtcNow; }
        }
        o.Status = next;
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        await audit.LogAsync(actorId, "Order.Status", $"{o.Code} -> {next}");
        return ToDto(o);
    }

    public async Task<OrderDto> CancelByCustomerAsync(int id, string userId)
    {
        var o = await db.Orders.Include(x => x.Details).Include(x => x.Payments).FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId)
                ?? throw new BusinessException("Không tìm thấy đơn hàng.", 404);
        if (o.Status != OrderStatus.Pending) throw new BusinessException("Chỉ có thể hủy đơn đang chờ xử lý.");
        await using var tx = await db.Database.BeginTransactionAsync();
        await RestockAsync(o);
        o.Status = OrderStatus.Cancelled;
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return ToDto(o);
    }

    public async Task<OrderDto> SetPaymentStatusAsync(int id, PaymentStatus status, string actorId)
    {
        var o = await db.Orders.Include(x => x.Details).Include(x => x.Payments).FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new BusinessException("Không tìm thấy đơn hàng.", 404);
        if (o.Status == OrderStatus.Cancelled) throw new BusinessException("Đơn đã hủy, không thể đổi trạng thái thanh toán.");
        o.PaymentStatus = status;
        foreach (var p in o.Payments) { p.Status = status; p.PaidAt = status == PaymentStatus.Paid ? DateTime.UtcNow : null; }
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "Order.Payment", $"{o.Code} -> {status}");
        return ToDto(o);
    }

    private async Task RestockAsync(Order o)
    {
        foreach (var d in o.Details)
        {
            var pid = d.ProductId; var qty = d.Quantity;
            await db.Products.Where(p => p.Id == pid).ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + qty));
        }
    }

    private Task<Order?> FindByKeyAsync(string userId, string key) =>
        db.Orders.AsNoTracking().Include(o => o.Details).FirstOrDefaultAsync(o => o.UserId == userId && o.IdempotencyKey == key);

    public static OrderDto ToDto(Order o) => new(o.Id, o.Code, o.Status, o.PaymentMethod, o.PaymentStatus, o.ReceiverName, o.Phone, o.Address,
        o.Note, o.Subtotal, o.Discount, o.Total, o.VoucherCode, o.CreatedAt, o.User?.Email,
        o.Details.Select(d => new OrderDetailDto(d.ProductId, d.ProductName, d.UnitPrice, d.Quantity, d.UnitPrice * d.Quantity)).ToList(),
        Flow[o.Status].ToList());
}

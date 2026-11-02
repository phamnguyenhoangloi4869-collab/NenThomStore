using Microsoft.AspNetCore.Identity;

namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/admin"), Authorize(Roles = Roles.Staff)]
public class AdminController(AppDbContext db, OrderService orders, UserManager<ApplicationUser> users, AuditService audit) : ControllerBase
{
    // ---------- Dashboard: chỉ dùng dữ liệu thật từ database ----------
    [HttpGet("dashboard")]
    public async Task<DashboardDto> Dashboard([FromQuery] string period = "day")
    {
        var delivered = db.Orders.AsNoTracking().Where(o => o.Status == OrderStatus.Delivered);
        var totalRevenue = await delivered.SumAsync(o => (decimal?)o.Total) ?? 0m;
        var totalOrders = await db.Orders.CountAsync(o => o.Status != OrderStatus.Cancelled);
        var pending = await db.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
        var active = await db.Products.CountAsync(p => p.IsActive);
        var lowQuery = db.Products.AsNoTracking().Where(p => p.IsActive && p.Stock <= 5);
        var lowCount = await lowQuery.CountAsync();
        var low = await lowQuery.OrderBy(p => p.Stock).Take(10).Select(p => new LowStockDto(p.Id, p.Name, p.Stock)).ToListAsync();

        var rows = (await delivered.Select(o => new { o.CreatedAt, o.Total }).ToListAsync())
            .Select(o => new { Local = o.CreatedAt.AddHours(7), o.Total }).ToList();   // giờ Việt Nam (UTC+7)
        var today = DateTime.UtcNow.AddHours(7).Date;
        var series = new List<RevenuePoint>();
        if (period == "year")
        {
            series = rows.GroupBy(r => r.Local.Year).OrderBy(g => g.Key).Select(g => new RevenuePoint(g.Key.ToString(), g.Sum(x => x.Total), g.Count())).ToList();
        }
        else if (period == "month")
        {
            for (var i = 11; i >= 0; i--)
            {
                var m = new DateTime(today.Year, today.Month, 1).AddMonths(-i);
                var sel = rows.Where(r => r.Local.Year == m.Year && r.Local.Month == m.Month).ToList();
                series.Add(new RevenuePoint(m.ToString("MM/yyyy"), sel.Sum(x => x.Total), sel.Count));
            }
        }
        else
        {
            for (var i = 29; i >= 0; i--)
            {
                var d = today.AddDays(-i);
                var sel = rows.Where(r => r.Local.Date == d).ToList();
                series.Add(new RevenuePoint(d.ToString("dd/MM"), sel.Sum(x => x.Total), sel.Count));
            }
        }
        return new DashboardDto(totalRevenue, totalOrders, pending, active, lowCount, low, series);
    }

    // ---------- Đơn hàng ----------
    [HttpGet("orders")]
    public async Task<PagedResult<OrderDto>> ListOrders([FromQuery] OrderListQuery q) => await orders.ListAsync(q);

    [HttpPut("orders/{id:int}/status")]
    public async Task<OrderDto> UpdateStatus(int id, OrderStatusRequest r) => await orders.UpdateStatusAsync(id, r.Status, User.UserId());

    [HttpPut("orders/{id:int}/payment")]
    public async Task<OrderDto> UpdatePayment(int id, PaymentStatusRequest r) => await orders.SetPaymentStatusAsync(id, r.Status, User.UserId());

    // ---------- Tài khoản ----------
    [HttpGet("users")]
    public async Task<PagedResult<UserDto>> Users([FromQuery] string? search, [FromQuery] int page = 1)
    {
        var q = users.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) { var s = search.Trim(); q = q.Where(u => u.Email!.Contains(s) || u.FullName.Contains(s)); }
        var total = await q.CountAsync();
        page = Math.Max(1, page);
        var list = await q.OrderByDescending(u => u.CreatedAt).Skip((page - 1) * 20).Take(20).ToListAsync();
        var items = new List<UserDto>();
        foreach (var u in list) items.Add(await MapUserAsync(u));
        return new PagedResult<UserDto>(items, total, page, 20);
    }

    [HttpPut("users/{id}/lock")]
    public async Task<ActionResult<UserDto>> Lock(string id, LockRequest r)
    {
        var target = await users.FindByIdAsync(id);
        if (target == null) return NotFound();
        if (target.Id == User.UserId()) throw new BusinessException("Không thể tự khóa tài khoản của chính mình.");
        var targetRoles = await users.GetRolesAsync(target);
        // Quản lý chỉ được khóa/mở khóa khách hàng
        if (!User.IsInRole(Roles.Admin) && targetRoles.Any(x => x is Roles.Admin or Roles.Manager))
            throw new BusinessException("Bạn không có quyền thao tác trên tài khoản này.", 403);
        await users.SetLockoutEnabledAsync(target, true);
        await users.SetLockoutEndDateAsync(target, r.Locked ? DateTimeOffset.MaxValue : null);
        if (!r.Locked) await users.ResetAccessFailedCountAsync(target);
        await audit.LogAsync(User.UserId(), r.Locked ? "User.Lock" : "User.Unlock", target.Email ?? target.Id);
        return await MapUserAsync(target);
    }

    [HttpPut("users/{id}/role"), Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<UserDto>> SetRole(string id, RoleRequest r)
    {
        if (r.Role is not (Roles.Admin or Roles.Manager or Roles.Customer)) throw new BusinessException("Vai trò không hợp lệ.");
        var target = await users.FindByIdAsync(id);
        if (target == null) return NotFound();
        if (target.Id == User.UserId()) throw new BusinessException("Không thể tự đổi vai trò của chính mình.");
        var current = await users.GetRolesAsync(target);
        await users.RemoveFromRolesAsync(target, current);
        await users.AddToRoleAsync(target, r.Role);
        await audit.LogAsync(User.UserId(), "User.Role", $"{target.Email} -> {r.Role}");
        return await MapUserAsync(target);
    }

    [HttpPost("staff"), Authorize(Roles = Roles.Admin)]
    public async Task<UserDto> CreateStaff(CreateStaffRequest r)
    {
        var u = new ApplicationUser { UserName = r.Email.Trim(), Email = r.Email.Trim(), FullName = r.FullName.Trim(), EmailConfirmed = true };
        var res = await users.CreateAsync(u, r.Password);
        if (!res.Succeeded)
            throw new BusinessException(string.Join(" ", res.Errors.Select(e => e.Code is "DuplicateUserName" or "DuplicateEmail" ? "Email này đã được sử dụng." : e.Description)));
        await users.AddToRoleAsync(u, Roles.Manager);
        await audit.LogAsync(User.UserId(), "Staff.Create", u.Email!);
        return await MapUserAsync(u);
    }

    [HttpGet("audit-logs"), Authorize(Roles = Roles.Admin)]
    public async Task<List<AuditLogDto>> AuditLogs() =>
        await (from l in db.AuditLogs.AsNoTracking()
               join u in db.Users on l.UserId equals u.Id into g
               from u in g.DefaultIfEmpty()
               orderby l.CreatedAt descending
               select new AuditLogDto(l.Id, u.Email, l.Action, l.Detail, l.CreatedAt)).Take(200).ToListAsync();

    private async Task<UserDto> MapUserAsync(ApplicationUser u) =>
        new(u.Id, u.Email ?? "", u.FullName, u.PhoneNumber, (await users.GetRolesAsync(u)).ToList(),
            u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow, u.CreatedAt);
}

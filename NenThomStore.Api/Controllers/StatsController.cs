namespace NenThomStore.Api.Controllers;

/// <summary>Thống kê công khai hiển thị trên website: lượt truy cập và lượt mua hàng.</summary>
[ApiController, Route("api/stats"), AllowAnonymous]
public class StatsController(AppDbContext db) : ControllerBase
{
    // Lấy số liệu hiện tại (không tăng lượt truy cập)
    [HttpGet]
    public async Task<SiteStatsDto> Get() => await BuildAsync();

    // Ghi nhận 1 lượt truy cập (Frontend chỉ gọi 1 lần cho mỗi phiên trình duyệt) rồi trả số liệu mới
    [HttpPost("visit")]
    public async Task<SiteStatsDto> Visit()
    {
        var id = await EnsureRowAsync();
        // Cập nhật nguyên tử ngay trong SQL để nhiều người truy cập cùng lúc không bị mất lượt
        await db.SiteStats.Where(s => s.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.VisitCount, x => x.VisitCount + 1));
        return await BuildAsync();
    }

    private async Task<int> EnsureRowAsync()
    {
        var id = await db.SiteStats.AsNoTracking().OrderBy(s => s.Id).Select(s => (int?)s.Id).FirstOrDefaultAsync();
        if (id.HasValue) return id.Value;
        var row = new SiteStat { VisitCount = SiteStat.SeedVisits, PurchaseBase = SiteStat.SeedPurchases };
        db.SiteStats.Add(row);
        await db.SaveChangesAsync();
        return row.Id;
    }

    private async Task<SiteStatsDto> BuildAsync()
    {
        await EnsureRowAsync();
        var s = await db.SiteStats.AsNoTracking().OrderBy(x => x.Id).FirstAsync();
        var realOrders = await db.Orders.CountAsync(o => o.Status != OrderStatus.Cancelled);
        return new SiteStatsDto(s.VisitCount, s.PurchaseBase + realOrders);
    }
}

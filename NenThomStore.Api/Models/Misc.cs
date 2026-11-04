namespace NenThomStore.Api.Models;

public class Review
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    [Required] public string UserId { get; set; } = "";
    public ApplicationUser User { get; set; } = null!;
    [Range(1, 5)] public int Rating { get; set; }
    [MaxLength(1000)] public string? Comment { get; set; }
    public bool IsHidden { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Voucher
{
    public int Id { get; set; }
    [Required, MaxLength(40)] public string Code { get; set; } = "";
    public int? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal MinOrder { get; set; }
    public int? MaxUses { get; set; }
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    public string? Validate(decimal subtotal)
    {
        if (!IsActive) return "Mã giảm giá đã ngừng hoạt động.";
        if (ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow) return "Mã giảm giá đã hết hạn.";
        if (MaxUses.HasValue && UsedCount >= MaxUses.Value) return "Mã giảm giá đã hết lượt sử dụng.";
        if (subtotal < MinOrder) return $"Đơn hàng tối thiểu {MinOrder:N0}₫ để dùng mã này.";
        return null;
    }

    public decimal Calculate(decimal subtotal)
    {
        var d = DiscountPercent.HasValue ? Math.Round(subtotal * DiscountPercent.Value / 100m, 0) : DiscountAmount ?? 0m;
        return Math.Clamp(d, 0m, subtotal);
    }
}

public class AuditLog
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    [MaxLength(80)] public string Action { get; set; } = "";
    [MaxLength(1000)] public string Detail { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Thống kê hiển thị trên website (một dòng duy nhất): lượt truy cập và số lượt mua nền.</summary>
public class SiteStat
{
    // Số liệu mẫu ban đầu để chạy demo (có thể đổi trong database bằng scripts/cap-nhat-so-lieu-ao.sql)
    public const int SeedVisits = 2499;      // lượt truy cập
    public const int SeedPurchases = 1775;   // lượt mua nền (hiển thị = số này + đơn thật)

    public int Id { get; set; }
    public int VisitCount { get; set; }
    public int PurchaseBase { get; set; }    // số lượt mua "nền"; lượt mua hiển thị = PurchaseBase + số đơn thật (không tính đơn đã hủy)
}

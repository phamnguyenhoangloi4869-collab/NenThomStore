namespace NenThomStore.Api.DTOs;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

// ---------- Account ----------
public class RegisterRequest
{
    [Required, StringLength(120)] public string FullName { get; set; } = "";
    [Required, EmailAddress, StringLength(200)] public string Email { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 8)] public string Password { get; set; } = "";
    [StringLength(20)] public string? Phone { get; set; }
}
public class LoginRequest
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}
public class UpdateProfileRequest
{
    [Required, StringLength(120)] public string FullName { get; set; } = "";
    [StringLength(20)] public string? Phone { get; set; }
    [StringLength(300)] public string? Address { get; set; }
}
public class ChangePasswordRequest
{
    [Required] public string CurrentPassword { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 8)] public string NewPassword { get; set; } = "";
}
public record ProfileDto(string Id, string Email, string FullName, string? Phone, string? Address, List<string> Roles);
public record AuthResponse(string Token, ProfileDto User);

// ---------- Catalog ----------
public class ProductQuery
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStock { get; set; }
    public bool? Featured { get; set; }
    public bool? OnSale { get; set; }
    public bool? IsNew { get; set; }
    public bool IncludeInactive { get; set; }
    public string? Sort { get; set; }          // price_asc | price_desc | name | newest | best
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class ProductSaveRequest : IValidatableObject
{
    [Required, StringLength(200)] public string Name { get; set; } = "";
    [StringLength(4000)] public string? Description { get; set; }
    [Range(1, 1_000_000_000)] public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    [StringLength(100)] public string? Scent { get; set; }
    [StringLength(50)] public string? Volume { get; set; }
    [Range(0, 100000)] public int? BurnTimeHours { get; set; }
    [Range(0, 1_000_000)] public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    [Range(1, int.MaxValue)] public int CategoryId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (SalePrice.HasValue && (SalePrice <= 0 || SalePrice >= Price))
            yield return new ValidationResult("Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc.", new[] { nameof(SalePrice) });
    }
}

public record ProductImageDto(int Id, string Url, bool IsPrimary);
public record ProductDto(int Id, string Name, string? Description, decimal Price, decimal? SalePrice, decimal EffectivePrice,
    string Scent, string Volume, int? BurnTimeHours, int Stock, bool IsActive, bool IsFeatured, int CategoryId, string CategoryName,
    string? ImageUrl, List<ProductImageDto> Images, double Rating, int ReviewCount, bool IsNew, int Sold);

public class CategorySaveRequest
{
    [Required, StringLength(100)] public string Name { get; set; } = "";
    [StringLength(500)] public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
public record CategoryDto(int Id, string Name, string? Description, bool IsActive, int ProductCount);

// ---------- Cart / Order ----------
public class CartItemRequest
{
    [Range(1, int.MaxValue)] public int ProductId { get; set; }
    [Range(1, 99)] public int Quantity { get; set; } = 1;
}
public class CartQuantityRequest { [Range(1, 99)] public int Quantity { get; set; } }
public record CartItemDto(int ProductId, string Name, string? ImageUrl, decimal UnitPrice, int Quantity, int Stock, bool Available, decimal LineTotal);
public record CartDto(List<CartItemDto> Items, decimal Subtotal);

public class CheckoutRequest
{
    [Required, StringLength(120)] public string ReceiverName { get; set; } = "";
    [Required, RegularExpression(@"^(\+?84|0)\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ.")] public string Phone { get; set; } = "";
    [Required, StringLength(300)] public string Address { get; set; } = "";
    [StringLength(500)] public string? Note { get; set; }
    [StringLength(40)] public string? VoucherCode { get; set; }
    [StringLength(64)] public string? IdempotencyKey { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cod;
}
public class OrderStatusRequest { public OrderStatus Status { get; set; } }
public class PaymentStatusRequest { public PaymentStatus Status { get; set; } }
public class OrderListQuery
{
    public string? Search { get; set; }
    public OrderStatus? Status { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
public record OrderDetailDto(int ProductId, string ProductName, decimal UnitPrice, int Quantity, decimal LineTotal);
public record OrderDto(int Id, string Code, OrderStatus Status, PaymentMethod PaymentMethod, PaymentStatus PaymentStatus,
    string ReceiverName, string Phone, string Address, string? Note, decimal Subtotal, decimal Discount, decimal Total,
    string? VoucherCode, DateTime CreatedAt, string? CustomerEmail, List<OrderDetailDto> Details, List<OrderStatus> NextStatuses);

// ---------- Review / Voucher ----------
public class ReviewRequest
{
    [Range(1, int.MaxValue)] public int ProductId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [StringLength(1000)] public string? Comment { get; set; }
}
public class ReviewUpdateRequest { [Range(1, 5)] public int Rating { get; set; } [StringLength(1000)] public string? Comment { get; set; } }
public class ReviewVisibilityRequest { public bool IsHidden { get; set; } }
public record ReviewDto(int Id, int ProductId, string? ProductName, string UserName, int Rating, string? Comment, bool IsHidden, bool IsMine, DateTime CreatedAt);

public class VoucherSaveRequest : IValidatableObject
{
    [Required, StringLength(40)] public string Code { get; set; } = "";
    [Range(1, 100)] public int? DiscountPercent { get; set; }
    [Range(1, 1_000_000_000)] public decimal? DiscountAmount { get; set; }
    [Range(0, 1_000_000_000)] public decimal MinOrder { get; set; }
    [Range(1, 1_000_000)] public int? MaxUses { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (DiscountPercent.HasValue == DiscountAmount.HasValue)
            yield return new ValidationResult("Chọn một trong hai: giảm theo % hoặc giảm số tiền cố định.");
    }
}
public record VoucherDto(int Id, string Code, int? DiscountPercent, decimal? DiscountAmount, decimal MinOrder, int? MaxUses, int UsedCount, DateTime? ExpiresAt, bool IsActive);
public record VoucherCheckDto(string Code, decimal Discount, decimal Total);

// ---------- Admin ----------
public record RevenuePoint(string Label, decimal Revenue, int Orders);
public record LowStockDto(int Id, string Name, int Stock);
public record DashboardDto(decimal TotalRevenue, int TotalOrders, int PendingOrders, int ActiveProducts, int LowStockProducts,
    List<LowStockDto> LowStockList, List<RevenuePoint> Series);
public record UserDto(string Id, string Email, string FullName, string? Phone, List<string> Roles, bool IsLocked, DateTime CreatedAt);
public class LockRequest { public bool Locked { get; set; } }
public class RoleRequest { [Required] public string Role { get; set; } = ""; }
public class CreateStaffRequest
{
    [Required, StringLength(120)] public string FullName { get; set; } = "";
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 8)] public string Password { get; set; } = "";
}
public record AuditLogDto(int Id, string? UserEmail, string Action, string Detail, DateTime CreatedAt);

public record SiteStatsDto(int Visits, int Purchases);

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace NenThomStore.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SiteStat> SiteStats => Set<SiteStat>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Category>().HasIndex(x => x.Name).IsUnique();

        b.Entity<Product>(e =>
        {
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.Property(x => x.SalePrice).HasPrecision(18, 2);
            e.HasIndex(x => x.Name);
            e.HasOne(x => x.Category).WithMany(c => c.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.ToTable(t => t.HasCheckConstraint("CK_Products_Stock", "[Stock] >= 0"));
        });

        b.Entity<Cart>().HasIndex(x => x.UserId).IsUnique();
        b.Entity<CartItem>().HasIndex(x => new { x.CartId, x.ProductId }).IsUnique();

        b.Entity<Order>(e =>
        {
            e.Property(x => x.Subtotal).HasPrecision(18, 2);
            e.Property(x => x.Discount).HasPrecision(18, 2);
            e.Property(x => x.Total).HasPrecision(18, 2);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => new { x.UserId, x.IdempotencyKey }).IsUnique().HasFilter("[IdempotencyKey] IS NOT NULL");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<OrderDetail>(e =>
        {
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Payment>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.Method).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        });

        b.Entity<Review>(e =>
        {
            e.HasIndex(x => new { x.ProductId, x.UserId }).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Voucher>(e =>
        {
            e.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.MinOrder).HasPrecision(18, 2);
            e.HasIndex(x => x.Code).IsUnique();
        });
    }
}

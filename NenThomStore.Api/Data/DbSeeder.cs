using Microsoft.AspNetCore.Identity;

namespace NenThomStore.Api.Data;

public static class DbSeeder
{
    private const string SampleDesc = "[Dữ liệu mẫu] Mô tả sản phẩm sẽ được cập nhật trong trang quản trị.";

    public static async Task SeedAsync(IServiceProvider sp, IConfiguration cfg, bool isDev)
    {
        var db = sp.GetRequiredService<AppDbContext>();
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("Seeder");

        if (db.Database.GetMigrations().Any()) await db.Database.MigrateAsync();
        else if (isDev) await db.Database.EnsureCreatedAsync();   // chỉ khi chưa tạo migration (xem README)

        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var r in new[] { Roles.Admin, Roles.Manager, Roles.Customer })
            if (!await roleManager.RoleExistsAsync(r)) await roleManager.CreateAsync(new IdentityRole(r));

        var users = sp.GetRequiredService<UserManager<ApplicationUser>>();

        // Admin đầu tiên: lấy từ user-secrets / biến môi trường, KHÔNG hardcode trong mã nguồn
        var adminEmail = cfg["Seed:AdminEmail"];
        var adminPassword = cfg["Seed:AdminPassword"];
        if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
            await EnsureUserAsync(users, logger, adminEmail, "Quản trị viên", adminPassword, Roles.Admin);

        // Tài khoản thử nghiệm: chỉ môi trường phát triển và chỉ khi có Seed:DevPassword
        var devPassword = cfg["Seed:DevPassword"];
        if (isDev && !string.IsNullOrWhiteSpace(devPassword))
        {
            await EnsureUserAsync(users, logger, "manager@aura.local", "Quản lý thử nghiệm", devPassword, Roles.Manager);
            await EnsureUserAsync(users, logger, "customer@aura.local", "Khách hàng thử nghiệm", devPassword, Roles.Customer);
        }

        if (!await db.Categories.AnyAsync())
        {
            var cats = new[]
            {
                new Category { Name = "Nến ly", Description = "Nến thơm đổ ly, dễ dùng và dễ bảo quản." },
                new Category { Name = "Nến hộp thiếc", Description = "Nến hộp thiếc nhỏ gọn, tiện mang theo." },
                new Category { Name = "Set quà tặng", Description = "Combo nến đóng hộp dành cho quà tặng." },
                new Category { Name = "Phụ kiện", Description = "Dụng cụ cắt bấc, tắt nến và phụ kiện đi kèm." }
            };
            db.Categories.AddRange(cats);
            await db.SaveChangesAsync();

            Product P(string n, int c, decimal price, decimal? sale, string scent, string vol, int burn, int stock, bool feat) => new()
            {
                Name = n, CategoryId = cats[c].Id, Price = price, SalePrice = sale, Scent = scent, Volume = vol,
                BurnTimeHours = burn == 0 ? null : burn, Stock = stock, IsFeatured = feat, Description = SampleDesc
            };
            // Dữ liệu mẫu để kiểm thử, chưa có ảnh sản phẩm thật -> giao diện dùng ảnh placeholder
            db.Products.AddRange(
                P("Nến ly Biển Xanh", 0, 189000, null, "Muối biển & rong biển", "200g", 45, 30, true),
                P("Nến ly Dừa Nắng", 0, 169000, 149000, "Dừa & vani", "200g", 45, 25, true),
                P("Nến ly Hoa Sứ", 0, 179000, null, "Hoa sứ & hoa nhài", "200g", 45, 20, true),
                P("Nến ly Chanh Sả", 0, 159000, 139000, "Chanh & sả", "180g", 40, 3, false),
                P("Nến thiếc Trà Trắng", 1, 99000, null, "Trà trắng", "80g", 20, 40, false),
                P("Nến thiếc Gỗ Ấm", 1, 109000, 89000, "Gỗ đàn hương", "80g", 20, 35, true),
                P("Set quà Mùa Hè", 2, 399000, 349000, "Tuyển chọn 3 mùi", "3 x 80g", 60, 15, true),
                P("Bộ cắt bấc nến", 3, 79000, null, "", "1 bộ", 0, 50, false));
        }

        if (!await db.Vouchers.AnyAsync())
            db.Vouchers.Add(new Voucher { Code = "WELCOME10", DiscountPercent = 10, MinOrder = 150000, IsActive = true });

        // Số liệu thống kê hiển thị (lượt truy cập ~2000, lượt mua < 2000). Chỉ tạo khi chưa có dòng nào.
        if (!await db.SiteStats.AnyAsync())
            db.SiteStats.Add(new SiteStat { VisitCount = SiteStat.SeedVisits, PurchaseBase = SiteStat.SeedPurchases });

        await db.SaveChangesAsync();
    }

    private static async Task EnsureUserAsync(UserManager<ApplicationUser> um, ILogger log, string email, string name, string password, string role)
    {
        if (await um.FindByEmailAsync(email) != null) return;
        var u = new ApplicationUser { UserName = email, Email = email, FullName = name, EmailConfirmed = true };
        var res = await um.CreateAsync(u, password);
        if (!res.Succeeded) { log.LogWarning("Không tạo được {Email}: {Errors}", email, string.Join("; ", res.Errors.Select(e => e.Description))); return; }
        await um.AddToRoleAsync(u, role);
    }
}

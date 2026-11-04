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

        // Cập nhật nội dung sản phẩm theo file Word FIX_THE_AURA: chỉ điền chỗ còn trống/mẫu, không ghi đè nội dung bạn đã sửa tay.
        var content = new (string Name, string Desc, string Scent, string Volume)[]
        {
            ("Đèn đốt nến thơm", "Ưu điểm: Đun chảy nến bằng nhiệt bóng đèn, không dùng lửa, không khói, an toàn tuyệt đối và giúp nến thơm lâu hơn.\nChất liệu: Thân kim loại kết hợp đế gỗ tự nhiên sang trọng, dùng làm đèn ngủ hoặc decor phòng cực xinh.\nCó 2 màu lựa chọn:\nChụp đen – Thân vàng kim (hiện đại, cá tính).\nChụp trắng – Thân vàng kim (tối giản, thanh lịch).", "", ""),
            ("Sao Biển Xanh Ngọc", "Nến decor hình sao biển độc đáo với tông màu xanh ngọc mát mắt, trang trí thêm vỏ sò sinh động bên trong, mang hơi hướng biển cả tươi mát.\nCông dụng: Thích hợp làm nến thơm trang trí phòng, góc chụp ảnh hoặc làm quà tặng xinh xắn.", "", "300g"),
            ("Ốc Biển Xanh Ngọc", "Nến decor hình vỏ ốc độc đáo với lớp sáp màu xanh ngọc trong suốt, trang trí thêm vỏ sò nhỏ bên trong mang đậm hơi thở đại dương.\nCông dụng: Dùng để trang trí góc làm việc, phòng ngủ, làm phụ kiện chụp ảnh hoặc quà tặng xinh xắn.", "", "150g"),
            ("Ốc Đảo Biển Sâu", "Nến hũ thủy tinh thiết kế lấy cảm hứng từ đại dương sâu thẳm với lớp sáp màu xanh dương độc đáo, trang trí hạt cát và vỏ ốc bên trên. Mùi hương mang lại cảm giác tươi mát, thư giãn.", "Coastal Sun & Coconut Water (Nắng ven biển & Nước dừa)", "200g"),
            ("Tiểu Tiên Cá Biển Xanh", "Set quà tặng nến thơm chủ đề đại dương dễ thương, trang trí mô hình tiểu tiên cá kết hợp vỏ sò, sao biển sinh động.", "Ocean Breeze & Sea Salt (Gió biển & Muối biển)", "300g"),
            ("SET 3 HŨ NẾN THƠM HƯƠNG BIỂN", "Set gồm 3 hũ nến thủy tinh trang trí phong cách đại dương, kèm tiểu cảnh xinh xắn.", "Aquatic (Hương biển tươi mát, dễ chịu)", "800g"),
            ("Set quà Mùa Hè (3 nến thiếc)", "Hộp quà gồm 3 nến thiếc (50g) với các mùi hương: Cam bergamot, Chanh sả, Dừa.", "Tuyển chọn 3 mùi", "3 x 50g"),
            ("Nến ly Biển Xanh 100g", "Nến ly thủy tinh màu xanh mát mắt, thiết kế nhỏ gọn, mang hương vị biển cả thư giãn.", "Muối biển & rong biển", "100g"),
            ("Nến ly Dừa Nắng 100g", "Nến ly kèm nắp gỗ mộc mạc, mang hương thơm ngọt ngào, ấm áp chuẩn vị mùa hè.", "Dừa & vani", "100g"),
            ("Nến thiếc Cam Bergamot 50g", "Nến hộp thiếc nhỏ gọn, tiện lợi mang theo, hương cam chanh tươi mát giúp giải tỏa căng thẳng.", "Cam bergamot", "50g"),
            ("Nến hũ Quế Táo 300g", "Nến hũ dung tích lớn, hương quế kết hợp táo đỏ ngọt ấm, cực kỳ thích hợp cho không gian ấm cúng mùa đông.", "Quế & táo đỏ", "300g"),
            ("Set quà Thư Giãn (nến ly + kéo cắt bấc)", "Hộp quà tặng kèm nến ly và phụ kiện kéo cắt bấc tiện lợi, thư giãn tuyệt vời.", "Oải hương", "200g + phụ kiện"),
            ("Nến ly Hoa Sứ 100g", "Nến ly nắp gỗ thơm ngát hương hoa dịu nhẹ, trang nhã.", "Hoa sứ & hoa nhài", "100g"),
            ("Set quà Cao Cấp (2 nến hũ + dụng cụ tắt nến)", "Set quà sang trọng gồm 2 hũ nến và dụng cụ tắt nến cao cấp.", "Gỗ đàn hương & trà trắng", "2 x 250g"),
            ("Nến hũ Gỗ Đàn Hương 250g", "Nến hũ dung tích lớn mang hương gỗ ấm áp, trầm lắng và sang trọng.", "Gỗ đàn hương & hổ phách", "250g"),
            ("Nến thiếc Vani 80g", "Hộp thiếc nhỏ gọn, hương thơm ngọt ngào, ấm cúng.", "Vani & caramel", "80g"),
            ("Nến ly Oải Hương 200g", "Nến ly dung tích lớn giúp thư giãn tinh thần, dễ ngủ.", "Oải hương (lavender)", "200g"),
        };
        var existing = await db.Products.ToListAsync();
        foreach (var c in content)
        {
            var p = existing.FirstOrDefault(x => x.Name == c.Name);
            if (p == null) continue;
            if (string.IsNullOrWhiteSpace(p.Description) || p.Description.StartsWith("[Dữ liệu mẫu]")) p.Description = c.Desc;
            if (string.IsNullOrWhiteSpace(p.Scent)) p.Scent = c.Scent;
            if (string.IsNullOrWhiteSpace(p.Volume) || p.Volume == "150") p.Volume = c.Volume;
        }

        // Nâng số liệu hiển thị lên tối thiểu 2499 lượt truy cập / 1775 lượt mua nền (không bao giờ hạ xuống).
        var stat = await db.SiteStats.OrderBy(s => s.Id).FirstOrDefaultAsync();
        if (stat != null)
        {
            if (stat.VisitCount < SiteStat.SeedVisits) stat.VisitCount = SiteStat.SeedVisits;
            if (stat.PurchaseBase < SiteStat.SeedPurchases) stat.PurchaseBase = SiteStat.SeedPurchases;
        }

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

namespace NenThomStore.Api.Services;

public class ProductService(AppDbContext db, AuditService audit, ImageService images)
{
    public async Task<PagedResult<ProductDto>> QueryAsync(ProductQuery q, bool includeInactive)
    {
        var query = db.Products.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(p => p.IsActive && p.Category.IsActive);
        if (!string.IsNullOrWhiteSpace(q.Search)) { var s = q.Search.Trim(); query = query.Where(p => p.Name.Contains(s) || p.Scent.Contains(s)); }
        if (q.CategoryId.HasValue) { var c = q.CategoryId.Value; query = query.Where(p => p.CategoryId == c); }
        if (q.MinPrice.HasValue) { var min = q.MinPrice.Value; query = query.Where(p => (p.SalePrice != null && p.SalePrice < p.Price ? p.SalePrice.Value : p.Price) >= min); }
        if (q.MaxPrice.HasValue) { var max = q.MaxPrice.Value; query = query.Where(p => (p.SalePrice != null && p.SalePrice < p.Price ? p.SalePrice.Value : p.Price) <= max); }
        if (q.InStock == true) query = query.Where(p => p.Stock > 0);
        if (q.Featured == true) query = query.Where(p => p.IsFeatured);
        if (q.OnSale == true) query = query.Where(p => p.SalePrice != null && p.SalePrice < p.Price);
        if (q.IsNew == true) { var since = DateTime.UtcNow.AddDays(-30); query = query.Where(p => p.CreatedAt >= since); }

        query = q.Sort switch
        {
            "price_asc" => query.OrderBy(p => p.SalePrice != null && p.SalePrice < p.Price ? p.SalePrice.Value : p.Price).ThenBy(p => p.Id),
            "price_desc" => query.OrderByDescending(p => p.SalePrice != null && p.SalePrice < p.Price ? p.SalePrice.Value : p.Price).ThenBy(p => p.Id),
            "name" => query.OrderBy(p => p.Name).ThenBy(p => p.Id),
            "best" => query.OrderByDescending(p => db.OrderDetails.Where(d => d.ProductId == p.Id && d.Order.Status != OrderStatus.Cancelled).Sum(d => (int?)d.Quantity) ?? 0).ThenBy(p => p.Id),
            _ => query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
        };

        var total = await query.CountAsync();
        var page = Math.Max(1, q.Page);
        var size = Math.Clamp(q.PageSize, 1, 60);
        var list = await query.Include(p => p.Category).Include(p => p.Images).Skip((page - 1) * size).Take(size).ToListAsync();
        return new PagedResult<ProductDto>(await MapAsync(list), total, page, size);
    }

    public async Task<ProductDto?> GetAsync(int id, bool includeInactive)
    {
        var p = await db.Products.AsNoTracking().Include(x => x.Category).Include(x => x.Images).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null || (!includeInactive && (!p.IsActive || !p.Category.IsActive))) return null;
        return (await MapAsync(new List<Product> { p }))[0];
    }

    public async Task<ProductDto> CreateAsync(ProductSaveRequest r, string actorId)
    {
        await EnsureCategoryAsync(r.CategoryId);
        var p = new Product();
        Apply(p, r);
        db.Products.Add(p);
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "Product.Create", $"#{p.Id} {p.Name}");
        return (await GetAsync(p.Id, true))!;
    }

    public async Task<ProductDto?> UpdateAsync(int id, ProductSaveRequest r, string actorId)
    {
        var p = await db.Products.FindAsync(id);
        if (p == null) return null;
        await EnsureCategoryAsync(r.CategoryId);
        Apply(p, r);
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "Product.Update", $"#{p.Id} {p.Name}");
        return await GetAsync(id, true);
    }

    /// Ngừng kinh doanh (xóa mềm) để không làm mất lịch sử đơn hàng.
    public async Task<bool> DeactivateAsync(int id, string actorId)
    {
        var p = await db.Products.FindAsync(id);
        if (p == null) return false;
        p.IsActive = false;
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "Product.Deactivate", $"#{p.Id} {p.Name}");
        return true;
    }

    public async Task<ProductImageDto> AddImageAsync(int productId, IFormFile file, string actorId)
    {
        var p = await db.Products.Include(x => x.Images).FirstOrDefaultAsync(x => x.Id == productId) ?? throw new BusinessException("Không tìm thấy sản phẩm.", 404);
        if (p.Images.Count >= 8) throw new BusinessException("Mỗi sản phẩm tối đa 8 ảnh.");
        var url = await images.SaveProductImageAsync(file);
        var img = new ProductImage { ProductId = p.Id, Url = url, IsPrimary = p.Images.Count == 0, SortOrder = p.Images.Count };
        db.ProductImages.Add(img);
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "Product.AddImage", $"#{p.Id} {url}");
        return new ProductImageDto(img.Id, img.Url, img.IsPrimary);
    }

    public async Task<bool> DeleteImageAsync(int imageId, string actorId)
    {
        var img = await db.ProductImages.FindAsync(imageId);
        if (img == null) return false;
        var url = img.Url;
        var wasPrimary = img.IsPrimary;
        var productId = img.ProductId;
        db.ProductImages.Remove(img);
        await db.SaveChangesAsync();
        if (wasPrimary)
        {
            var next = await db.ProductImages.Where(i => i.ProductId == productId).OrderBy(i => i.SortOrder).FirstOrDefaultAsync();
            if (next != null) { next.IsPrimary = true; await db.SaveChangesAsync(); }
        }
        if (!await db.ProductImages.AnyAsync(i => i.Url == url)) images.Delete(url);   // không xóa file còn được tham chiếu
        await audit.LogAsync(actorId, "Product.DeleteImage", $"#{productId} {url}");
        return true;
    }

    private async Task EnsureCategoryAsync(int id)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == id)) throw new BusinessException("Danh mục không tồn tại.");
    }

    private static void Apply(Product p, ProductSaveRequest r)
    {
        p.Name = r.Name.Trim(); p.Description = r.Description?.Trim(); p.Price = r.Price; p.SalePrice = r.SalePrice;
        p.Scent = r.Scent?.Trim() ?? ""; p.Volume = r.Volume?.Trim() ?? ""; p.BurnTimeHours = r.BurnTimeHours;
        p.Stock = r.Stock; p.IsActive = r.IsActive; p.IsFeatured = r.IsFeatured; p.CategoryId = r.CategoryId;
    }

    private async Task<List<ProductDto>> MapAsync(List<Product> products)
    {
        var ids = products.Select(p => p.Id).ToList();
        var ratings = await db.Reviews.Where(r => ids.Contains(r.ProductId) && !r.IsHidden)
            .GroupBy(r => r.ProductId).Select(g => new { g.Key, Avg = g.Average(x => (double)x.Rating), Cnt = g.Count() }).ToDictionaryAsync(x => x.Key);
        var sold = await db.OrderDetails.Where(d => ids.Contains(d.ProductId) && d.Order.Status != OrderStatus.Cancelled)
            .GroupBy(d => d.ProductId).Select(g => new { g.Key, Qty = g.Sum(x => x.Quantity) }).ToDictionaryAsync(x => x.Key, x => x.Qty);
        var since = DateTime.UtcNow.AddDays(-30);

        return products.Select(p =>
        {
            var imgs = p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).Select(i => new ProductImageDto(i.Id, i.Url, i.IsPrimary)).ToList();
            ratings.TryGetValue(p.Id, out var rt);
            return new ProductDto(p.Id, p.Name, p.Description, p.Price, p.SalePrice, p.EffectivePrice, p.Scent, p.Volume, p.BurnTimeHours,
                p.Stock, p.IsActive, p.IsFeatured, p.CategoryId, p.Category.Name, imgs.FirstOrDefault()?.Url, imgs,
                rt == null ? 0 : Math.Round(rt.Avg, 1), rt?.Cnt ?? 0, p.CreatedAt >= since, sold.GetValueOrDefault(p.Id));
        }).ToList();
    }
}

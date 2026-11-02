namespace NenThomStore.Api.Services;

public class CartService(AppDbContext db)
{
    private async Task<Cart> GetOrCreateAsync(string userId)
    {
        var cart = await db.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart != null) return cart;
        cart = new Cart { UserId = userId };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        return cart;
    }

    public async Task<CartDto> GetAsync(string userId)
    {
        var cart = await GetOrCreateAsync(userId);
        var rows = await db.CartItems.AsNoTracking().Where(i => i.CartId == cart.Id)
            .Include(i => i.Product).ThenInclude(p => p.Images).Include(i => i.Product).ThenInclude(p => p.Category)
            .OrderBy(i => i.Id).ToListAsync();
        var items = rows.Select(i =>
        {
            var p = i.Product;
            var img = p.Images.OrderByDescending(x => x.IsPrimary).ThenBy(x => x.SortOrder).FirstOrDefault()?.Url;
            var ok = p.IsActive && p.Category.IsActive && p.Stock >= i.Quantity;
            return new CartItemDto(p.Id, p.Name, img, p.EffectivePrice, i.Quantity, p.Stock, ok, p.EffectivePrice * i.Quantity);
        }).ToList();
        return new CartDto(items, items.Sum(i => i.LineTotal));
    }

    public async Task<CartDto> AddAsync(string userId, CartItemRequest r)
    {
        var product = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == r.ProductId);
        if (product == null || !product.IsActive || !product.Category.IsActive) throw new BusinessException("Sản phẩm không còn kinh doanh.");
        var cart = await GetOrCreateAsync(userId);
        var item = await db.CartItems.FirstOrDefaultAsync(i => i.CartId == cart.Id && i.ProductId == r.ProductId);
        var newQty = (item?.Quantity ?? 0) + r.Quantity;
        if (newQty > product.Stock) throw new BusinessException($"Chỉ còn {product.Stock} sản phẩm trong kho.");
        if (newQty > 99) throw new BusinessException("Tối đa 99 sản phẩm cho mỗi mặt hàng.");
        if (item == null) db.CartItems.Add(new CartItem { CartId = cart.Id, ProductId = r.ProductId, Quantity = newQty });
        else item.Quantity = newQty;
        await db.SaveChangesAsync();
        return await GetAsync(userId);
    }

    public async Task<CartDto> SetQuantityAsync(string userId, int productId, int quantity)
    {
        var cart = await GetOrCreateAsync(userId);
        var item = await db.CartItems.Include(i => i.Product).FirstOrDefaultAsync(i => i.CartId == cart.Id && i.ProductId == productId)
                   ?? throw new BusinessException("Sản phẩm không có trong giỏ.", 404);
        if (quantity > item.Product.Stock) throw new BusinessException($"Chỉ còn {item.Product.Stock} sản phẩm trong kho.");
        item.Quantity = quantity;
        await db.SaveChangesAsync();
        return await GetAsync(userId);
    }

    public async Task<CartDto> RemoveAsync(string userId, int productId)
    {
        var cart = await GetOrCreateAsync(userId);
        await db.CartItems.Where(i => i.CartId == cart.Id && i.ProductId == productId).ExecuteDeleteAsync();
        return await GetAsync(userId);
    }
}

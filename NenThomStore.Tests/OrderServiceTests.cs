using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NenThomStore.Api.Data;
using NenThomStore.Api.DTOs;
using NenThomStore.Api.Models;
using NenThomStore.Api.Services;
using Xunit;

namespace NenThomStore.Tests;

public class OrderServiceTests : IDisposable
{
    private readonly SqliteConnection _conn = new("DataSource=:memory:");
    private readonly AppDbContext _db;
    private readonly OrderService _svc;

    public OrderServiceTests()
    {
        _conn.Open();
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_conn).Options);
        _db.Database.EnsureCreated();
        _svc = new OrderService(_db, new AuditService(_db));

        var cat = new Category { Name = "Nến ly" };
        _db.Users.Add(new ApplicationUser { Id = "u1", UserName = "u1@test", Email = "u1@test", FullName = "U1" });
        _db.Products.Add(new Product { Name = "Nến A", Category = cat, Price = 100000, SalePrice = 80000, Stock = 5 });
        _db.Vouchers.Add(new Voucher { Code = "OFF10", DiscountPercent = 10, MinOrder = 0 });
        _db.SaveChanges();
    }

    private void FillCart(int qty)
    {
        var pid = _db.Products.Single().Id;
        var cart = new Cart { UserId = "u1", Items = { new CartItem { ProductId = pid, Quantity = qty } } };
        _db.Carts.Add(cart);
        _db.SaveChanges();
    }

    private static CheckoutRequest Req(string? key = null, string? voucher = null) => new()
    { ReceiverName = "A", Phone = "0901234567", Address = "HCM", IdempotencyKey = key, VoucherCode = voucher };

    [Fact]
    public async Task Checkout_UsesDatabasePrice_AndDecrementsStock()
    {
        FillCart(2);
        var o = await _svc.CheckoutAsync("u1", Req(voucher: "OFF10"));
        Assert.Equal(160000m, o.Subtotal);          // 2 x giá khuyến mãi 80.000 từ database
        Assert.Equal(16000m, o.Discount);
        Assert.Equal(144000m, o.Total);
        Assert.Equal(3, _db.Products.AsNoTracking().Single().Stock);
        Assert.Empty(_db.CartItems);
    }

    [Fact]
    public async Task Checkout_Fails_WhenStockInsufficient_AndKeepsStock()
    {
        FillCart(6);
        await Assert.ThrowsAsync<BusinessException>(() => _svc.CheckoutAsync("u1", Req()));
        Assert.Equal(5, _db.Products.AsNoTracking().Single().Stock);
        Assert.Empty(_db.Orders);
    }

    [Fact]
    public async Task Checkout_SameIdempotencyKey_CreatesSingleOrder()
    {
        FillCart(1);
        var a = await _svc.CheckoutAsync("u1", Req("key-1"));
        var b = await _svc.CheckoutAsync("u1", Req("key-1"));
        Assert.Equal(a.Id, b.Id);
        Assert.Equal(1, _db.Orders.Count());
        Assert.Equal(4, _db.Products.AsNoTracking().Single().Stock);
    }

    [Fact]
    public async Task Cancel_RestoresStock()
    {
        FillCart(2);
        var o = await _svc.CheckoutAsync("u1", Req());
        await _svc.CancelByCustomerAsync(o.Id, "u1");
        Assert.Equal(5, _db.Products.AsNoTracking().Single().Stock);
    }

    [Fact]
    public async Task Customer_CannotCancelOthersOrder()
    {
        FillCart(1);
        var o = await _svc.CheckoutAsync("u1", Req());
        await Assert.ThrowsAsync<BusinessException>(() => _svc.CancelByCustomerAsync(o.Id, "other-user"));
        Assert.Null(await _svc.GetAsync(o.Id, "other-user", isStaff: false));   // chống IDOR
    }

    [Fact]
    public async Task InvalidStatusTransition_IsRejected()
    {
        FillCart(1);
        var o = await _svc.CheckoutAsync("u1", Req());
        await Assert.ThrowsAsync<BusinessException>(() => _svc.UpdateStatusAsync(o.Id, OrderStatus.Delivered, "admin"));
    }

    public void Dispose() { _db.Dispose(); _conn.Dispose(); }
}

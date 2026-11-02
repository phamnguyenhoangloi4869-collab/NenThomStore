namespace NenThomStore.Api.Models;

public class Cart
{
    public int Id { get; set; }
    [Required] public string UserId { get; set; } = "";
    public ApplicationUser User { get; set; } = null!;
    public List<CartItem> Items { get; set; } = new();
}

public class CartItem
{
    public int Id { get; set; }
    public int CartId { get; set; }
    public Cart Cart { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
}

public class Order
{
    public int Id { get; set; }
    [Required, MaxLength(30)] public string Code { get; set; } = "";
    [Required] public string UserId { get; set; } = "";
    public ApplicationUser User { get; set; } = null!;
    [Required, MaxLength(120)] public string ReceiverName { get; set; } = "";
    [Required, MaxLength(20)] public string Phone { get; set; } = "";
    [Required, MaxLength(300)] public string Address { get; set; } = "";
    [MaxLength(500)] public string? Note { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    [MaxLength(40)] public string? VoucherCode { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cod;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    [MaxLength(64)] public string? IdempotencyKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<OrderDetail> Details { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}

public class OrderDetail
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    [Required, MaxLength(200)] public string ProductName { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public decimal Amount { get; set; }
    public DateTime? PaidAt { get; set; }
}

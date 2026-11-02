using System.ComponentModel.DataAnnotations.Schema;

namespace NenThomStore.Api.Models;

public class Category
{
    public int Id { get; set; }
    [Required, MaxLength(100)] public string Name { get; set; } = "";
    [MaxLength(500)] public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public List<Product> Products { get; set; } = new();
}

public class Product
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [MaxLength(4000)] public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    [MaxLength(100)] public string Scent { get; set; } = "";
    [MaxLength(50)] public string Volume { get; set; } = "";
    public int? BurnTimeHours { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public List<ProductImage> Images { get; set; } = new();

    [NotMapped]
    public decimal EffectivePrice => SalePrice is > 0 && SalePrice < Price ? SalePrice.Value : Price;
}

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    [Required, MaxLength(300)] public string Url { get; set; } = "";
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
}

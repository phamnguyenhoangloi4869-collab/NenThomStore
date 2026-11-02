namespace NenThomStore.Api.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Customer = "Customer";
    public const string Staff = "Admin,Manager";
}

public enum OrderStatus { Pending, Confirmed, Shipping, Delivered, Cancelled }
public enum PaymentMethod { Cod }
public enum PaymentStatus { Unpaid, Paid }

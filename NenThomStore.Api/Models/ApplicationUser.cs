using Microsoft.AspNetCore.Identity;

namespace NenThomStore.Api.Models;

public class ApplicationUser : IdentityUser
{
    [MaxLength(120)] public string FullName { get; set; } = "";
    [MaxLength(300)] public string? Address { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

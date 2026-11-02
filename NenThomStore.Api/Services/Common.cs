using Microsoft.AspNetCore.Diagnostics;

namespace NenThomStore.Api.Services;

public class BusinessException(string message, int statusCode = 400) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        int status; string title;
        if (ex is BusinessException be) { status = be.StatusCode; title = be.Message; }
        else
        {
            logger.LogError(ex, "Lỗi không xử lý được tại {Path}", ctx.Request.Path);
            status = 500; title = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";   // không trả stack trace
        }
        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title, Detail = title }, ct);
        return true;
    }
}

public static class ClaimsExtensions
{
    public static string UserId(this ClaimsPrincipal u) => u.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new BusinessException("Chưa đăng nhập.", 401);
    public static bool IsStaff(this ClaimsPrincipal u) => u.IsInRole(Roles.Admin) || u.IsInRole(Roles.Manager);
}

public class AuditService(AppDbContext db)
{
    public async Task LogAsync(string? userId, string action, string detail)
    {
        db.AuditLogs.Add(new AuditLog { UserId = userId, Action = action, Detail = detail.Length > 1000 ? detail[..1000] : detail });
        await db.SaveChangesAsync();
    }
}

namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/reviews")]
public class ReviewsController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<List<ReviewDto>> List([FromQuery] int productId)
    {
        var uid = User.Identity?.IsAuthenticated == true ? User.FindFirstValue(ClaimTypes.NameIdentifier) : null;
        var rows = await db.Reviews.AsNoTracking().Include(r => r.User)
            .Where(r => r.ProductId == productId && !r.IsHidden).OrderByDescending(r => r.CreatedAt).Take(100).ToListAsync();
        return rows.Select(r => Map(r, uid)).ToList();
    }

    [HttpPost, Authorize]
    public async Task<ReviewDto> Create(ReviewRequest r)
    {
        var uid = User.UserId();
        var bought = await db.OrderDetails.AnyAsync(d => d.ProductId == r.ProductId && d.Order.UserId == uid && d.Order.Status == OrderStatus.Delivered);
        if (!bought) throw new BusinessException("Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng thành công.", 403);
        if (await db.Reviews.AnyAsync(x => x.ProductId == r.ProductId && x.UserId == uid)) throw new BusinessException("Bạn đã đánh giá sản phẩm này rồi.");
        var rv = new Review { ProductId = r.ProductId, UserId = uid, Rating = r.Rating, Comment = r.Comment?.Trim() };
        db.Reviews.Add(rv);
        await db.SaveChangesAsync();
        await db.Entry(rv).Reference(x => x.User).LoadAsync();
        return Map(rv, uid);
    }

    [HttpPut("{id:int}"), Authorize]
    public async Task<ActionResult<ReviewDto>> Update(int id, ReviewUpdateRequest r)
    {
        var uid = User.UserId();
        var rv = await db.Reviews.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (rv == null) return NotFound();
        rv.Rating = r.Rating; rv.Comment = r.Comment?.Trim();
        await db.SaveChangesAsync();
        return Map(rv, uid);
    }

    [HttpDelete("{id:int}"), Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var uid = User.UserId();
        var rv = await db.Reviews.FindAsync(id);
        if (rv == null || (rv.UserId != uid && !User.IsInRole(Roles.Admin))) return NotFound();
        db.Reviews.Remove(rv);
        await db.SaveChangesAsync();
        if (rv.UserId != uid) await audit.LogAsync(uid, "Review.Delete", $"#{id}");
        return NoContent();
    }

    [HttpGet("admin"), Authorize(Roles = Roles.Staff)]
    public async Task<List<ReviewDto>> ListAll()
    {
        var rows = await db.Reviews.AsNoTracking().Include(r => r.User).Include(r => r.Product).OrderByDescending(r => r.CreatedAt).Take(200).ToListAsync();
        return rows.Select(r => Map(r, null)).ToList();
    }

    [HttpPut("{id:int}/visibility"), Authorize(Roles = Roles.Staff)]
    public async Task<IActionResult> SetVisibility(int id, ReviewVisibilityRequest r)
    {
        var rv = await db.Reviews.FindAsync(id);
        if (rv == null) return NotFound();
        rv.IsHidden = r.IsHidden;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Review.Visibility", $"#{id} hidden={r.IsHidden}");
        return NoContent();
    }

    private static ReviewDto Map(Review r, string? uid) =>
        new(r.Id, r.ProductId, r.Product?.Name, r.User?.FullName ?? "Khách hàng", r.Rating, r.Comment, r.IsHidden, uid != null && r.UserId == uid, r.CreatedAt);
}

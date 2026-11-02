namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/categories")]
public class CategoriesController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<List<CategoryDto>> List([FromQuery] bool all = false)
    {
        var q = db.Categories.AsNoTracking().AsQueryable();
        if (!(all && User.IsStaff())) q = q.Where(c => c.IsActive);
        return await q.OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.IsActive, c.Products.Count(p => p.IsActive))).ToListAsync();
    }

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<CategoryDto> Create(CategorySaveRequest r)
    {
        var name = r.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.Name == name)) throw new BusinessException("Tên danh mục đã tồn tại.");
        var c = new Category { Name = name, Description = r.Description?.Trim(), IsActive = r.IsActive };
        db.Categories.Add(c);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Category.Create", $"#{c.Id} {c.Name}");
        return new CategoryDto(c.Id, c.Name, c.Description, c.IsActive, 0);
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategorySaveRequest r)
    {
        var c = await db.Categories.FindAsync(id);
        if (c == null) return NotFound();
        var name = r.Name.Trim();
        if (await db.Categories.AnyAsync(x => x.Name == name && x.Id != id)) throw new BusinessException("Tên danh mục đã tồn tại.");
        c.Name = name; c.Description = r.Description?.Trim(); c.IsActive = r.IsActive;
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Category.Update", $"#{c.Id} {c.Name}");
        return new CategoryDto(c.Id, c.Name, c.Description, c.IsActive, await db.Products.CountAsync(p => p.CategoryId == id && p.IsActive));
    }

    [HttpDelete("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await db.Categories.FindAsync(id);
        if (c == null) return NotFound();
        if (await db.Products.AnyAsync(p => p.CategoryId == id))
            throw new BusinessException("Danh mục vẫn còn sản phẩm. Hãy chuyển sản phẩm sang danh mục khác hoặc chuyển danh mục sang trạng thái ngừng hoạt động.");
        db.Categories.Remove(c);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Category.Delete", $"#{id} {c.Name}");
        return NoContent();
    }
}

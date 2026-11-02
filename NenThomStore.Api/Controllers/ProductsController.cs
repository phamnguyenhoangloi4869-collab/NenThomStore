namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/products")]
public class ProductsController(ProductService products) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<PagedResult<ProductDto>> List([FromQuery] ProductQuery q) =>
        await products.QueryAsync(q, q.IncludeInactive && User.IsStaff());

    [HttpGet("{id:int}"), AllowAnonymous]
    public async Task<ActionResult<ProductDto>> Get(int id)
    {
        var p = await products.GetAsync(id, User.IsStaff());
        return p == null ? NotFound() : p;
    }

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ProductDto>> Create(ProductSaveRequest r)
    {
        var p = await products.CreateAsync(r, User.UserId());
        return CreatedAtAction(nameof(Get), new { id = p.Id }, p);
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductSaveRequest r)
    {
        var p = await products.UpdateAsync(id, r, User.UserId());
        return p == null ? NotFound() : p;
    }

    [HttpDelete("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Deactivate(int id) => await products.DeactivateAsync(id, User.UserId()) ? NoContent() : NotFound();

    [HttpPost("{id:int}/images"), Authorize(Roles = Roles.Admin), RequestSizeLimit(6_000_000)]
    public async Task<ProductImageDto> AddImage(int id, IFormFile file) => await products.AddImageAsync(id, file, User.UserId());

    [HttpDelete("images/{imageId:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> DeleteImage(int imageId) => await products.DeleteImageAsync(imageId, User.UserId()) ? NoContent() : NotFound();
}

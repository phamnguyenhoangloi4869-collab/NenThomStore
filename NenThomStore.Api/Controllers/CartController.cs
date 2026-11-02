namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/cart"), Authorize]
public class CartController(CartService cart) : ControllerBase
{
    [HttpGet] public async Task<CartDto> Get() => await cart.GetAsync(User.UserId());

    [HttpPost("items")] public async Task<CartDto> Add(CartItemRequest r) => await cart.AddAsync(User.UserId(), r);

    [HttpPut("items/{productId:int}")]
    public async Task<CartDto> SetQuantity(int productId, CartQuantityRequest r) => await cart.SetQuantityAsync(User.UserId(), productId, r.Quantity);

    [HttpDelete("items/{productId:int}")]
    public async Task<CartDto> Remove(int productId) => await cart.RemoveAsync(User.UserId(), productId);
}

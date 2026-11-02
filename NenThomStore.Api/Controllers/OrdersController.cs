namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/orders"), Authorize]
public class OrdersController(OrderService orders) : ControllerBase
{
    [HttpPost]
    public async Task<OrderDto> Checkout(CheckoutRequest r) => await orders.CheckoutAsync(User.UserId(), r);

    [HttpGet]
    public async Task<List<OrderDto>> Mine() => await orders.MineAsync(User.UserId());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> Get(int id)
    {
        var o = await orders.GetAsync(id, User.UserId(), User.IsStaff());
        return o == null ? NotFound() : o;   // đơn của người khác -> 404, không lộ sự tồn tại
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<OrderDto> Cancel(int id) => await orders.CancelByCustomerAsync(id, User.UserId());
}

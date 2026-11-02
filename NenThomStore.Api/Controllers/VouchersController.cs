namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/vouchers")]
public class VouchersController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet("validate"), Authorize]
    public async Task<VoucherCheckDto> Validate([FromQuery] string code, [FromQuery] decimal subtotal)
    {
        var c = (code ?? "").Trim().ToUpperInvariant();
        var v = await db.Vouchers.AsNoTracking().FirstOrDefaultAsync(x => x.Code == c) ?? throw new BusinessException("Mã giảm giá không tồn tại.");
        var err = v.Validate(subtotal);
        if (err != null) throw new BusinessException(err);
        var d = v.Calculate(subtotal);
        return new VoucherCheckDto(v.Code, d, subtotal - d);   // chỉ để hiển thị; tổng tiền thật được tính lại khi đặt hàng
    }

    [HttpGet, Authorize(Roles = Roles.Staff)]
    public async Task<List<VoucherDto>> List() =>
        await db.Vouchers.AsNoTracking().OrderByDescending(v => v.Id)
            .Select(v => new VoucherDto(v.Id, v.Code, v.DiscountPercent, v.DiscountAmount, v.MinOrder, v.MaxUses, v.UsedCount, v.ExpiresAt, v.IsActive)).ToListAsync();

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<VoucherDto> Create(VoucherSaveRequest r)
    {
        var code = r.Code.Trim().ToUpperInvariant();
        if (await db.Vouchers.AnyAsync(v => v.Code == code)) throw new BusinessException("Mã giảm giá đã tồn tại.");
        var v = new Voucher { Code = code };
        Apply(v, r);
        db.Vouchers.Add(v);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Voucher.Create", code);
        return Map(v);
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<VoucherDto>> Update(int id, VoucherSaveRequest r)
    {
        var v = await db.Vouchers.FindAsync(id);
        if (v == null) return NotFound();
        var code = r.Code.Trim().ToUpperInvariant();
        if (await db.Vouchers.AnyAsync(x => x.Code == code && x.Id != id)) throw new BusinessException("Mã giảm giá đã tồn tại.");
        v.Code = code;
        Apply(v, r);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Voucher.Update", code);
        return Map(v);
    }

    [HttpDelete("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var v = await db.Vouchers.FindAsync(id);
        if (v == null) return NotFound();
        if (v.UsedCount > 0) throw new BusinessException("Mã đã được sử dụng, hãy chuyển sang ngừng hoạt động thay vì xóa.");
        db.Vouchers.Remove(v);
        await db.SaveChangesAsync();
        await audit.LogAsync(User.UserId(), "Voucher.Delete", v.Code);
        return NoContent();
    }

    private static void Apply(Voucher v, VoucherSaveRequest r)
    {
        v.DiscountPercent = r.DiscountPercent; v.DiscountAmount = r.DiscountAmount; v.MinOrder = r.MinOrder;
        v.MaxUses = r.MaxUses; v.ExpiresAt = r.ExpiresAt?.ToUniversalTime(); v.IsActive = r.IsActive;
    }

    private static VoucherDto Map(Voucher v) => new(v.Id, v.Code, v.DiscountPercent, v.DiscountAmount, v.MinOrder, v.MaxUses, v.UsedCount, v.ExpiresAt, v.IsActive);
}

using Microsoft.AspNetCore.Identity;

namespace NenThomStore.Api.Controllers;

[ApiController, Route("api/account")]
public class AccountController(UserManager<ApplicationUser> users, TokenService tokens) : ControllerBase
{
    [HttpPost("register"), AllowAnonymous]
    public async Task<AuthResponse> Register(RegisterRequest r)
    {
        // Luôn tạo vai trò Customer. Khách hàng không thể tự đăng ký Admin/Quản lý.
        var u = new ApplicationUser { UserName = r.Email.Trim(), Email = r.Email.Trim(), FullName = r.FullName.Trim(), PhoneNumber = r.Phone?.Trim() };
        var res = await users.CreateAsync(u, r.Password);
        if (!res.Succeeded)
            throw new BusinessException(string.Join(" ", res.Errors.Select(e =>
                e.Code is "DuplicateUserName" or "DuplicateEmail" ? "Email này đã được sử dụng." : e.Description)));
        await users.AddToRoleAsync(u, Roles.Customer);
        return await IssueAsync(u);
    }

    [HttpPost("login"), AllowAnonymous]
    public async Task<AuthResponse> Login(LoginRequest r)
    {
        var u = await users.FindByEmailAsync(r.Email.Trim());
        if (u != null && await users.IsLockedOutAsync(u)) throw new BusinessException("Tài khoản đang bị khóa. Vui lòng liên hệ cửa hàng.", 403);
        if (u == null || !await users.CheckPasswordAsync(u, r.Password))
        {
            if (u != null) await users.AccessFailedAsync(u);
            throw new BusinessException("Email hoặc mật khẩu không đúng.", 401);
        }
        await users.ResetAccessFailedCountAsync(u);
        return await IssueAsync(u);
    }

    [HttpGet("me"), Authorize]
    public async Task<ProfileDto> Me() => await ProfileAsync(await CurrentAsync());

    [HttpPut("me"), Authorize]
    public async Task<ProfileDto> Update(UpdateProfileRequest r)
    {
        var u = await CurrentAsync();
        u.FullName = r.FullName.Trim(); u.PhoneNumber = r.Phone?.Trim(); u.Address = r.Address?.Trim();
        var res = await users.UpdateAsync(u);
        if (!res.Succeeded) throw new BusinessException(string.Join(" ", res.Errors.Select(e => e.Description)));
        return await ProfileAsync(u);
    }

    [HttpPost("change-password"), Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest r)
    {
        var res = await users.ChangePasswordAsync(await CurrentAsync(), r.CurrentPassword, r.NewPassword);
        if (!res.Succeeded) throw new BusinessException("Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa đủ mạnh (tối thiểu 8 ký tự, có chữ hoa và số).");
        return NoContent();
    }

    private async Task<ApplicationUser> CurrentAsync() =>
        await users.FindByIdAsync(User.UserId()) ?? throw new BusinessException("Tài khoản không tồn tại.", 401);

    private async Task<ProfileDto> ProfileAsync(ApplicationUser u) =>
        new(u.Id, u.Email ?? "", u.FullName, u.PhoneNumber, u.Address, (await users.GetRolesAsync(u)).ToList());

    private async Task<AuthResponse> IssueAsync(ApplicationUser u)
    {
        var roles = await users.GetRolesAsync(u);
        return new AuthResponse(tokens.Create(u, roles), await ProfileAsync(u));
    }
}

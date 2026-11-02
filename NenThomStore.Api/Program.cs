using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

var jwtKey = cfg["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Thiếu cấu hình Jwt:Key (tối thiểu 32 ký tự). Xem README: dùng user-secrets, không ghi vào appsettings.json.");

builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentityCore<ApplicationUser>(o =>
{
    o.Password.RequiredLength = 8;
    o.Password.RequireDigit = true;
    o.Password.RequireUppercase = true;
    o.Password.RequireNonAlphanumeric = false;
    o.User.RequireUniqueEmail = true;
    o.Lockout.AllowedForNewUsers = true;
    o.Lockout.MaxFailedAccessAttempts = 5;
    o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
}).AddRoles<IdentityRole>().AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = cfg["Jwt:Issuer"],
        ValidateAudience = true, ValidAudience = cfg["Jwt:Audience"],
        ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
    o.Events = new JwtBearerEvents
    {
        // Tài khoản bị khóa/xóa thì token cũ cũng mất hiệu lực ngay
        OnTokenValidated = async ctx =>
        {
            var um = ctx.HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
            var id = ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = id == null ? null : await um.FindByIdAsync(id);
            if (user == null || await um.IsLockedOutAsync(user)) ctx.Fail("Tài khoản không còn hiệu lực.");
        }
    };
});
builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddPolicy("web", p => p
    .WithOrigins(cfg.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>())
    .AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<ImageService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<OrderService>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddControllers().AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "NenThomStore API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Description = "Dán JWT nhận được từ /api/account/login"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>()
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.Use(async (ctx, next) => { ctx.Response.Headers["X-Content-Type-Options"] = "nosniff"; await next(); });
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
else app.UseHttpsRedirection();
app.UseStaticFiles();            // phục vụ ảnh upload tại /uploads/products/...
app.UseCors("web");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();


using (var scope = app.Services.CreateScope())
{
    await DbSeeder.SeedAsync(scope.ServiceProvider, cfg, app.Environment.IsDevelopment());

    // Chỉ chạy khi chủ động bật biến môi trường đặt lại mật khẩu.
    if (app.Environment.IsDevelopment()
        && Environment.GetEnvironmentVariable("RESET_TEST_PASSWORDS") == "1")
    {
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var targets = new List<ApplicationUser>();

        // Lấy tài khoản Admin hiện có theo vai trò.
        targets.AddRange(await users.GetUsersInRoleAsync(Roles.Admin));

        // Lấy hai tài khoản test theo email.
        foreach (var email in new[] { "manager@aura.local", "customer@aura.local" })
        {
            var user = await users.FindByEmailAsync(email);
            if (user != null && !targets.Any(x => x.Id == user.Id))
                targets.Add(user);
        }

        foreach (var user in targets)
        {
            var removeResult = await users.RemovePasswordAsync(user);
            if (!removeResult.Succeeded)
            {
                Console.WriteLine($"Không thể xóa mật khẩu cũ của {user.Email}: " +
                    string.Join("; ", removeResult.Errors.Select(e => e.Description)));
                continue;
            }

            var addResult = await users.AddPasswordAsync(user, "Test@123456");
            if (!addResult.Succeeded)
            {
                Console.WriteLine($"Không thể đặt mật khẩu mới cho {user.Email}: " +
                    string.Join("; ", addResult.Errors.Select(e => e.Description)));
                continue;
            }

            await users.SetLockoutEndDateAsync(user, null);
            await users.ResetAccessFailedCountAsync(user);

            Console.WriteLine($"Đã đặt lại mật khẩu: {user.Email}");
        }
    }
}

app.Run();


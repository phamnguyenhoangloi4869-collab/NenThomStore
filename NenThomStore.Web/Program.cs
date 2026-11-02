// Frontend độc lập: chỉ phục vụ file tĩnh trong wwwroot. Mọi dữ liệu lấy từ Backend qua HTTP API (wwwroot/js/config.js).
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.Run();

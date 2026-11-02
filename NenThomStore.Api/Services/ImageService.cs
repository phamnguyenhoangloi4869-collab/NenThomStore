namespace NenThomStore.Api.Services;

public class ImageService(IWebHostEnvironment env)
{
    private const string UrlPrefix = "/uploads/products/";
    private static readonly Dictionary<string, byte[]> Signatures = new()
    {
        [".jpg"] = new byte[] { 0xFF, 0xD8, 0xFF }, [".jpeg"] = new byte[] { 0xFF, 0xD8, 0xFF },
        [".png"] = new byte[] { 0x89, 0x50, 0x4E, 0x47 }, [".webp"] = new byte[] { 0x52, 0x49, 0x46, 0x46 }
    };

    private string Dir => Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "products");

    public async Task<string> SaveProductImageAsync(IFormFile file)
    {
        if (file.Length == 0 || file.Length > 5 * 1024 * 1024) throw new BusinessException("Ảnh phải có dung lượng tối đa 5MB.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Signatures.TryGetValue(ext, out var sig)) throw new BusinessException("Chỉ chấp nhận ảnh .jpg, .jpeg, .png, .webp.");

        await using var stream = file.OpenReadStream();
        var head = new byte[sig.Length];
        var read = await stream.ReadAsync(head);
        if (read < sig.Length || !head.SequenceEqual(sig)) throw new BusinessException("Nội dung tệp không phải ảnh hợp lệ.");

        Directory.CreateDirectory(Dir);
        var name = $"{Guid.NewGuid():N}{ext}";          // tên ngẫu nhiên, không dùng tên người dùng gửi lên
        stream.Position = 0;
        await using var fs = File.Create(Path.Combine(Dir, name));
        await stream.CopyToAsync(fs);
        return UrlPrefix + name;
    }

    public void Delete(string url)
    {
        if (!url.StartsWith(UrlPrefix)) return;
        var path = Path.Combine(Dir, Path.GetFileName(url));
        if (File.Exists(path)) File.Delete(path);
    }
}

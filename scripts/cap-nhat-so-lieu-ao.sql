-- Cập nhật số liệu ẢO (demo) cho phần thống kê hiển thị trên website.
-- Cách dùng: mở file này trong SSMS (kết nối localhost), bấm Execute (F5).
-- Điều kiện: đã chạy NenThomStore.Api ít nhất 1 lần sau khi cập nhật code (để tạo bảng SiteStats).
USE NenThomDB;
GO

IF OBJECT_ID(N'dbo.SiteStats', N'U') IS NULL
BEGIN
    RAISERROR(N'Chưa có bảng SiteStats. Hãy chạy NenThomStore.Api một lần (nó tự tạo bảng) rồi chạy lại file này.', 16, 1);
    RETURN;
END

DECLARE @LuotTruyCap int = 1968;   -- khoảng 2000
DECLARE @LuotMuaNen   int = 1236;  -- số lượt mua nền (tổng hiển thị = số này + đơn thật, luôn < 2000)

IF EXISTS (SELECT 1 FROM dbo.SiteStats)
    UPDATE dbo.SiteStats SET VisitCount = @LuotTruyCap, PurchaseBase = @LuotMuaNen
    WHERE Id = (SELECT MIN(Id) FROM dbo.SiteStats);
ELSE
    INSERT INTO dbo.SiteStats (VisitCount, PurchaseBase) VALUES (@LuotTruyCap, @LuotMuaNen);

-- Kiểm tra kết quả
SELECT s.VisitCount AS LuotTruyCap,
       s.PurchaseBase + (SELECT COUNT(*) FROM dbo.Orders WHERE Status <> N'Cancelled') AS LuotMuaHang
FROM dbo.SiteStats s;
GO

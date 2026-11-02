# =====================================================================================
# Xuất DỮ LIỆU THẬT từ localhost -> data/store.json  (+ tối ưu ảnh sản phẩm -> images/products)
# để bản GitHub Pages hiển thị Y HỆT bản chạy localhost.
#
# Cách dùng (PowerShell, đứng ở thư mục gốc dự án), TRONG KHI NenThomStore.Api ĐANG CHẠY:
#     .\scripts\export-for-github.ps1
# Tuỳ chọn:
#     -Api http://localhost:5080                       (địa chỉ Backend, mặc định như trên)
#     -IncludeVouchers -AdminEmail a@b.com -AdminPassword xxx
#         (xuất cả mã giảm giá đang bật. CHÚ Ý: file data/store.json là công khai trên GitHub,
#          ai cũng đọc được mã giảm giá trong đó.)
# Xong thì: git add . ; git commit -m "Cap nhat du lieu" ; git push
# =====================================================================================
param(
  [string]$Api = 'http://localhost:5080',
  [switch]$IncludeVouchers,
  [string]$AdminEmail = '',
  [string]$AdminPassword = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$Api = $Api.TrimEnd('/')

function Get-Json([string]$url, [hashtable]$headers = @{}) {
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers $headers
  $text = [System.Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())   # ép UTF-8 để không lỗi tiếng Việt
  return ($text | ConvertFrom-Json)
}

Write-Host "Đang đọc dữ liệu từ $Api ..." -ForegroundColor Cyan
try { $null = Get-Json "$Api/api/categories" } catch { throw "Không kết nối được $Api. Hãy chạy NenThomStore.Api trước rồi chạy lại script này." }

# --- Sản phẩm (mới nhất trước, đúng thứ tự trang chủ localhost) ---
$products = @(); $page = 1
do {
  $res = Get-Json "$Api/api/products?page=$page&pageSize=60&sort=newest"
  $products += @($res.items); $page++
} while ($res.items.Count -gt 0 -and $products.Count -lt $res.total)
Write-Host "  - $($products.Count) sản phẩm"

# --- Danh mục, thống kê ---
$cats  = @(Get-Json "$Api/api/categories")
$stats = Get-Json "$Api/api/stats"

# --- Đánh giá công khai của từng sản phẩm ---
$reviews = @()
foreach ($p in $products) { $reviews += @(Get-Json "$Api/api/reviews?productId=$($p.id)") }
Write-Host "  - $($reviews.Count) đánh giá"

$store = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  stats       = [ordered]@{ visits = [int]$stats.visits; purchases = [int]$stats.purchases }
  categories  = @($cats)
  products    = @($products)
  reviews     = @($reviews)
}

# --- Mã giảm giá (tuỳ chọn) ---
if ($IncludeVouchers) {
  if (-not $AdminEmail -or -not $AdminPassword) { throw 'Cần -AdminEmail và -AdminPassword để xuất mã giảm giá.' }
  $body = @{ email = $AdminEmail; password = $AdminPassword } | ConvertTo-Json
  $lr = Invoke-WebRequest -Uri "$Api/api/account/login" -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
  $token = ([System.Text.Encoding]::UTF8.GetString($lr.RawContentStream.ToArray()) | ConvertFrom-Json).token
  $vs = @(Get-Json "$Api/api/vouchers" @{ Authorization = "Bearer $token" }) | Where-Object { $_.isActive }
  $store['vouchers'] = @($vs)
  Write-Host "  - $(@($vs).Count) mã giảm giá đang bật (sẽ công khai trong data/store.json)"
}

# --- Ghi file (UTF-8 không BOM) ---
$dataDir = Join-Path $root 'data'
New-Item -ItemType Directory -Force $dataDir | Out-Null
$json = ConvertTo-Json -InputObject $store -Depth 8
[System.IO.File]::WriteAllText((Join-Path $dataDir 'store.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Đã ghi data\store.json" -ForegroundColor Green

# --- Ảnh: chỉ lấy ảnh đang được sản phẩm sử dụng, thu nhỏ tối đa 1200px, JPEG chất lượng 82 ---
Add-Type -AssemblyName System.Drawing
$src = Join-Path $root 'NenThomStore.Api\wwwroot\uploads\products'
$dst = Join-Path $root 'images\products'
New-Item -ItemType Directory -Force $dst | Out-Null
$used = @{}
foreach ($p in $products) {
  foreach ($u in (@($p.imageUrl) + @($p.images | ForEach-Object { $_.url }))) {
    if ($u -match '/uploads/products/([^/?#]+)$') { $used[[System.IO.Path]]::GetFileNameWithoutExtension($Matches[1])] = $Matches[1] }
  }
}
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)
$done = 0; $missing = @()
foreach ($name in $used.Keys) {
  $out = Join-Path $dst ($name + '.jpg')
  if (Test-Path $out) { continue }
  $in = Join-Path $src $used[$name]
  if (-not (Test-Path $in)) { $missing += $used[$name]; continue }
  $img = [System.Drawing.Image]::FromFile($in)
  try {
    if ($img.PropertyIdList -contains 274) {            # xoay đúng chiều ảnh chụp từ điện thoại (EXIF)
      switch ($img.GetPropertyItem(274).Value[0]) {
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
    $scale = [Math]::Min(1.0, 1200.0 / [Math]::Max($img.Width, $img.Height))
    $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h); $g.Dispose()
    $bmp.Save($out, $jpeg, $ep); $bmp.Dispose(); $done++
  } finally { $img.Dispose() }
}
Write-Host "Ảnh: đã tối ưu thêm $done ảnh mới vào images\products" -ForegroundColor Green
if ($missing.Count) { Write-Warning ("Không thấy file ảnh trong uploads: " + ($missing -join ', ')) }
Write-Host "`nXong. Chạy tiếp:  git add .  ;  git commit -m 'Cap nhat du lieu'  ;  git push" -ForegroundColor Yellow

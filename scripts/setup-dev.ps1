# Chạy 1 lần trong thư mục gốc solution (PowerShell):  .\scripts\setup-dev.ps1 -AdminEmail "ban@example.com"
# Tạo khóa JWT ngẫu nhiên và mật khẩu ngẫu nhiên, lưu vào user-secrets (KHÔNG nằm trong source/Git).
param([Parameter(Mandatory=$true)][string]$AdminEmail)
function New-Secret($n) { -join ((48..57)+(65..90)+(97..122) | Get-Random -Count $n | ForEach-Object {[char]$_}) }
$proj = "NenThomStore.Api"
$adminPw = "A1" + (New-Secret 14)
$devPw   = "A1" + (New-Secret 14)
dotnet user-secrets init --project $proj | Out-Null
dotnet user-secrets set "Jwt:Key" (New-Secret 48) --project $proj | Out-Null
dotnet user-secrets set "Seed:AdminEmail" $AdminEmail --project $proj | Out-Null
dotnet user-secrets set "Seed:AdminPassword" $adminPw --project $proj | Out-Null
dotnet user-secrets set "Seed:DevPassword" $devPw --project $proj | Out-Null
Write-Host "Admin:    $AdminEmail / $adminPw"
Write-Host "Manager:  manager@aura.local / $devPw   (chỉ môi trường phát triển)"
Write-Host "Customer: customer@aura.local / $devPw  (chỉ môi trường phát triển)"
Write-Host "Hãy lưu lại các mật khẩu trên, chúng không được ghi vào mã nguồn."

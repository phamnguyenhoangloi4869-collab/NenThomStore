@echo off
cd /d "%~dp0"
echo === 1/2: Xuat du lieu tu localhost (NenThomStore.Api phai DANG CHAY) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\export-for-github.ps1"
if errorlevel 1 ( echo LOI: chua ket noi duoc API. Hay chay NenThomStore.Api roi chay lai file nay. & pause & exit /b 1 )
echo.
echo === 2/2: Day len GitHub ===
git add .
git commit -m "Cap nhat giong localhost"
git push
echo.
echo Xong. Doi khoang 1 phut, mo trang GitHub Pages roi nhan Ctrl+F5.
pause

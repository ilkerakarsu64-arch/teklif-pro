@echo off
chcp 65001 > nul
title TeklifPRO - Masaüstü Kurulum Sihirbazı
cls
echo =========================================================
echo       TEKLİFPRO KURUMSAL PAKET KURULUM SİHİRBAZI
echo =========================================================
echo.
echo [1/3] Gerekli sistem kütüphaneleri ve bağımlılıklar yükleniyor...
call npm.cmd install
if %errorlevel% neq 0 (
    echo [HATA] Kütüphane kurulumu sırasında bir sorun oluştu!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Üretim derlemesi (Build) oluşturuluyor...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [HATA] Derleme (Build) sırasında bir sorun oluştu!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Masaüstüne TeklifPRO kısayolu oluşturuluyor...
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\TeklifPRO.lnk'); $s.TargetPath='%~dp0baslat.bat'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=1; $s.Description='TeklifPRO Kurumsal Teklif Otomasyonu'; $s.Save()"

echo.
echo =========================================================
echo   TEKLİFPRO BAŞARIYLA KURULDU VE MASAÜSTÜNE EKLENDİ!
echo =========================================================
echo.
echo Masaüstünüzdeki "TeklifPRO" simgesine çift tıklayarak
echo programı dilediğiniz an çalıştırabilirsiniz.
echo.
pause

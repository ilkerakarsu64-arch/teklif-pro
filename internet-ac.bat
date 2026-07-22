@echo off
chcp 65001 > nul
title TeklifPro - İnternet Erişim Tüneli
echo ===================================================
echo   TEKLİFPRO İNTERNET ERİŞİM TÜNELİ
echo ===================================================
echo.
echo Sunucunuz internet üzerinden erişime açılıyor...
echo.
npx localtunnel --port 3000
pause

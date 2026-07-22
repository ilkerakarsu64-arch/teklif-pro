@echo off
chcp 65001 > nul
title TeklifPRO - Sistem Servisi Başlatılıyor
cls
echo =========================================================
echo           TEKLİFPRO BAŞLATILIYOR...
echo =========================================================
echo.
echo Sunucu ve Müşteri Portalı Hazırlanıyor...
echo Lütfen bu pencereyi açık tutun.
echo.
start http://localhost:3000
node dist/server.cjs

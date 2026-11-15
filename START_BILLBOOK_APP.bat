@echo off
title BillBook SaaS - GST Billing & Cloud Platform
cd /d "%~dp0"

echo ===================================================================
echo   Starting BillBook SaaS Invoicing & Billing Platform
echo   Firebase: https://adonaibroadcast-11095.firebaseio.com/billbook
echo   UPI Gateway: joy.john@ybl (Joy John)
echo ===================================================================

if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" server.py
) else (
    python server.py
)

pause

@echo off
title BillBook SaaS Invoicing Platform
cd /d "%~dp0"

echo ======================================================================
echo    STARTING BILLBOOK SAAS GST BILLING PLATFORM (PORT 8090)
echo ======================================================================
echo  Firebase: https://adonaibroadcast-11095.firebaseio.com/billbook
echo  UPI Gateway: joy.john@ybl (Joy John)
echo ======================================================================

start "" "http://localhost:8090/index.html"
py server.py
pause

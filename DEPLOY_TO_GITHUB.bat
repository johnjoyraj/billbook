@echo off
title BillBook SaaS - Deploy to GitHub
cd /d "%~dp0"

echo ===================================================================
echo   Deploying BillBook SaaS to GitHub
echo   Target: https://github.com/johnjoyraj/billbook.git
echo ===================================================================

git add .
git commit -m "feat: complete BillBook SaaS GST billing & subscription platform with Firebase sync" 2>nul

echo.
echo Pushing to GitHub (branch: main)...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ===================================================================
    echo [!] NOTE: If you haven't created the repository on GitHub yet:
    echo     1. Opening https://github.com/new in your browser...
    echo     2. Set repository name to: billbook
    echo     3. Click "Create repository"
    echo     4. Come back to this window and press any key to push again!
    echo ===================================================================
    start "" "https://github.com/new?name=billbook"
    pause
    echo Retrying push...
    git push -u origin main
)

echo.
echo Deployment script completed.
pause

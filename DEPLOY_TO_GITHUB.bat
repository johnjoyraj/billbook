@echo off
title BillBook SaaS - Deploy to GitHub
cd /d "%~dp0"

echo ===================================================================
echo   Deploying BillBook SaaS to GitHub
echo   Repository: https://github.com/johnjoyraj/billbook.git
echo ===================================================================

git init
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/johnjoyraj/billbook.git
git add .
git commit -m "feat: complete BillBook SaaS GST billing & subscription platform with Firebase sync"
echo.
echo Ready to push to GitHub!
echo Running: git push -u origin main
git push -u origin main

echo.
echo Deployment process complete.
pause

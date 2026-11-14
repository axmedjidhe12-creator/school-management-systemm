@echo off
title School Management System - All Services
echo Starting Backend API and React Frontend...
start "SMS Backend API" cmd /c "%~dp0\start-backend.bat"
timeout /t 3 /nobreak >nul
start "SMS React Client" cmd /c "%~dp0\start-frontend.bat"
echo.
echo ====================================================
echo Multi-Tenant School Management System Launched!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ====================================================

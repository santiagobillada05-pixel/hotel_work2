@echo off
title HotelWork - Servidores Local
echo ========================================================
echo   Iniciando HotelWork (Frontend + Backend Supabase)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Iniciando Backend FastAPI (Puerto 8000)...
start "HotelWork Backend" cmd /k "python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Iniciando Frontend Vite (Puerto 5173)...
start "HotelWork Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Servidores en ejecucion:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - Base de datos: Supabase (PostgreSQL en la nube)
echo ========================================================
echo.

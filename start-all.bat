@echo off
echo ===================================================
echo Starting VEDANCO AI Services...
echo ===================================================

echo [1/3] Starting MongoDB...
if not exist "C:\Users\ABC\mongodb_data" mkdir "C:\Users\ABC\mongodb_data"
start "MongoDB Server" /min "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\Users\ABC\mongodb_data" --wiredTigerCacheSizeGB 0.25 --bind_ip 127.0.0.1
timeout /t 3 /nobreak >nul

echo [2/3] Starting Backend API (Port 5000)...
start "VEDANCO Backend" cmd /k "cd /d "%~dp0server" && node src/server.js"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend (Port 5173)...
start "VEDANCO Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo All services launched!
echo Open: http://localhost:5173/login
echo.
pause

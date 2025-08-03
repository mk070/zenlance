@echo off
echo Starting FreelanceHub Development Servers...
echo.

echo Installing dependencies if needed...
call npm install --silent

echo.
echo Starting Backend and Frontend servers...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd forntend && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Press any key to close this window.
pause >nul 
@echo off
echo ========================================
echo  Starting Kshitij Capstone Backend
echo ========================================
echo.

REM Kill any existing Python processes on port 8000
echo [1/3] Stopping any existing backend servers...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM Navigate to backend directory
cd /d "%~dp0backend_rag"

REM Start the server (packages are already installed globally)
echo.
echo [2/3] Starting FastAPI backend...
echo.
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo [3/3] Press Ctrl+C to stop the server
echo ========================================
echo.

python main.py

pause

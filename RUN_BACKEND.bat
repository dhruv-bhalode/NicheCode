@echo off
echo ========================================
echo  🚀 STARTING KSHITIJ CAPSTONE BACKEND
echo ========================================
echo.

REM Kill any existing Python processes on port 8000
echo [1/2] Stopping old servers...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Start the server
echo [2/2] Starting Python RAG Backend...
echo.
echo 📍 URL: http://localhost:8000
echo 📄 Docs: http://localhost:8000/docs
echo.
cd /d "%~dp0backend_rag"
python main.py

pause

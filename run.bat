@echo off
TITLE Portofoliu Personal - Run
CLS

echo Checking Docker status...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    echo ========================================================
    echo.
    pause
    goto end
)

echo ========================================================
echo     Portofoliu Personal - Development Server
echo ========================================================
echo.
echo Please choose how you want to run the project:
echo.
echo [1] Full Docker Environment (Starts everything in Docker - No live reload)
echo [2] Local Development Environment (Docker for DB/n8n, npm for app - Live reload)
echo [3] Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto full_docker
if "%choice%"=="2" goto local_dev
if "%choice%"=="3" goto end

echo Invalid choice.
pause
goto end

:full_docker
echo.
echo Starting full Docker environment in the background...
docker-compose up -d --build
echo.
echo Environment is starting up! You can now close this window safely.
echo Frontend: http://localhost:80
echo Backend API: http://localhost:3000
echo Admin Panel: http://localhost:80/admin
pause
goto end

:local_dev
echo.
echo Starting Database and n8n in Docker...
docker-compose up -d postgres

echo.
echo Installing dependencies (if any are missing)...
call npm install

echo.
echo Starting Frontend and Backend locally...
call npm run dev
pause
goto end

:end

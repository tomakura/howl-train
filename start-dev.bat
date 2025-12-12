@echo off
setlocal enableextensions

REM Always run from the repo root (this .bat's directory)
cd /d "%~dp0"

echo [howl-train] Starting dev server...

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Please install Node.js (includes npm) and try again.
  echo https://nodejs.org/
  pause
  exit /b 1
)

REM Install deps on first run
if not exist "node_modules\" (
  echo [howl-train] node_modules not found; running npm install...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo [howl-train] Running: npm run dev
echo.
call npm run dev

endlocal

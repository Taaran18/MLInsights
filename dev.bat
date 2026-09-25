@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
if not defined BACKEND_PORT set "BACKEND_PORT=8000"
if not defined FRONTEND_PORT set "FRONTEND_PORT=3000"

where node >nul 2>nul
if errorlevel 1 (
  echo [x] Node.js 20.9 or newer is required. Install it from https://nodejs.org
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [x] npm is required. It ships with Node.js.
  exit /b 1
)

set "PYTHON="
where py >nul 2>nul
if not errorlevel 1 (
  py -3.12 -c "import sys" >nul 2>nul
  if not errorlevel 1 set "PYTHON=py -3.12"
)
if not defined PYTHON (
  where python >nul 2>nul
  if not errorlevel 1 (
    python -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)" >nul 2>nul
    if not errorlevel 1 set "PYTHON=python"
  )
)
if not defined PYTHON (
  echo [x] Python 3.12 is required ^(3.12.10 recommended^). Install it from https://www.python.org/downloads/
  exit /b 1
)

if exist "%BACKEND%\.venv\Scripts\python.exe" (
  "%BACKEND%\.venv\Scripts\python.exe" -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)" >nul 2>nul
  if errorlevel 1 (
    echo [-] Rebuilding the backend virtual environment with Python 3.12
    rmdir /s /q "%BACKEND%\.venv"
  )
)

if not exist "%BACKEND%\.venv\Scripts\python.exe" (
  echo [-] Creating the backend virtual environment
  %PYTHON% -m venv "%BACKEND%\.venv"
  if errorlevel 1 exit /b 1
)

if not exist "%BACKEND%\.venv\.requirements-installed" (
  echo [-] Installing backend dependencies. The first run can take a few minutes.
  "%BACKEND%\.venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
  "%BACKEND%\.venv\Scripts\python.exe" -m pip install -r "%BACKEND%\requirements.txt" --quiet
  if errorlevel 1 exit /b 1
  type nul > "%BACKEND%\.venv\.requirements-installed"
)

if not exist "%FRONTEND%\node_modules" (
  echo [-] Installing frontend dependencies
  pushd "%FRONTEND%"
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    popd
    exit /b 1
  )
  popd
)

if not exist "%BACKEND%\.env" (
  echo [-] Creating backend\.env with local defaults
  > "%BACKEND%\.env" (
    echo ALLOWED_ORIGINS=http://localhost:3000
    echo ALLOWED_ORIGIN_REGEX=
    echo UPLOAD_DIR=
    echo MAX_UPLOAD_MB=50
    echo SESSION_TTL_HOURS=24
    echo MAX_CACHED_SESSIONS=8
    echo LOG_LEVEL=INFO
  )
)

if not exist "%FRONTEND%\.env" (
  echo [-] Creating frontend\.env with local defaults
  > "%FRONTEND%\.env" (
    echo NEXT_PUBLIC_API_URL=http://localhost:8000
    echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
    echo NEXT_PUBLIC_CONTACT_EMAIL=
  )
)

:find_backend_port
netstat -an | findstr /r /c:":%BACKEND_PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a BACKEND_PORT+=1
  goto find_backend_port
)

:find_frontend_port
netstat -an | findstr /r /c:":%FRONTEND_PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a FRONTEND_PORT+=1
  goto find_frontend_port
)

set "API_URL=http://localhost:%BACKEND_PORT%"
set "WEB_URL=http://localhost:%FRONTEND_PORT%"

echo [-] Opening the API in a new window
start "MLInsights API" /D "%BACKEND%" cmd /k "set ALLOWED_ORIGINS=%WEB_URL%,http://127.0.0.1:%FRONTEND_PORT%&& .venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port %BACKEND_PORT% --no-access-log"

echo [-] Opening the website in a new window
start "MLInsights Web" /D "%FRONTEND%" cmd /k "set NEXT_PUBLIC_API_URL=%API_URL%&& set NEXT_PUBLIC_SITE_URL=%WEB_URL%&& npm run dev -- --port %FRONTEND_PORT%"

echo.
echo MLInsights is starting
echo   Website   %WEB_URL%
echo   App       %WEB_URL%/app
echo   API       %API_URL%  (docs at %API_URL%/docs)
echo.
echo Close either window, or press Ctrl+C in it, to stop that server.
endlocal

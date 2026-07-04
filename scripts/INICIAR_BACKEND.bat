@echo off
setlocal

title DAWGS Backend
cd /d "%~dp0"

echo.
echo ========================================
echo          DAWGS BACKEND
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado o no esta disponible en PATH.
  echo Descargalo desde https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm no esta instalado o no esta disponible en PATH.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERROR] No se encontro package.json en:
  cd
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Instalando dependencias por primera vez...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)

if not exist ".env" if not exist ".env.local" (
  echo [AVISO] No existe .env ni .env.local.
  echo Algunas funciones pueden requerir variables de entorno.
  echo.
)

echo [INFO] Iniciando backend en modo desarrollo...
echo [INFO] URL por defecto: http://localhost:4000
echo [INFO] Salud: http://localhost:4000/health
echo [INFO] Presiona Ctrl+C para detenerlo.
echo.

call npm run dev:backend

echo.
echo [INFO] El backend se detuvo.
pause

endlocal

@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "BINARY=%SCRIPT_DIR%gsd-ui-web.exe"

if not exist "%BINARY%" (
  echo Binary not found. Downloading for your platform...
  node "%SCRIPT_DIR%..\lib\download.js"
  if errorlevel 1 exit /b 1
  echo.
  echo Download complete! Run 'npx get-shit-done-cc-ui' again to start.
  exit /b 0
)

"%BINARY%" %*

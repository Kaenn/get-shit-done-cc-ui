@echo off
setlocal

:: Find the package directory (resolve symlinks)
set "SCRIPT_DIR=%~dp0"
set "PACKAGE_DIR=%SCRIPT_DIR%.."

:: If we're in node_modules/.bin, find the actual package
if exist "%PACKAGE_DIR%\get-shit-done-cc-ui\package.json" (
  set "PACKAGE_DIR=%PACKAGE_DIR%\get-shit-done-cc-ui"
)

set "BINARY=%PACKAGE_DIR%\bin\gsd-ui-web.exe"
set "DOWNLOAD_SCRIPT=%PACKAGE_DIR%\lib\download.js"

if not exist "%BINARY%" (
  echo Binary not found. Downloading for your platform...
  node "%DOWNLOAD_SCRIPT%"
  if errorlevel 1 exit /b 1
  echo.
  echo Download complete! Run 'npx get-shit-done-cc-ui' again to start.
  exit /b 0
)

"%BINARY%" %*

@echo off
setlocal

:: Use persistent cache directory
set "CACHE_DIR=%USERPROFILE%\.cache\get-shit-done-cc-ui"
set "BINARY=%CACHE_DIR%\gsd-ui-web.exe"

:: Find package directory for download script
set "SCRIPT_DIR=%~dp0"
set "PACKAGE_DIR=%SCRIPT_DIR%.."

:: If in node_modules/.bin, find actual package
if exist "%PACKAGE_DIR%\get-shit-done-cc-ui\package.json" (
  set "PACKAGE_DIR=%PACKAGE_DIR%\get-shit-done-cc-ui"
)

set "DOWNLOAD_SCRIPT=%PACKAGE_DIR%\lib\download.js"

:: Create cache directory
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"

:: Check if binary exists in cache
if not exist "%BINARY%" (
  echo Binary not found. Downloading for your platform...
  set "GSD_CACHE_DIR=%CACHE_DIR%"
  node "%DOWNLOAD_SCRIPT%"
  if errorlevel 1 exit /b 1
)

:: Run the binary
"%BINARY%" %*

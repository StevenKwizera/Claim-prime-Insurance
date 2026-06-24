@echo off
setlocal
REM Use backend/local.env (loaded by start-backend.ps1 / npm run backend)
cd /d "%~dp0"
mvn spring-boot:run > backend-live.out.log 2> backend-live.err.log

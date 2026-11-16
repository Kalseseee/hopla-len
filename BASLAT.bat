@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kur.
 echo Kurulum istemiyorsan canli oyunu ac: https://skyhop-party.topbookmark2.chatgpt.site
 pause
 exit /b 1
)
node serve.mjs
pause

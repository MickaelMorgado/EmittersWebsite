echo off
echo Running RTMP server and Ngrok

start "" npx run app.js
start "" npx ngrok http 8000
start "" "README.md"

echo Calling GenerateWebsiteTunnel.bat...
call GenerateWebsiteTunnel.bat

echo GenerateWebsiteTunnel.bat execution completed.
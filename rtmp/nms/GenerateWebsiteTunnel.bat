@echo off

echo Please paste the URL from ngrok (https version):
set /p url=

REM Open the browser to the URL
start "" "https://emittersgame.com/rtmp/nms/?tunnel=%url%"
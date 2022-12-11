echo off
echo Running RTMP server and Ngrok

start "" npx run app.js
start "" npx ngrok http 8000

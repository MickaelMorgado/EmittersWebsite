@echo off
REM Exit on error
setlocal enabledelayedexpansion

echo 🚀 Starting build process...

REM Clean up previous build
if exist dist (
  echo 🧹 Cleaning up previous build...
  rmdir /s /q dist
)
mkdir dist

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
  echo 📦 Installing dependencies...
  npm ci --production=false
)

REM Build the Next.js application
echo 🔨 Building the application...
npm run build

REM Zip the build output
echo 📦 Zipping the build output...
powershell -Command "Compress-Archive -Path .next,public,package.json,package-lock.json -DestinationPath dist\my-app.zip -Force"

echo ✅ Build completed successfully!
echo 📁 The static files are ready in the 'dist' directory
echo 🌍 To serve the static site, you can use any static file server like 'serve' or 'http-server'
echo    For example: npx serve@latest dist

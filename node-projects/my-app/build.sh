#!/bin/bash

# Exit on error
set -e

# Print each command
set -x

echo "🚀 Starting build process..."

# Clean up previous build
if [ -d "dist" ]; then
  echo "🧹 Cleaning up previous build..."
  rm -rf dist/*
else
  mkdir -p dist
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci --production=false
fi

# Build the Next.js application
echo "🔨 Building the application..."
npm run build

# Zip the build output
echo "📦 Zipping the build output..."
zip -r dist/my-app.zip .next public package.json package-lock.json

echo "✅ Build completed successfully!"
echo "📁 The static files are ready in the 'dist' directory"
echo "🌍 To serve the static site, you can use any static file server like 'serve' or 'http-server'"
echo "   For example: npx serve@latest dist"

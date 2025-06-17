#!/bin/bash

# Exit on error
set -e

# Print each command
set -x

echo "🚀 Starting build process..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci --production=false
fi

# Build the Next.js application
echo "🔨 Building the application..."
npm run build

# Export the static site
echo "📦 Exporting static site..."
npm run export

echo "✅ Build completed successfully!"
echo "📁 The static files are ready in the 'out' directory"
echo "🌍 To serve the static site, you can use any static file server like 'serve' or 'http-server'"
echo "   For example: npx serve@latest out"

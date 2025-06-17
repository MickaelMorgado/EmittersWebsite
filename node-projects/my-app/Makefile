.PHONY: build serve clean

# Build the application
build:
	@echo "🚀 Building the application..."
	npm ci --production=false
	npm run build
	npm run export
	@echo "✅ Build completed! Static files are in the 'out' directory"

# Serve the built application locally
serve:
	@echo "🌍 Serving the application..."
	npx serve@latest out

# Clean build artifacts
clean:
	@echo "🧹 Cleaning up..."
	rm -rf .next
	rm -rf out
	rm -rf node_modules

# Install serve globally (one-time setup)
setup-serve:
	npm install -g serve@latest

# Help target
help:
	@echo "Available targets:"
	@echo "  build    - Build the application for production"
	@echo "  serve    - Serve the built application"
	@echo "  clean    - Remove build artifacts and dependencies"
	@echo "  setup-serve - Install serve globally (one-time setup)"

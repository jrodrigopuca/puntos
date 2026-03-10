#!/bin/bash
# Build script for itch.io deployment
# This creates a separate build with base path "/" instead of "/puntos/"

echo "🎮 Building PUNTOS for itch.io..."

# Build with root base path
npm run build:itch

# Fix manifest.json paths for itch.io (remove /puntos/ prefix)
echo "📝 Fixing manifest paths for itch.io..."

cd dist-itch

# Update manifest.json to use relative paths
if [ -f "manifest.json" ]; then
  # Remove leading slashes and /puntos/ prefix from all paths
  sed -i.bak 's|"/puntos/|"/|g' manifest.json
  sed -i.bak 's|"/img/|"img/|g' manifest.json
  sed -i.bak 's|"start_url": "/"|"start_url": "./"|g' manifest.json
  sed -i.bak 's|"scope": "/"|"scope": "./"|g' manifest.json
  rm manifest.json.bak
  echo "✅ Manifest.json updated"
fi

cd ..

echo "📦 Creating ZIP for itch.io..."
cd dist-itch
zip -r ../puntos-itch.zip . -x "*.DS_Store"
cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Upload file: puntos-itch.zip"
echo "📁 Size: $(du -h puntos-itch.zip | cut -f1)"
echo ""
echo "📋 itch.io settings:"
echo "   - Check: 'This file will be played in the browser'"
echo "   - Viewport: 1920 x 1080 (or fullscreen)"
echo "   - Orientation: Landscape"
echo ""

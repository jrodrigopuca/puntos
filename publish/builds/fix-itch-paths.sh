#!/bin/bash
# Post-build script to fix paths for itch.io
# Converts absolute paths to relative paths
# This script is called from project root by npm run build:itch

echo "🔧 Fixing paths for itch.io..."

cd dist-itch

# Fix index.html - remove leading slashes
sed -i.bak 's|href="/|href="|g' index.html
sed -i.bak 's|src="/|src="|g' index.html

# Fix manifest.json - remove leading slashes  
sed -i.bak 's|"/img/|"img/|g' manifest.json
sed -i.bak 's|"start_url": "/|"start_url": "./|g' manifest.json
sed -i.bak 's|"scope": "/|"scope": "./"|g' manifest.json

# Remove backup files
rm -f *.bak

cd ..

echo "✅ Paths fixed! All URLs are now relative."

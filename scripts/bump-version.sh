#!/bin/bash

# Script to bump version across all files
# Usage: ./scripts/bump-version.sh 1.0.0

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

VERSION=$1

echo "Bumping version to $VERSION..."

# Update package.json
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json && rm package.json.bak

# Update npm/package.json
if [ -f "npm/package.json" ]; then
  sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" npm/package.json && rm npm/package.json.bak
else
  echo "Warning: npm/package.json not found, skipping"
fi

# Update Cargo.toml
sed -i.bak "s/^version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml && rm src-tauri/Cargo.toml.bak

# Update tauri.conf.json
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json && rm src-tauri/tauri.conf.json.bak

# Update Info.plist
sed -i.bak "s/<string>.*<\/string><!-- VERSION -->/<string>$VERSION<\/string><!-- VERSION -->/" src-tauri/Info.plist && rm src-tauri/Info.plist.bak

echo "✅ Version bumped to $VERSION in:"
echo "   - package.json"
echo "   - npm/package.json"
echo "   - src-tauri/Cargo.toml"
echo "   - src-tauri/tauri.conf.json"
echo "   - src-tauri/Info.plist"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Commit: git commit -am \"chore: bump version to v$VERSION\""
echo "3. Tag: git tag -a v$VERSION -m \"Release v$VERSION\""
echo "4. Push: git push && git push --tags"

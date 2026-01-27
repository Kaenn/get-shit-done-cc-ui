#!/usr/bin/env bash
# Local development build script. CI uses houseabsolute/actions-rust-cross directly.
#
# Builds the gsd-ui-web standalone binary for local validation.
# This binary runs the web server without Tauri desktop dependencies.
#
# Usage:
#   ./scripts/build-web-binary.sh [target]
#
# Targets:
#   (none)          - Build for current platform
#   linux-x64       - x86_64-unknown-linux-gnu
#   darwin-x64      - x86_64-apple-darwin
#   darwin-arm64    - aarch64-apple-darwin
#   win32-x64       - x86_64-pc-windows-msvc

set -euo pipefail

# Change to src-tauri directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT/src-tauri"

# Determine target
TARGET=""
if [ $# -gt 0 ]; then
  case "$1" in
    linux-x64)
      TARGET="x86_64-unknown-linux-gnu"
      ;;
    darwin-x64)
      TARGET="x86_64-apple-darwin"
      ;;
    darwin-arm64)
      TARGET="aarch64-apple-darwin"
      ;;
    win32-x64)
      TARGET="x86_64-pc-windows-msvc"
      ;;
    *)
      echo "Unknown target: $1"
      echo "Supported: linux-x64, darwin-x64, darwin-arm64, win32-x64"
      exit 1
      ;;
  esac
fi

# Build command
BUILD_CMD="cargo build --release --bin gsd-ui-web"
if [ -n "$TARGET" ]; then
  BUILD_CMD="$BUILD_CMD --target $TARGET"
  echo "Building gsd-ui-web for target: $TARGET"
else
  echo "Building gsd-ui-web for current platform"
fi

# Execute build
echo "Running: $BUILD_CMD"
$BUILD_CMD

# Determine binary path and name
BINARY_NAME="gsd-ui-web"
if [ -n "$TARGET" ]; then
  BINARY_PATH="target/$TARGET/release/$BINARY_NAME"
  # Windows uses .exe extension
  if [[ "$TARGET" == *"windows"* ]]; then
    BINARY_NAME="gsd-ui-web.exe"
    BINARY_PATH="target/$TARGET/release/$BINARY_NAME"
  fi
else
  BINARY_PATH="target/release/$BINARY_NAME"
  # Check if current platform is Windows
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    BINARY_NAME="gsd-ui-web.exe"
    BINARY_PATH="target/release/$BINARY_NAME"
  fi
fi

# Display results
if [ -f "$BINARY_PATH" ]; then
  echo ""
  echo "✓ Build successful!"
  echo "Binary: $PROJECT_ROOT/src-tauri/$BINARY_PATH"

  # Show size (use different commands based on OS)
  if command -v du &> /dev/null; then
    SIZE=$(du -h "$BINARY_PATH" | cut -f1)
    echo "Size: $SIZE"
  elif command -v stat &> /dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      SIZE=$(stat -f%z "$BINARY_PATH" | awk '{printf "%.1fMB", $1/1024/1024}')
    else
      SIZE=$(stat -c%s "$BINARY_PATH" | awk '{printf "%.1fMB", $1/1024/1024}')
    fi
    echo "Size: $SIZE"
  fi

  # Show how to run it
  echo ""
  echo "Run with: ./$BINARY_PATH --help"
else
  echo "Error: Binary not found at $BINARY_PATH"
  exit 1
fi


# npx Installation Feature - Missing Components Specification

## Overview

This document specifies the missing components required to enable `npx opcode` installation without requiring Rust toolchain on the user's machine.

## Goal

```bash
# User should be able to run:
npx opcode

# Or install globally:
npm install -g opcode
opcode
```

---

## Current State Analysis

### What Exists

| Component | Location | Status |
|-----------|----------|--------|
| Standalone web server binary | `src-tauri/src/web_main.rs` | ✅ Complete |
| REST API endpoints | `src-tauri/src/web_server.rs` | ✅ Complete |
| WebSocket streaming | `src-tauri/src/web_server.rs` | ✅ Complete |
| Build script reference | `package.json:build:executables` | ⚠️ Script missing |
| React frontend | `src/` | ✅ Complete |

### What's Missing

| Component | Priority | Complexity |
|-----------|----------|------------|
| Cross-platform build pipeline | P0 | Medium |
| Binary distribution strategy | P0 | Medium |
| npm package wrapper | P0 | Low |
| GitHub Releases automation | P1 | Low |
| Version synchronization | P2 | Low |

---

## Architecture Decision

### Option A: Download Binary at Install Time (Recommended)

```
npm package (~50KB)
    └── postinstall script
            └── downloads platform-specific binary from GitHub Releases (~15-30MB)
```

**Pros:**
- Small npm package size
- Fast npm install (download happens in parallel)
- Easy to update binaries without npm publish

**Cons:**
- Requires network during install
- Need to host binaries (GitHub Releases)

### Option B: Bundle All Binaries in npm Package

```
npm package (~150-200MB)
    └── binaries/
            ├── opcode-linux-x64
            ├── opcode-linux-arm64
            ├── opcode-darwin-x64
            ├── opcode-darwin-arm64
            └── opcode-win32-x64.exe
```

**Pros:**
- Works offline after npm cache
- Simpler implementation

**Cons:**
- Very large package size
- Slow npm install
- npm has 500MB package limit

### Recommendation

**Option A** - Download at install time. This is the pattern used by `esbuild`, `swc`, `turbo`, and other Rust/Go CLI tools distributed via npm.

---

## Required Components

### 1. GitHub Actions Workflow

**File:** `.github/workflows/release.yml`

```yaml
name: Release Binaries

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            artifact: opcode-linux-x64
          - os: ubuntu-latest
            target: aarch64-unknown-linux-gnu
            artifact: opcode-linux-arm64
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact: opcode-darwin-x64
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact: opcode-darwin-arm64
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact: opcode-win32-x64.exe

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: ${{ matrix.target }}

      - name: Build web binary
        run: |
          cd src-tauri
          cargo build --release --bin opcode-web --target ${{ matrix.target }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}
          path: src-tauri/target/${{ matrix.target }}/release/opcode-web*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            opcode-linux-x64/*
            opcode-linux-arm64/*
            opcode-darwin-x64/*
            opcode-darwin-arm64/*
            opcode-win32-x64.exe/*
```

### 2. npm Package Structure

**Directory:** `npm/` (new directory)

```
npm/
├── package.json
├── bin/
│   └── opcode          # Shell wrapper script
├── install.js          # postinstall script
└── README.md
```

#### npm/package.json

```json
{
  "name": "opcode",
  "version": "0.2.1",
  "description": "GUI app and Toolkit for Claude Code",
  "bin": {
    "opcode": "./bin/opcode"
  },
  "scripts": {
    "postinstall": "node install.js"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/getAsterisk/opcode.git"
  },
  "keywords": ["claude", "ai", "cli", "anthropic"],
  "license": "AGPL-3.0",
  "engines": {
    "node": ">=16"
  }
}
```

#### npm/install.js

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = require('./package.json').version;
const GITHUB_REPO = 'getAsterisk/opcode';

function getPlatformInfo() {
  const platform = process.platform;
  const arch = process.arch;

  const mapping = {
    'linux-x64': 'opcode-linux-x64',
    'linux-arm64': 'opcode-linux-arm64',
    'darwin-x64': 'opcode-darwin-x64',
    'darwin-arm64': 'opcode-darwin-arm64',
    'win32-x64': 'opcode-win32-x64.exe',
  };

  const key = `${platform}-${arch}`;
  const binary = mapping[key];

  if (!binary) {
    throw new Error(`Unsupported platform: ${key}`);
  }

  return { binary, isWindows: platform === 'win32' };
}

async function downloadBinary() {
  const { binary, isWindows } = getPlatformInfo();
  const url = `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${binary}`;
  const destPath = path.join(__dirname, 'bin', isWindows ? 'opcode.exe' : 'opcode-bin');

  console.log(`Downloading opcode binary from ${url}...`);

  // Use curl/wget for simplicity (available on most systems)
  try {
    if (process.platform === 'win32') {
      execSync(`curl -L -o "${destPath}" "${url}"`, { stdio: 'inherit' });
    } else {
      execSync(`curl -L -o "${destPath}" "${url}" && chmod +x "${destPath}"`, { stdio: 'inherit' });
    }
    console.log('opcode binary installed successfully!');
  } catch (error) {
    console.error('Failed to download opcode binary:', error.message);
    console.error('You may need to build from source: https://github.com/getAsterisk/opcode');
    process.exit(1);
  }
}

downloadBinary();
```

#### npm/bin/opcode (Unix wrapper)

```bash
#!/bin/sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/opcode-bin" "$@"
```

#### npm/bin/opcode.cmd (Windows wrapper)

```batch
@echo off
"%~dp0opcode.exe" %*
```

### 3. Version Synchronization Script

**File:** `scripts/sync-version.js`

```javascript
const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node sync-version.js <version>');
  process.exit(1);
}

const files = [
  { path: 'package.json', key: 'version' },
  { path: 'npm/package.json', key: 'version' },
  { path: 'src-tauri/Cargo.toml', pattern: /^version = ".*"$/m, replace: `version = "${version}"` },
  { path: 'src-tauri/tauri.conf.json', key: 'version' },
];

files.forEach(({ path: filePath, key, pattern, replace }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  if (key) {
    const json = JSON.parse(content);
    json[key] = version;
    content = JSON.stringify(json, null, 2) + '\n';
  } else if (pattern) {
    content = content.replace(pattern, replace);
  }

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${filePath} to version ${version}`);
});
```

### 4. Build Script

**File:** `scripts/fetch-and-build.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGETS = {
  linux: ['x86_64-unknown-linux-gnu', 'aarch64-unknown-linux-gnu'],
  macos: ['x86_64-apple-darwin', 'aarch64-apple-darwin'],
  windows: ['x86_64-pc-windows-msvc'],
  current: [null], // Use default target
};

const platform = process.argv[2] || 'current';
const targets = TARGETS[platform];

if (!targets) {
  console.error(`Unknown platform: ${platform}`);
  console.error(`Available: ${Object.keys(TARGETS).join(', ')}`);
  process.exit(1);
}

targets.forEach((target) => {
  const targetFlag = target ? `--target ${target}` : '';
  console.log(`Building opcode-web${target ? ` for ${target}` : ''}...`);

  try {
    execSync(`cd src-tauri && cargo build --release --bin opcode-web ${targetFlag}`, {
      stdio: 'inherit',
    });
    console.log(`Build complete!`);
  } catch (error) {
    console.error(`Build failed:`, error.message);
    process.exit(1);
  }
});
```

---

## Implementation Phases

### Phase 1: Local Build Validation (1-2 days)

1. [ ] Create `scripts/fetch-and-build.js`
2. [ ] Test building `opcode-web` binary standalone
3. [ ] Verify binary runs without Tauri dependencies
4. [ ] Test on Linux, macOS, Windows locally

### Phase 2: npm Package Structure (1 day)

1. [ ] Create `npm/` directory structure
2. [ ] Implement `install.js` download script
3. [ ] Create platform wrapper scripts
4. [ ] Test local npm install with `npm pack` + `npm install`

### Phase 3: CI/CD Pipeline (1-2 days)

1. [ ] Create `.github/workflows/release.yml`
2. [ ] Configure cross-compilation for all targets
3. [ ] Set up artifact upload to GitHub Releases
4. [ ] Test release workflow with a tag

### Phase 4: npm Publishing (1 day)

1. [ ] Configure npm authentication in GitHub Secrets
2. [ ] Add npm publish step to release workflow
3. [ ] Test end-to-end: push tag → build → release → npm publish
4. [ ] Verify `npx opcode` works

### Phase 5: Documentation & Polish (1 day)

1. [ ] Update README with npx installation instructions
2. [ ] Add troubleshooting section
3. [ ] Document version bump process
4. [ ] Add changelog automation

---

## Platform Support Matrix

| Platform | Architecture | Binary Name | Priority |
|----------|--------------|-------------|----------|
| Linux | x64 | `opcode-linux-x64` | P0 |
| Linux | arm64 | `opcode-linux-arm64` | P1 |
| macOS | x64 (Intel) | `opcode-darwin-x64` | P0 |
| macOS | arm64 (Apple Silicon) | `opcode-darwin-arm64` | P0 |
| Windows | x64 | `opcode-win32-x64.exe` | P0 |
| Windows | arm64 | `opcode-win32-arm64.exe` | P2 |

---

## Binary Size Estimates

| Component | Estimated Size |
|-----------|----------------|
| opcode-web (stripped, LTO) | 15-25 MB |
| opcode-web + zstd compression | 5-10 MB |
| npm wrapper package | ~50 KB |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-compilation fails for arm64 | Medium | Use GitHub Actions runners with native arch or cross-rs |
| Binary too large for npm | Low | Host on GitHub Releases (current plan) |
| Claude CLI dependency not bundled | High | Document requirement or bundle claude-code binary |
| SSL/TLS issues on Linux | Medium | Use `native-tls-vendored` feature (already enabled) |

---

## Success Criteria

1. `npx opcode` works on fresh machine with only Node.js installed
2. Binary download completes in < 30 seconds on average connection
3. All P0 platforms supported
4. Version is synchronized across all package manifests
5. Release process is fully automated via git tags

---

## Open Questions

1. **Should we bundle Claude CLI?** The web server needs `claude` binary to execute commands. Options:
   - Require user to install Claude CLI separately (current behavior)
   - Bundle Claude CLI binary (legal/licensing concerns)
   - Provide fallback instructions if Claude not found

2. **npm package name availability?** Need to verify `opcode` is available on npm or choose alternative (`@asterisk/opcode`, `opcode-cli`, etc.)

3. **Tauri GUI via npx?** Current spec only covers `opcode-web`. Should we also distribute the full Tauri GUI? This would require:
   - Much larger binaries (~80-100MB)
   - Platform-specific GUI dependencies
   - Different distribution strategy (AppImage, DMG, MSI)

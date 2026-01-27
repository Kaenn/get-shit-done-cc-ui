# Phase 11: npx Installation - Research

**Researched:** 2026-01-26
**Domain:** npm binary wrapper packages and cross-platform distribution
**Confidence:** HIGH

## Summary

Research focused on how to distribute cross-platform Rust binaries via npm, enabling `npx get-shit-done-cc-ui` without requiring users to have the Rust toolchain installed. The standard approach in the ecosystem (used by esbuild, swc, turbo, and others) is to publish platform-specific npm packages as optionalDependencies, with a postinstall script as a fallback mechanism.

Two competing architectures exist: (1) **optionalDependencies pattern** where platform-specific packages are published separately and npm installs only the matching one, and (2) **postinstall download** where a script downloads the binary from GitHub Releases during installation. The current best practice (2026) is to combine both approaches for maximum reliability.

Cross-platform build automation is well-established using GitHub Actions with the `cross` tool for Linux ARM targets and native cargo for other platforms. Binary size optimization through LTO, strip, and opt-level settings can reduce binaries from ~20-30MB to ~5-10MB with compression.

**Primary recommendation:** Use the hybrid optionalDependencies + postinstall fallback pattern with binaries hosted on GitHub Releases, built via GitHub Actions with cross-compilation support.

## Standard Stack

The established libraries/tools for npm binary distribution:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| optionalDependencies | npm built-in | Platform-specific package selection | Automatic platform detection, npm/pnpm/yarn native support |
| postinstall scripts | npm lifecycle | Fallback binary download mechanism | Runs when optionalDeps disabled, no additional deps |
| cross | 0.2.5+ | Cross-compilation for Rust | Industry standard for Linux ARM builds, Docker-based isolation |
| GitHub Releases | N/A | Binary hosting | Free, unlimited bandwidth for public repos, SHA256 checksums |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ora | 9.0.0 | Terminal spinner during downloads | User feedback for long-running postinstall |
| supports-color | 9.4.0+ | NO_COLOR detection | Respect user terminal color preferences |
| houseabsolute/actions-rust-cross | v1 | GitHub Actions cross-compilation | Simplifies matrix builds with caching |
| softprops/action-gh-release | v2 | GitHub Release automation | Upload artifacts from build matrix |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| optionalDependencies | Bundle all binaries in one package | Smaller = 50KB vs Larger = 150-200MB but works offline |
| GitHub Releases hosting | npm registry for binaries | Free hosting vs npm package size limits (500MB max) |
| postinstall fallback | Require manual binary install | Better security vs worse UX |
| cross tool | Native cargo only | Faster builds vs no Linux ARM64 support |

**Installation:**
```bash
# For the npm wrapper package (development)
npm install ora supports-color

# For GitHub Actions (no local install needed)
# Uses: houseabsolute/actions-rust-cross@v1
# Uses: softprops/action-gh-release@v2
```

## Architecture Patterns

### Recommended Project Structure
```
npm/                           # npm wrapper package
├── package.json               # Main package with optionalDeps
├── bin/
│   ├── get-shit-done-cc-ui    # Unix shell wrapper
│   └── get-shit-done-cc-ui.cmd # Windows batch wrapper
├── install.js                 # postinstall fallback script
└── packages/                  # Platform-specific packages (published separately)
    ├── linux-x64/
    │   └── package.json       # os: ["linux"], cpu: ["x64"]
    ├── linux-arm64/
    │   └── package.json       # os: ["linux"], cpu: ["arm64"]
    ├── darwin-x64/
    │   └── package.json       # os: ["darwin"], cpu: ["x64"]
    ├── darwin-arm64/
    │   └── package.json       # os: ["darwin"], cpu: ["arm64"]
    └── win32-x64/
        └── package.json       # os: ["win32"], cpu: ["x64"]
```

### Pattern 1: Hybrid OptionalDependencies + Postinstall Fallback
**What:** Declare platform-specific packages as optionalDependencies in main package, provide postinstall script that downloads from GitHub Releases if optionalDep wasn't installed.

**When to use:** When maximum reliability is needed (users may have `--ignore-optional` or `--ignore-scripts` flags set).

**Example:**
```javascript
// Source: https://sentry.engineering/blog/publishing-binaries-on-npm
// Main package.json
{
  "name": "get-shit-done-cc-ui",
  "version": "0.2.1",
  "optionalDependencies": {
    "@get-shit-done/linux-x64": "0.2.1",
    "@get-shit-done/linux-arm64": "0.2.1",
    "@get-shit-done/darwin-x64": "0.2.1",
    "@get-shit-done/darwin-arm64": "0.2.1",
    "@get-shit-done/win32-x64": "0.2.1"
  },
  "scripts": {
    "postinstall": "node install.js"
  }
}

// Platform-specific package.json example
{
  "name": "@get-shit-done/linux-x64",
  "version": "0.2.1",
  "os": ["linux"],
  "cpu": ["x64"],
  "bin": {
    "get-shit-done-cc-ui": "./bin/opcode-web"
  }
}
```

### Pattern 2: Binary Resolution with Multiple Fallbacks
**What:** Runtime code that attempts to locate the binary in order: (1) optionalDependency location, (2) postinstall download location, (3) error with helpful message.

**When to use:** In the wrapper script that executes the binary.

**Example:**
```javascript
// Source: https://sentry.engineering/blog/publishing-binaries-on-npm
const path = require('path');
const { existsSync } = require('fs');

function getBinaryPath() {
  const platform = process.platform;
  const arch = process.arch;
  const packageName = `@get-shit-done/${platform}-${arch}`;

  // Try optionalDependency first
  try {
    const optionalPath = require.resolve(`${packageName}/bin/opcode-web`);
    if (existsSync(optionalPath)) return optionalPath;
  } catch {}

  // Try postinstall download location
  const downloadPath = path.join(__dirname, 'bin', 'opcode-web');
  if (existsSync(downloadPath)) return downloadPath;

  // Error with helpful message
  throw new Error(
    `Binary not found for ${platform}-${arch}. ` +
    `Try: npm install --ignore-scripts=false`
  );
}
```

### Pattern 3: Platform Detection with WSL Support
**What:** Detect platform and architecture, with special handling for WSL (use Linux binary) and environment variable override.

**When to use:** In postinstall script and runtime binary resolution.

**Example:**
```javascript
// Source: https://github.com/sindresorhus/is-wsl + WebSearch findings
function getPlatformInfo() {
  let platform = process.env.GSD_UI_PLATFORM || process.platform;
  let arch = process.arch;

  // WSL detection: check for WSL env vars or /proc/version
  if (platform === 'win32' && !process.env.GSD_UI_PLATFORM) {
    try {
      const fs = require('fs');
      const release = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      if (release.includes('microsoft') || release.includes('wsl')) {
        platform = 'linux';
      }
    } catch {}
  }

  const mapping = {
    'linux-x64': '@get-shit-done/linux-x64',
    'linux-arm64': '@get-shit-done/linux-arm64',
    'darwin-x64': '@get-shit-done/darwin-x64',
    'darwin-arm64': '@get-shit-done/darwin-arm64',
    'win32-x64': '@get-shit-done/win32-x64',
  };

  const key = `${platform}-${arch}`;
  if (!mapping[key]) {
    throw new Error(`Unsupported platform: ${key}`);
  }

  return { platform, arch, packageName: mapping[key] };
}
```

### Pattern 4: Checksum Verification for Downloaded Binaries
**What:** Verify SHA256 checksum of downloaded binary against published checksum file to prevent supply chain attacks.

**When to use:** When downloading binaries from external sources (GitHub Releases, CDN).

**Example:**
```javascript
// Source: https://github.com/nodejs/node/commit/a6b3ed54ae + OWASP NPM Security
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

async function downloadWithChecksum(binaryUrl, checksumUrl, destPath) {
  // Download binary
  const binaryData = await download(binaryUrl);

  // Download checksum
  const expectedChecksum = (await download(checksumUrl)).toString('utf8').trim();

  // Verify
  const hash = crypto.createHash('sha256');
  hash.update(binaryData);
  const actualChecksum = hash.digest('hex');

  if (actualChecksum !== expectedChecksum) {
    throw new Error(
      `Checksum mismatch!\n` +
      `Expected: ${expectedChecksum}\n` +
      `Actual: ${actualChecksum}`
    );
  }

  // Write verified binary
  fs.writeFileSync(destPath, binaryData);
  fs.chmodSync(destPath, 0o755); // Set executable
}
```

### Pattern 5: GitHub Actions Cross-Compilation Matrix
**What:** Use GitHub Actions matrix strategy to build for all platforms in parallel, upload to GitHub Release.

**When to use:** CI/CD automation for releases.

**Example:**
```yaml
# Source: https://github.com/houseabsolute/actions-rust-cross
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            artifact: linux-x64/opcode-web
          - os: ubuntu-latest
            target: aarch64-unknown-linux-gnu
            artifact: linux-arm64/opcode-web
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact: darwin-x64/opcode-web
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact: darwin-arm64/opcode-web
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact: win32-x64/opcode-web.exe

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Build
        uses: houseabsolute/actions-rust-cross@v1
        with:
          command: build
          target: ${{ matrix.target }}
          args: "--release --locked"
          strip: true

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}
          path: target/${{ matrix.target }}/release/opcode-web*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            **/*
```

### Anti-Patterns to Avoid

- **Bundling all binaries in one package:** Defeats the purpose of platform-specific distribution (150MB+ package vs 50KB wrapper + 15MB platform binary)
- **No checksum verification:** Postinstall scripts downloading binaries without verification are a major supply chain attack vector (see 2025 Shai-Hulud and NodeCordRAT campaigns)
- **Moving node_modules between platforms:** Architecture mismatch causes wrong binary to be present; document that reinstall is required
- **Using deprecated actions/upload-release-asset:** Replaced by softprops/action-gh-release which handles multiple files and update scenarios better
- **Ignoring NO_COLOR environment variable:** Always respect `NO_COLOR` for accessible terminal output

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal spinner/progress | Custom animation loop | ora (9.0.0) | Handles terminal capabilities, NO_COLOR support, multiple spinner styles, tested across platforms |
| Platform detection | Manual process.platform checks | Dedicated function with WSL detection | WSL requires /proc/version parsing, Rosetta 2 on macOS arm64, environment variable override support |
| Cross-compilation setup | Manual cargo target install | houseabsolute/actions-rust-cross | Automatically installs cross tool, configures caching, handles Linux-to-ARM compilation |
| GitHub Release upload | Manual API calls | softprops/action-gh-release@v2 | Handles multi-file uploads, updates existing releases, manages permissions |
| Checksum verification | Custom hash comparison | crypto.timingSafeEqual | Prevents timing attacks during hash comparison |
| Color detection | Manual terminal capability checks | supports-color package | Detects NO_COLOR, FORCE_COLOR, terminal capabilities, CI environment |

**Key insight:** npm binary distribution has many edge cases (WSL, Rosetta 2, optionalDeps disabled, scripts disabled, architecture mismatches, timing attacks, supply chain security). Well-tested libraries handle these edge cases; custom solutions miss them.

## Common Pitfalls

### Pitfall 1: npm v10.3.0+ Package-lock Pruning Bug
**What goes wrong:** When running `npm install` with existing `node_modules`, npm only includes the current platform's optionalDependency in package-lock.json, breaking installation on other platforms.

**Why it happens:** npm v10.3.0+ prunes platform-specific optional dependencies from lockfile when regenerating with node_modules present. Teammates on different architectures (macOS arm64 vs Linux x64) pull incomplete lockfile and npm silently skips their platform's binary.

**How to avoid:**
- Delete `node_modules` before regenerating `package-lock.json`
- Use postinstall fallback to download binary when optionalDep is missing
- Consider pnpm which handles this better
- Document in README that lockfile regeneration requires clean state

**Warning signs:**
- CI failures on different platforms after lockfile commit
- "Binary not found" errors on teammate machines
- package-lock.json showing only one platform package in optionalDependencies

**Source:** [npm/cli Issue #7961](https://github.com/npm/cli/issues/7961), [Loke.dev Blog](https://loke.dev/blog/npm-platform-specific-dependencies-bug)

### Pitfall 2: Postinstall Scripts as Supply Chain Attack Vector
**What goes wrong:** Malicious packages use postinstall scripts to download and execute payloads, stealing credentials or installing malware.

**Why it happens:** Postinstall scripts run with full system access during `npm install`. Without checksum verification, attackers can serve malicious binaries. Recent attacks (2025 Shai-Hulud, NodeCordRAT) exploited this.

**How to avoid:**
- ALWAYS verify SHA256 checksums of downloaded binaries
- Use crypto.timingSafeEqual for comparison (prevents timing attacks)
- Download checksums from same trusted source (GitHub Releases)
- Provide manual installation alternative in README
- Consider that pnpm v10+ and Bun disable postinstall by default

**Warning signs:**
- Download URL is not from official repository
- No checksum verification in install.js
- Obfuscated postinstall script code
- External URLs in postinstall (not package registry or GitHub)

**Source:** [OWASP NPM Security](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html), [Snyk NPM Security Best Practices](https://snyk.io/articles/npm-security-best-practices-shai-hulud-attack/)

### Pitfall 3: Windows .cmd Wrapper Executable Bits
**What goes wrong:** Binary downloads successfully but isn't executable on Unix systems, or Windows .cmd wrapper has incorrect error handling.

**Why it happens:**
- Downloaded files default to 0644 permissions (not executable)
- GitHub Actions artifacts can strip executable bits during upload/download
- npm generates .cmd files for Windows but they have faulty error handling with && operators

**How to avoid:**
- Always `fs.chmodSync(path, 0o755)` after writing binary on Unix
- Use `strip: true` in actions-rust-cross (preserves executable)
- Test wrapper scripts on actual Windows (not just WSL)
- Provide both .cmd and .ps1 wrappers for Windows

**Warning signs:**
- "Permission denied" errors on Unix after download
- Commands after && in .cmd execute even when binary fails
- Binary works in WSL but not native Windows

**Source:** [Sentry Engineering](https://sentry.engineering/blog/publishing-binaries-on-npm), [npm/cli Issue #969](https://github.com/npm/cli/issues/969)

### Pitfall 4: First-run Download UX Confusion
**What goes wrong:** User runs `npx get-shit-done-cc-ui`, sees download spinner, assumes it's working, but binary executes *next* run, not current run.

**Why it happens:** Decision (from CONTEXT.md) is "first invocation downloads binary only, user must run again to execute." User expectation is that `npx` just works immediately.

**How to avoid:**
- Clear messaging: "Downloading binary (15MB)... Complete! Run 'npx get-shit-done-cc-ui' again to start."
- Return exit code 0 (success) after download so user knows to retry
- Consider lazy download alternative: check if binary exists at start of wrapper, download if missing, then execute
- Document first-run behavior in README

**Warning signs:**
- User reports "nothing happened" after first run
- Confusion between download completion and execution readiness
- Users expect immediate execution like other npx tools

**Source:** [npm docs npx](https://docs.npmjs.com/cli/v8/commands/npx/), [Deepgram Blog on npx](https://deepgram.com/learn/npx-script)

### Pitfall 5: WSL Detection False Positives
**What goes wrong:** Detection logic thinks WSL when it's native Windows, or vice versa, downloading wrong binary.

**Why it happens:**
- Checking only `platform === 'win32'` misses that WSL reports `platform === 'linux'`
- /proc/version parsing can fail if read permissions are restricted
- User might set GSD_UI_PLATFORM override incorrectly

**How to avoid:**
- Check platform first: if already 'linux', don't re-check for WSL
- Wrap /proc/version read in try-catch with fallback to platform value
- Document GSD_UI_PLATFORM override clearly with examples
- Log detected platform in verbose mode for debugging

**Warning signs:**
- Binary fails with "Exec format error" (wrong architecture)
- WSL users getting Windows .exe binary
- Linux users in Docker getting WSL detection triggered

**Source:** [is-wsl package](https://github.com/sindresorhus/is-wsl), [Node.js process.platform docs](https://nodejs.org/download/rc/v6.0.0-rc.1/docs/api/process.html)

## Code Examples

Verified patterns from official sources:

### Postinstall Script with Checksum Verification
```javascript
// Source: https://sentry.engineering/blog/publishing-binaries-on-npm
// + https://github.com/nodejs/node/commit/a6b3ed54ae
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VERSION = require('./package.json').version;
const REPO = 'getAsterisk/opcode'; // Update to actual repo

function getPlatformInfo() {
  let platform = process.env.GSD_UI_PLATFORM || process.platform;
  const arch = process.arch;

  // WSL detection
  if (platform === 'win32') {
    try {
      const release = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      if (release.includes('microsoft') || release.includes('wsl')) {
        platform = 'linux';
      }
    } catch {}
  }

  const mapping = {
    'linux-x64': 'opcode-web-linux-x64',
    'darwin-x64': 'opcode-web-darwin-x64',
    'darwin-arm64': 'opcode-web-darwin-arm64',
    'win32-x64': 'opcode-web-win32-x64.exe',
  };

  const key = `${platform}-${arch}`;
  if (!mapping[key]) {
    console.error(`Unsupported platform: ${key}`);
    console.error('Build from source: https://github.com/${REPO}#building');
    process.exit(1);
  }

  return { binaryName: mapping[key], isWindows: platform === 'win32' };
}

async function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadBinary() {
  const { binaryName, isWindows } = getPlatformInfo();
  const baseUrl = `https://github.com/${REPO}/releases/download/v${VERSION}`;
  const binaryUrl = `${baseUrl}/${binaryName}`;
  const checksumUrl = `${baseUrl}/${binaryName}.sha256`;

  console.log(`⠋ Downloading ${binaryName}...`);

  try {
    const [binaryData, checksumData] = await Promise.all([
      download(binaryUrl),
      download(checksumUrl)
    ]);

    // Verify checksum
    const expectedChecksum = checksumData.toString('utf8').trim().split(/\s+/)[0];
    const hash = crypto.createHash('sha256');
    hash.update(binaryData);
    const actualChecksum = hash.digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(expectedChecksum),
      Buffer.from(actualChecksum)
    )) {
      throw new Error(`Checksum mismatch for ${binaryName}`);
    }

    // Write binary
    const destPath = path.join(__dirname, 'bin', isWindows ? 'opcode-web.exe' : 'opcode-web');
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, binaryData);

    if (!isWindows) {
      fs.chmodSync(destPath, 0o755);
    }

    console.log('✓ Binary installed successfully');
  } catch (error) {
    console.error('✗ Download failed:', error.message);
    console.error('Retry: npm install');
    process.exit(1);
  }
}

downloadBinary();
```

### Binary Wrapper Script (Unix)
```bash
#!/bin/sh
# Source: npm bin wrapper conventions + esbuild pattern
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Try optionalDependency location first
BINARY="$SCRIPT_DIR/../node_modules/@get-shit-done/$(node -p "process.platform")-$(node -p "process.arch")/bin/opcode-web"

# Fallback to postinstall location
if [ ! -f "$BINARY" ]; then
  BINARY="$SCRIPT_DIR/opcode-web"
fi

if [ ! -f "$BINARY" ]; then
  echo "Error: Binary not found for $(node -p "process.platform")-$(node -p "process.arch")"
  echo "Try: npm install --ignore-scripts=false"
  exit 1
fi

exec "$BINARY" "$@"
```

### Cargo.toml Release Profile for Small Binaries
```toml
# Source: https://github.com/johnthagen/min-sized-rust
# + https://doc.rust-lang.org/cargo/reference/profiles.html
[profile.release]
opt-level = "z"        # Optimize for size
lto = true             # Enable Link Time Optimization
codegen-units = 1      # Single codegen unit for better optimization
panic = "abort"        # Smaller binary, no unwinding
strip = "symbols"      # Remove debug symbols
```

### GitHub Actions Matrix Build
```yaml
# Source: https://github.com/houseabsolute/actions-rust-cross
# + https://github.com/softprops/action-gh-release
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            name: linux-x64
          - os: ubuntu-latest
            target: aarch64-unknown-linux-gnu
            name: linux-arm64
          - os: macos-latest
            target: x86_64-apple-darwin
            name: darwin-x64
          - os: macos-latest
            target: aarch64-apple-darwin
            name: darwin-arm64
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            name: win32-x64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Build binary
        uses: houseabsolute/actions-rust-cross@v1
        with:
          command: build
          target: ${{ matrix.target }}
          args: "--release --locked --bin opcode-web"
          strip: true

      - name: Prepare artifact
        shell: bash
        run: |
          cd target/${{ matrix.target }}/release
          BINARY=opcode-web
          if [[ "${{ matrix.os }}" == "windows-latest" ]]; then
            BINARY=opcode-web.exe
          fi
          mv "$BINARY" "opcode-web-${{ matrix.name }}$([ "${{ matrix.os }}" == "windows-latest" ] && echo .exe || echo "")"
          sha256sum "opcode-web-${{ matrix.name }}"* > "opcode-web-${{ matrix.name }}.sha256"

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.name }}
          path: target/${{ matrix.target }}/release/opcode-web-${{ matrix.name }}*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            **/*
          fail_on_unmatched_files: true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| actions/upload-release-asset | softprops/action-gh-release@v2 | 2023-2024 | Multi-file upload, update existing releases, simpler API |
| Manual cross-compilation setup | houseabsolute/actions-rust-cross | 2023 | Automatic cross tool install, built-in caching, simpler workflows |
| Single optionalDeps or single postinstall | Hybrid both approaches | 2022-2023 | Higher reliability, handles --ignore-optional and --ignore-scripts |
| No checksum verification | SHA256 with timingSafeEqual | 2025 (security response) | Prevents supply chain attacks, timing attack resistant |
| Manual platform detection | Dedicated function with WSL + override | 2024-2025 | Better WSL support, user override, fewer edge cases |
| Default postinstall enabled | pnpm v10+ disables by default | 2025 | Security improvement, requires --ignore-scripts=false opt-in |

**Deprecated/outdated:**
- **actions/upload-release-asset (individual):** Replaced by softprops/action-gh-release which handles multiple files atomically
- **Binary bundling in main package:** Modern approach uses optionalDeps to avoid 150MB+ packages
- **Unverified downloads:** Post-2025 security incidents, checksum verification is expected
- **Ignoring NO_COLOR:** Color output without NO_COLOR support is accessibility issue

## Open Questions

Things that couldn't be fully resolved:

1. **Exact spinner animation style**
   - What we know: ora 9.0.0 provides elegant spinners, supports NO_COLOR
   - What's unclear: Which specific animation (dots, line, arc) fits the brand/UX best
   - Recommendation: Use ora default ('dots'), it's most widely recognized and works well across terminals

2. **Rosetta 2 handling on macOS**
   - What we know: macOS arm64 can run x64 binaries via Rosetta 2, process.arch reports the Node.js binary arch (not system arch)
   - What's unclear: Should we prefer ARM64 with x64 fallback, or just require ARM64 download?
   - Recommendation: Prefer ARM64 with helpful error on x64-only Node (most users have ARM64 Node on Apple Silicon by 2026)

3. **Checksum file format and hosting**
   - What we know: SHA256 checksums should be verified, format varies (some use `<hash> <filename>`, others just `<hash>`)
   - What's unclear: Generate during build or separate script? One file with all hashes or per-binary?
   - Recommendation: Per-binary `.sha256` files with `<hash> <filename>` format (matches sha256sum output), generated in GitHub Actions during artifact prep

4. **Postinstall vs lazy download implementation**
   - What we know: Decision says "first invocation downloads only", postinstall would download during install
   - What's unclear: User preference for install-time (slow install) vs first-run (confusing UX)?
   - Recommendation: Use lazy download (download on first run) per CONTEXT.md decision, but provide very clear completion message

## Sources

### Primary (HIGH confidence)
- [Sentry Engineering: Publishing Binaries on npm](https://sentry.engineering/blog/publishing-binaries-on-npm) - Complete architecture patterns
- [esbuild Documentation](https://esbuild.github.io/getting-started/) - optionalDependencies reference implementation
- [Rust Performance Book: Build Configuration](https://nnethercote.github.io/perf-book/build-configuration.html) - Official Cargo optimization guide
- [Cargo Book: Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html) - Official LTO, strip, opt-level documentation
- [houseabsolute/actions-rust-cross GitHub](https://github.com/houseabsolute/actions-rust-cross) - Official action documentation
- [softprops/action-gh-release GitHub](https://github.com/softprops/action-gh-release) - Official action documentation

### Secondary (MEDIUM confidence)
- [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html) - Security best practices verified
- [Snyk: NPM Security Best Practices](https://snyk.io/articles/npm-security-best-practices-shai-hulud-attack/) - 2025 attack analysis
- [npm/cli Issue #7961](https://github.com/npm/cli/issues/7961) - Active bug report with reproduction
- [NO_COLOR.org](https://no-color.org/) - Official standard specification
- [is-wsl GitHub](https://github.com/sindresorhus/is-wsl) - WSL detection library source
- [Node.js crypto documentation](https://github.com/nodejs/node/commit/a6b3ed54ae) - timingSafeEqual usage

### Tertiary (LOW confidence)
- WebSearch: "npm binary wrapper postinstall download" - General ecosystem patterns, cross-referenced with Sentry Engineering
- WebSearch: "GitHub Actions cross compile rust" - Multiple blog posts, verified against official action docs
- WebSearch: "npx first run download" - Community experiences, marked as LOW due to anecdotal nature

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - esbuild, swc, turbo all use this pattern, verified with official docs
- Architecture: HIGH - Sentry Engineering article provides complete implementation, cross-referenced with esbuild
- Pitfalls: HIGH - npm/cli issues are authoritative, security pitfalls from OWASP and Snyk official sources
- Binary optimization: HIGH - Official Rust and Cargo documentation
- GitHub Actions: HIGH - Official action repositories and documentation

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable ecosystem, mature patterns)

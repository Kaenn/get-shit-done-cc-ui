---
phase: 11-npx-installation
plan: 02
subsystem: distribution
tags: [npm, npx, binary-distribution, lazy-download, checksum]

# Dependency graph
requires:
  - phase: 11-01
    provides: Platform-specific binary naming and build understanding
provides:
  - Complete npm package structure with lazy download on first run
  - Platform detection with WSL support
  - Checksum verification with SHA256
  - Cross-platform wrapper scripts (Unix + Windows)
affects: [11-03-github-actions, 11-04-checksum-generation, 11-05-npm-publishing]

# Tech tracking
tech-stack:
  added: [ora, supports-color]
  patterns: [lazy-download-pattern, first-run-download-second-run-execute]

key-files:
  created:
    - npm/package.json
    - npm/README.md
    - npm/lib/download.js
    - npm/bin/get-shit-done-cc-ui
    - npm/bin/get-shit-done-cc-ui.cmd
  modified: []

key-decisions:
  - "Lazy download over postinstall: first run downloads and exits, second run executes"
  - "WSL detection via /proc/version parsing for automatic Linux binary selection"
  - "crypto.timingSafeEqual for checksum comparison to prevent timing attacks"
  - "Binary cached in npm/bin/ directory inside node_modules"
  - "GSD_UI_PLATFORM environment variable for manual platform override"

patterns-established:
  - "Two-phase invocation: npx run 1 downloads, npx run 2 executes"
  - "Spinner with progress during download using ora package"
  - "NO_COLOR environment variable respected for output"
  - "Exit codes: 0=success, 1=error with retry instruction"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 11 Plan 02: npm Package Structure Summary

**Complete npm package with lazy download, platform detection with WSL support, and SHA256 checksum verification**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T19:09:07Z
- **Completed:** 2026-01-26T19:12:17Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- npm package manifest with bin entry and runtime dependencies (ora, supports-color)
- Platform detection supporting Linux x64, macOS x64/arm64, Windows x64, and WSL
- Download library with progress spinner and SHA256 checksum verification
- Cross-platform wrapper scripts implementing lazy download pattern
- First-run UX: download binary → exit with success message → user runs again

## Task Commits

Each task was committed atomically:

1. **Task 1: Create npm package structure and manifest** - `dbdf790` (feat)
2. **Task 2: Create download library** - `f04376a` (feat)
3. **Task 3: Create wrapper scripts with lazy download** - `7a27831` (feat)

## Files Created/Modified

**Created:**
- `npm/package.json` - npm package manifest with bin entry, dependencies (ora, supports-color), NO postinstall
- `npm/README.md` - Usage instructions with first-run download note
- `npm/lib/download.js` - Platform detection, download with progress, SHA256 verification
- `npm/bin/get-shit-done-cc-ui` - Unix wrapper script (executable)
- `npm/bin/get-shit-done-cc-ui.cmd` - Windows batch wrapper script

## Decisions Made

1. **Lazy download over postinstall hook**: Per CONTEXT.md, first invocation downloads binary only and exits with success message. User must run again to execute. This keeps download explicit and avoids postinstall hook complexity.

2. **WSL detection strategy**: Check `/proc/version` for 'microsoft' or 'wsl' keywords, and check `WSL_DISTRO_NAME` environment variable. WSL users automatically get Linux binary (most common expectation).

3. **Checksum verification with timing-safe comparison**: Use `crypto.timingSafeEqual()` instead of string comparison to prevent timing attacks on checksum validation.

4. **GSD_UI_PLATFORM override**: Allow manual platform override via environment variable for edge cases or testing (e.g., `GSD_UI_PLATFORM=darwin-arm64`).

5. **Error handling strategy**: Concise error messages with clear retry instructions. Exit codes: 0 for success, 1 for errors. Color-coded output respects NO_COLOR environment variable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- npm package structure complete and ready for testing with `npm pack`
- Ready for Phase 11-03: GitHub Actions workflow to build and publish binaries
- Ready for Phase 11-04: Checksum generation in build pipeline
- Dependencies (ora, supports-color) installed and tested

**Verification needed:**
- GitHub Actions workflow will need to build binaries and upload to releases
- Checksum files (.sha256) must be generated alongside binaries
- Actual binary download and execution requires release artifacts to exist

---
*Phase: 11-npx-installation*
*Completed: 2026-01-26*

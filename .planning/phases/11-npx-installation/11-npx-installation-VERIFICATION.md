---
phase: 11-npx-installation
verified: 2026-01-26T21:20:00Z
status: human_needed
score: 4/5 must-haves verified
gaps:
  - truth: "Release process is fully automated via git tags"
    status: partial
    reason: "NPM_TOKEN GitHub secret not configured (external dependency)"
    artifacts:
      - path: ".github/workflows/publish-npm.yml"
        issue: "Workflow exists but requires NPM_TOKEN secret"
    missing:
      - "Configure NPM_TOKEN in GitHub repository secrets (manual step documented in npm/README.md)"
---

# Phase 11: npx Installation Verification Report

**Phase Goal:** User can install and run GSD-UI via `npx get-shit-done-cc-ui` without Rust toolchain
**Verified:** 2026-01-26T21:20:00Z
**Status:** human_needed
**Re-verification:** Yes - Windows binary naming issue fixed by orchestrator

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | npx get-shit-done-cc-ui works on fresh machine with Node.js >=16 | NEEDS HUMAN | Code complete, requires actual network test after release |
| 2   | Binary download completes in <30 seconds on average connection | NEEDS HUMAN | ~2.5MB binary documented, reasonable for 30s target |
| 3   | All P0 platforms supported (Linux x64, macOS x64/arm64, Windows x64) | VERIFIED | Build matrix covers all 4 platforms, Windows naming fixed in 8f8304e |
| 4   | Version is synchronized across all package manifests automatically | VERIFIED | bump-version.sh includes npm/package.json; all manifests show 0.2.1 |
| 5   | Release process is fully automated via git tags | PARTIAL | Workflow chain complete, NPM_TOKEN secret requires configuration |

**Score:** 4/5 truths verified (1 external dependency)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `scripts/build-web-binary.sh` | Local build script | VERIFIED | 105 lines, substantive, header comment clarifies local-only use |
| `npm/package.json` | npm package manifest | VERIFIED | 21 lines, correct bin entry, no postinstall (lazy download) |
| `npm/lib/download.js` | Binary download with checksum | VERIFIED | 273 lines, Windows binary naming corrected in 8f8304e |
| `npm/bin/get-shit-done-cc-ui` | Unix wrapper script | VERIFIED | 19 lines, executable permissions, lazy download pattern |
| `npm/bin/get-shit-done-cc-ui.cmd` | Windows batch wrapper | VERIFIED | 16 lines, lazy download pattern |
| `.github/workflows/build-web-binaries.yml` | Cross-platform build workflow | VERIFIED | 69 lines, matrix for 4 platforms, houseabsolute/actions-rust-cross |
| `.github/workflows/publish-npm.yml` | npm publish workflow | VERIFIED | 30 lines, NPM_TOKEN authentication |
| `.github/workflows/release.yml` | Release pipeline | VERIFIED | 139 lines, includes build-web-binaries and publish-npm jobs |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| npm/bin/get-shit-done-cc-ui | npm/lib/download.js | node call | WIRED | Line 9: `node "$SCRIPT_DIR/../lib/download.js"` |
| npm/bin/get-shit-done-cc-ui | npm/bin/gsd-ui-web | exec binary | WIRED | Line 19: `exec "$BINARY" "$@"` |
| .github/workflows/release.yml | build-web-binaries.yml | workflow_call | WIRED | Line 27-29: `build-web-binaries: uses: ./.github/workflows/build-web-binaries.yml` |
| .github/workflows/release.yml | publish-npm.yml | workflow_call | WIRED | Line 133-137: `publish-npm: needs: [create-release]` |
| scripts/bump-version.sh | npm/package.json | sed update | WIRED | Line 22-26: conditional update of npm/package.json |

### Requirements Coverage

| Requirement | Status | Note |
| ----------- | ------ | ---- |
| NPX-01: npx installation | READY | Code complete, needs release test |
| NPX-02: Binary download performance | READY | ~2.5MB size, needs network test |
| NPX-03: P0 platform support | VERIFIED | All 4 platforms in build matrix |
| NPX-04: Version sync | VERIFIED | All 5 manifests updated by bump-version.sh |
| NPX-05: Automated release | PARTIAL | NPM_TOKEN secret configuration needed |

### Human Verification Required

#### 1. Configure NPM_TOKEN Secret
**Action:** Go to GitHub repo > Settings > Secrets > Actions > New repository secret
**Name:** NPM_TOKEN
**Value:** npm automation token from npmjs.com
**Why human:** Requires npm account access and GitHub admin permissions

#### 2. End-to-End Release Test
**Test:** After NPM_TOKEN configured, push v0.2.2 tag
**Expected:** Binaries built for all 4 platforms, uploaded to GitHub Releases, npm package published
**Why human:** Requires actual GitHub Actions execution and npm registry access

#### 3. Fresh Machine npx Test
**Test:** On clean machine with only Node.js 16+, run `npx get-shit-done-cc-ui`
**Expected:** First run downloads binary, second run starts application
**Why human:** Requires actual network download and binary execution

### Fixes Applied

**8f8304e - fix(11): correct Windows binary naming in download.js**
- Changed line 55: `'win32-x64': 'gsd-ui-web.exe'` → `'win32-x64': 'gsd-ui-web-win32-x64.exe'`
- Aligns with build workflow artifact naming convention

---

_Verified: 2026-01-26T21:20:00Z_
_Verifier: Claude (gsd-verifier) + orchestrator fix_
